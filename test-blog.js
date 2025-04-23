/**
 * Simple script to test blog generation without running the full server
 */
const { blogGenerator, keywords } = require('./blog/utils/index.js');

async function testBlogGeneration() {
  try {
    console.log("Loading keywords...");
    await keywords.loadKeywordsFromFile();
    await keywords.initializeKeywordTracking();
    
    const unusedKeywords = keywords.getUnusedKeywords();
    console.log(`Found ${unusedKeywords.length} unused keywords`);
    
    const testKeyword = keywords.getRandomUnusedKeyword();
    console.log(`Selected test keyword: "${testKeyword}"`);
    
    console.log("Generating blog post...");
    const blogPost = await blogGenerator.generateCompleteBlogPost(testKeyword);
    
    console.log("Blog post generated successfully!");
    console.log("-----------------------------------");
    console.log(`Title: ${blogPost.title}`);
    console.log(`Slug: ${blogPost.slug}`);
    console.log(`Keyword: ${blogPost.keyword}`);
    console.log(`Date: ${blogPost.date}`);
    console.log(`Description: ${blogPost.description}`);
    console.log(`Word count: ${blogPost.content.split(' ').length}`);
    console.log(`Images: ${blogPost.images.length} images downloaded`);
    
    console.log("-----------------------------------");
    console.log("Saving blog post...");
    await blogGenerator.saveBlogPost(blogPost);
    
    // Mark the keyword as used
    await keywords.markKeywordAsUsed(testKeyword);
    
    console.log("Blog post saved successfully!");
    console.log(`The post is available at: /blog/public/posts/${blogPost.slug}.html`);
    
    return blogPost;
  } catch (error) {
    console.error("Error generating blog post:", error.message);
    console.error(error.stack);
  }
}

testBlogGeneration();