/**
 * Script to test blog post generation with a random keyword
 * Usage: node scripts/test-blog-generation.js [--noimage]
 */

const path = require('path');
const dotenv = require('dotenv');
const { generateSinglePost } = require('../utils/scheduler');
const { ensureDataDirectories } = require('../utils/openai');
const { initializeKeywordTracking } = require('../utils/keywords');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Check if we should skip image generation (for faster testing)
const skipImages = process.argv.includes('--noimage');

async function main() {
  try {
    console.log('Starting blog post generation test...');
    
    // Ensure all required directories exist
    await ensureDataDirectories();
    await initializeKeywordTracking();
    
    // Log the generation with or without images
    if (skipImages) {
      console.log('Skipping image generation for faster testing');
      // TODO: Temporarily modify the image search function to skip
    }
    
    console.log('Generating blog post with random keyword');
    const startTime = Date.now();
    
    // Generate a post with a random keyword
    const blogPost = await generateSinglePost();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // in seconds
    
    console.log('\n===== Blog Post Generated Successfully =====');
    console.log(`Title: ${blogPost.title}`);
    console.log(`Keyword: ${blogPost.keyword}`);
    console.log(`Slug: ${blogPost.slug}`);
    console.log(`Word Count: ${blogPost.wordCount}`);
    console.log(`Reading Time: ${blogPost.readingTime} min`);
    console.log(`Tags: ${blogPost.tags.join(', ')}`);
    console.log(`Images: ${blogPost.images ? blogPost.images.length : 0}`);
    console.log(`Generation Time: ${duration.toFixed(2)} seconds`);
    console.log(`URL: /posts/${blogPost.slug}.html`);
    console.log('===========================================\n');
    
    console.log('The blog post has been saved and is available at:');
    console.log(`http://localhost:3000/posts/${blogPost.slug}.html`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing blog post generation:', error);
    process.exit(1);
  }
}

// Run the script
main();