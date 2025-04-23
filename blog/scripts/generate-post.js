/**
 * Script to manually generate a blog post
 * Usage: node scripts/generate-post.js [keyword]
 */

const dotenv = require('dotenv');
const path = require('path');
const { generateSinglePost, getUnusedKeywords } = require('../utils/scheduler');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  try {
    console.log('Blog Post Generator');
    console.log('==================');
    
    // Check if keyword was provided as command-line argument
    const providedKeyword = process.argv[2];
    
    if (providedKeyword) {
      console.log(`Using provided keyword: ${providedKeyword}`);
      const post = await generateSinglePost(providedKeyword);
      console.log(`\nPost generated successfully: "${post.title}"`);
      console.log(`Saved to: /content/posts/${post.slug}.json`);
      console.log(`HTML version: /public/articles/${post.slug}.html`);
    } else {
      // Get unused keywords
      const unusedKeywords = await getUnusedKeywords();
      
      if (unusedKeywords.length === 0) {
        console.log('No unused keywords found. All keywords have been used.');
        return;
      }
      
      // Pick a random keyword
      const randomIndex = Math.floor(Math.random() * unusedKeywords.length);
      const selectedKeyword = unusedKeywords[randomIndex];
      
      console.log(`Selected keyword: ${selectedKeyword}`);
      
      // Generate and save blog post
      const post = await generateSinglePost(selectedKeyword);
      
      console.log(`\nPost generated successfully: "${post.title}"`);
      console.log(`Saved to: /content/posts/${post.slug}.json`);
      console.log(`HTML version: /public/articles/${post.slug}.html`);
    }
  } catch (error) {
    console.error('Error generating blog post:', error);
    process.exit(1);
  }
}

// Run the script
main();