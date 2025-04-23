/**
 * Main server file for Obsession Trigger Blog
 * This server handles both serving the static blog files and
 * scheduling automatic blog post generation
 */

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs-extra');
const winston = require('winston');
const { startScheduler, generateSinglePost, generatePostWithKeyword } = require('./utils/scheduler');
const { ensureDataDirectories } = require('./utils/openai');
const { initializeKeywordTracking } = require('./utils/keywords');

// Load environment variables
dotenv.config();

// Initialize logger
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

// Ensure required directories exist
async function setupDirectories() {
  try {
    await ensureDataDirectories();
    await fs.ensureDir(path.join(__dirname, 'logs'));
    await fs.ensureDir(path.join(__dirname, 'data'));
    await fs.ensureDir(path.join(__dirname, 'public/images'));
    await fs.ensureDir(path.join(__dirname, 'public/posts'));
  } catch (error) {
    logger.error(`Error setting up directories: ${error.message}`);
    throw error;
  }
}

// Initialize the keyword tracking system
async function initializeTracking() {
  try {
    await initializeKeywordTracking();
    logger.info('Keyword tracking initialized');
  } catch (error) {
    logger.error(`Error initializing keyword tracking: ${error.message}`);
  }
}

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON requests
app.use(express.json());

// API routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route to handle requests for blog posts
app.get('/posts/:slug', (req, res) => {
  const slug = req.params.slug;
  const htmlPath = path.join(__dirname, 'public/posts', `${slug}`);
  
  // First check if the slug includes the .html extension
  if (slug.endsWith('.html')) {
    res.sendFile(htmlPath);
  } else {
    // If no extension, redirect to the HTML file
    res.redirect(`/posts/${slug}.html`);
  }
});

// Route to serve the articles page
app.get('/articles', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/articles.html'));
});

// Admin API routes (protected in production)
if (process.env.NODE_ENV !== 'production') {
  // Route to manually generate a blog post
  app.post('/api/admin/generate-post', async (req, res) => {
    try {
      const keyword = req.body.keyword;
      
      let result;
      if (keyword) {
        logger.info(`Manual post generation requested with keyword: "${keyword}"`);
        result = await generatePostWithKeyword(keyword);
      } else {
        logger.info('Manual post generation requested with random keyword');
        result = await generateSinglePost();
      }
      
      res.status(200).json({
        success: true,
        message: 'Blog post generated successfully',
        post: {
          title: result.title,
          slug: result.slug,
          url: `/posts/${result.slug}.html`
        }
      });
    } catch (error) {
      logger.error(`Error in manual post generation: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to generate blog post',
        error: error.message
      });
    }
  });
}

// Handle 404s
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Server error: ${err.message}`);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Start the server
async function startServer() {
  try {
    // Setup directories first
    await setupDirectories();
    
    // Initialize keyword tracking
    await initializeTracking();
    
    // Start the server
    app.listen(PORT, () => {
      logger.info(`Obsession Trigger Blog server running on port ${PORT}`);
      
      // Start the blog post scheduler
      if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
        const scheduler = startScheduler();
        if (scheduler) {
          logger.info('Blog post scheduler started');
        } else {
          logger.warn('Failed to start blog post scheduler');
        }
      } else {
        logger.info('Blog post scheduler disabled in development mode');
      }
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Start the server
startServer();