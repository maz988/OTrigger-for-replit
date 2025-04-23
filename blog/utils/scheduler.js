const cron = require('node-cron');
const { generateCompleteBlogPost } = require('./blogGenerator');
const { getRandomUnusedKeyword, getUnusedKeywords, markKeywordAsUsed } = require('./keywords');
const fs = require('fs-extra');
const path = require('path');
const winston = require('winston');

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
    new winston.transports.File({ filename: path.join(__dirname, '../logs/scheduler.log') })
  ]
});

// Store the current job
let currentJob = null;

/**
 * Get unused keywords
 * @returns {Array} Array of unused keywords
 */
async function getUnusedKeywords() {
  try {
    // Ensure the keyword tracking is initialized
    const { initializeKeywordTracking } = require('./keywords');
    await initializeKeywordTracking();
    
    // Get unused keywords
    const unusedKeywords = require('./keywords').getUnusedKeywords();
    return unusedKeywords;
  } catch (error) {
    logger.error(`Error getting unused keywords: ${error.message}`);
    return [];
  }
}

/**
 * Mark keyword as used
 * @param {string} keyword - The keyword to mark
 */
async function markKeywordAsUsed(keyword) {
  try {
    await require('./keywords').markKeywordAsUsed(keyword);
    logger.info(`Marked keyword as used: "${keyword}"`);
  } catch (error) {
    logger.error(`Error marking keyword as used: ${error.message}`);
  }
}

/**
 * Generate and publish a new blog post
 */
async function publishNewPost() {
  try {
    logger.info('Starting scheduled blog post generation');
    
    // Get a random unused keyword
    const keyword = getRandomUnusedKeyword();
    
    if (!keyword) {
      logger.error('No unused keywords available');
      return;
    }
    
    logger.info(`Selected keyword for blog post: "${keyword}"`);
    
    // Generate the blog post
    await generateCompleteBlogPost(keyword);
    
    logger.info('Scheduled blog post generation completed successfully');
  } catch (error) {
    logger.error(`Error in scheduled blog post generation: ${error.message}`);
  }
}

/**
 * Start the scheduler
 */
function startScheduler() {
  // Default schedule: every day at 8 AM
  const schedule = process.env.PUBLISH_SCHEDULE || '0 8 * * *';
  
  logger.info(`Starting blog post scheduler with schedule: ${schedule}`);
  
  try {
    // Validate the cron expression
    if (!cron.validate(schedule)) {
      logger.error(`Invalid cron expression: ${schedule}`);
      return false;
    }
    
    // Schedule the job
    currentJob = cron.schedule(schedule, publishNewPost, {
      scheduled: true,
      timezone: "America/New_York" // Default to Eastern Time
    });
    
    logger.info('Blog post scheduler started successfully');
    
    // Return the job for potential cancellation
    return currentJob;
  } catch (error) {
    logger.error(`Error starting scheduler: ${error.message}`);
    return false;
  }
}

/**
 * Stop the scheduler
 */
function stopScheduler() {
  if (currentJob) {
    currentJob.stop();
    logger.info('Blog post scheduler stopped');
    return true;
  }
  
  logger.warn('No active scheduler to stop');
  return false;
}

/**
 * Generate a single post immediately
 * @returns {Promise} Resolves to the generated post
 */
async function generateSinglePost() {
  try {
    logger.info('Starting manual blog post generation');
    
    // Get a random unused keyword
    const keyword = getRandomUnusedKeyword();
    
    if (!keyword) {
      logger.error('No unused keywords available');
      throw new Error('No unused keywords available');
    }
    
    logger.info(`Selected keyword for manual blog post: "${keyword}"`);
    
    // Generate the blog post
    const blogPost = await generateCompleteBlogPost(keyword);
    
    logger.info('Manual blog post generation completed successfully');
    
    return blogPost;
  } catch (error) {
    logger.error(`Error in manual blog post generation: ${error.message}`);
    throw error;
  }
}

/**
 * Generate a post with a specific keyword
 * @param {string} keyword - The keyword to use
 * @returns {Promise} Resolves to the generated post
 */
async function generatePostWithKeyword(keyword) {
  try {
    if (!keyword) {
      throw new Error('No keyword provided');
    }
    
    logger.info(`Starting blog post generation with keyword: "${keyword}"`);
    
    // Generate the blog post
    const blogPost = await generateCompleteBlogPost(keyword);
    
    logger.info(`Blog post generation for "${keyword}" completed successfully`);
    
    return blogPost;
  } catch (error) {
    logger.error(`Error generating blog post with keyword "${keyword}": ${error.message}`);
    throw error;
  }
}

// Export the functions
module.exports = {
  startScheduler,
  stopScheduler,
  publishNewPost,
  generateSinglePost,
  generatePostWithKeyword,
  getUnusedKeywords,
  markKeywordAsUsed
};