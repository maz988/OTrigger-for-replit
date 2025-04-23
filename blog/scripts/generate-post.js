/**
 * Script to manually generate a blog post
 * Usage: node scripts/generate-post.js [keyword]
 */

const path = require('path');
const dotenv = require('dotenv');
const { generatePostWithKeyword, generateSinglePost } = require('../utils/scheduler');
const { ensureDataDirectories } = require('../utils/openai');
const { initializeKeywordTracking } = require('../utils/keywords');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  try {
    console.log('Starting blog post generation script...');
    
    // Ensure all required directories exist
    await ensureDataDirectories();
    await initializeKeywordTracking();
    
    // Check if a keyword was provided as a command-line argument
    const keyword = process.argv[2];
    
    let blogPost;
    if (keyword) {
      console.log(`Generating blog post for keyword: "${keyword}"`);
      blogPost = await generatePostWithKeyword(keyword);
    } else {
      console.log('Generating blog post with random keyword');
      blogPost = await generateSinglePost();
    }
    
    console.log('\n===== Blog Post Generated Successfully =====');
    console.log(`Title: ${blogPost.title}`);
    console.log(`Slug: ${blogPost.slug}`);
    console.log(`Word Count: ${blogPost.wordCount}`);
    console.log(`Reading Time: ${blogPost.readingTime} min`);
    console.log(`Tags: ${blogPost.tags.join(', ')}`);
    console.log(`Images: ${blogPost.images ? blogPost.images.length : 0}`);
    console.log(`URL: /posts/${blogPost.slug}.html`);
    console.log('===========================================\n');
    
    console.log('The blog post has been saved and is available at:');
    console.log(`http://localhost:3000/posts/${blogPost.slug}.html`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error generating blog post:', error);
    process.exit(1);
  }
}

// Run the script
main();