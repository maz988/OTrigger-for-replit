/**
 * Main server file for Obsession Trigger Blog
 * This server handles both serving the static blog files and
 * scheduling automatic blog post generation
 */

const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const dotenv = require('dotenv');
const { startScheduler, generateSinglePost, getUnusedKeywords } = require('./utils/scheduler');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(__dirname, 'logs/server.log') })
  ]
});

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle JSON in requests
app.use(express.json());

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/keywords', async (req, res) => {
  try {
    const unusedKeywords = await getUnusedKeywords();
    res.json({ keywords: unusedKeywords });
  } catch (error) {
    logger.error(`Error getting keywords: ${error.message}`);
    res.status(500).json({ error: 'Failed to get keywords' });
  }
});

app.post('/api/generate', async (req, res) => {
  try {
    logger.info('Manual blog post generation requested');
    const keyword = req.body.keyword;
    
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }
    
    res.json({ status: 'generating', message: `Starting generation for keyword: ${keyword}` });
    
    // We'll generate the post asynchronously to avoid timing out the request
    generateSinglePost()
      .then(post => {
        logger.info(`Successfully generated post: ${post.title}`);
      })
      .catch(error => {
        logger.error(`Error in manual generation: ${error.message}`);
      });
  } catch (error) {
    logger.error(`Error in generate endpoint: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate post' });
  }
});

// Fallback route - serve index.html for non-specific routes
app.get('*', (req, res) => {
  // Check if the request is for an HTML file
  const htmlFile = path.join(__dirname, 'public', req.path + '.html');
  if (fs.existsSync(htmlFile)) {
    return res.sendFile(htmlFile);
  }
  
  // Check if the request is for a directory with an index.html
  const dirIndexFile = path.join(__dirname, 'public', req.path, 'index.html');
  if (fs.existsSync(dirIndexFile)) {
    return res.sendFile(dirIndexFile);
  }
  
  // Otherwise, fallback to the main index.html
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Start the blog post scheduler
  const schedulerStarted = startScheduler();
  if (schedulerStarted) {
    logger.info('Blog post scheduler started successfully');
  } else {
    logger.error('Failed to start blog post scheduler');
  }
  
  // Generate an initial post if there are no posts yet
  const indexPath = path.join(__dirname, 'content/index.json');
  fs.pathExists(indexPath)
    .then(exists => {
      if (!exists) {
        logger.info('No existing posts found, generating initial post...');
        return generateSinglePost();
      }
      return fs.readFile(indexPath, 'utf8')
        .then(data => {
          const blogIndex = JSON.parse(data);
          if (blogIndex.length === 0) {
            logger.info('Blog index is empty, generating initial post...');
            return generateSinglePost();
          }
          logger.info(`Found ${blogIndex.length} existing blog posts`);
          return null;
        });
    })
    .then(post => {
      if (post) {
        logger.info(`Initial post generated: ${post.title}`);
      }
    })
    .catch(error => {
      logger.error(`Error during initialization: ${error.message}`);
    });
});