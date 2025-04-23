const cron = require('node-cron');
const fs = require('fs-extra');
const path = require('path');
const winston = require('winston');
const dotenv = require('dotenv');
const { generateCompleteBlogPost } = require('./blogGenerator');
const keywords = require('./keywords');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

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
    new winston.transports.File({ filename: path.join(__dirname, '../logs/scheduler.log') })
  ]
});

// Create tracking file directory
const trackingDir = path.join(__dirname, '../content');
const trackingFile = path.join(trackingDir, 'keywords-used.json');

/**
 * Get unused keywords
 * @returns {Array} Array of unused keywords
 */
async function getUnusedKeywords() {
  // Ensure tracking directory exists
  await fs.ensureDir(trackingDir);
  
  // Check if tracking file exists, create if not
  if (!await fs.pathExists(trackingFile)) {
    await fs.writeFile(trackingFile, JSON.stringify({ used: [] }));
    return keywords;
  }
  
  // Read used keywords
  const trackingData = JSON.parse(await fs.readFile(trackingFile, 'utf8'));
  const usedKeywords = trackingData.used || [];
  
  // Filter out used keywords
  const unusedKeywords = keywords.filter(keyword => !usedKeywords.includes(keyword));
  
  // If all keywords used, start over
  if (unusedKeywords.length === 0) {
    logger.info('All keywords have been used. Resetting tracking.');
    await fs.writeFile(trackingFile, JSON.stringify({ used: [] }));
    return keywords;
  }
  
  return unusedKeywords;
}

/**
 * Mark keyword as used
 * @param {string} keyword - The keyword to mark
 */
async function markKeywordAsUsed(keyword) {
  // Ensure tracking directory exists
  await fs.ensureDir(trackingDir);
  
  // Read current tracking data
  let trackingData = { used: [] };
  if (await fs.pathExists(trackingFile)) {
    trackingData = JSON.parse(await fs.readFile(trackingFile, 'utf8'));
  }
  
  // Add keyword if not already there
  if (!trackingData.used.includes(keyword)) {
    trackingData.used.push(keyword);
    await fs.writeFile(trackingFile, JSON.stringify(trackingData, null, 2));
  }
}

/**
 * Generate and publish a new blog post
 */
async function publishNewPost() {
  try {
    logger.info('Starting scheduled blog post generation');
    
    // Get unused keywords
    const unusedKeywords = await getUnusedKeywords();
    
    // Pick a random keyword
    const randomIndex = Math.floor(Math.random() * unusedKeywords.length);
    const selectedKeyword = unusedKeywords[randomIndex];
    
    logger.info(`Selected keyword: ${selectedKeyword}`);
    
    // Generate blog post
    const blogPost = await generateCompleteBlogPost(selectedKeyword);
    
    // Mark keyword as used
    await markKeywordAsUsed(selectedKeyword);
    
    logger.info(`Successfully published new blog post: ${blogPost.title}`);
    
    return blogPost;
  } catch (error) {
    logger.error(`Error publishing new post: ${error.message}`);
    throw error;
  }
}

/**
 * Start the scheduler
 */
function startScheduler() {
  const schedulePattern = process.env.PUBLISH_SCHEDULE || '0 8 * * *'; // Default: Every day at 8 AM
  
  logger.info(`Starting blog scheduler with pattern: ${schedulePattern}`);
  
  // Validate cron pattern
  if (!cron.validate(schedulePattern)) {
    logger.error(`Invalid cron pattern: ${schedulePattern}`);
    return false;
  }
  
  // Schedule job
  const job = cron.schedule(schedulePattern, async () => {
    logger.info('Running scheduled blog post generation');
    try {
      await publishNewPost();
    } catch (error) {
      logger.error(`Error in scheduled job: ${error.message}`);
    }
  });
  
  // Start the job
  job.start();
  
  logger.info('Blog scheduler started successfully');
  return true;
}

/**
 * Generate a single post immediately
 * @returns {Promise} Resolves to the generated post
 */
async function generateSinglePost() {
  logger.info('Generating single blog post on demand');
  return await publishNewPost();
}

module.exports = {
  startScheduler,
  generateSinglePost,
  getUnusedKeywords
};