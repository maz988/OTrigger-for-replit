/**
 * Test script for generating blog posts using the mock generator
 * This avoids making real API calls to OpenAI and Pexels
 */
const { keywords } = require('./blog/utils/index.js');
const mockGenerator = require('./blog/utils/mockGenerator.js');

async function testMockBlogGeneration() {
  try {
    console.log("Loading keywords...");
    await keywords.loadKeywordsFromFile();
    await keywords.initializeKeywordTracking();
    
    const unusedKeywords = keywords.getUnusedKeywords();
    console.log(`Found ${unusedKeywords.length} unused keywords`);
    
    const testKeyword = keywords.getRandomUnusedKeyword();
    console.log(`Selected test keyword: "${testKeyword}"`);
    
    console.log("Generating mock blog post...");
    const blogPost = await mockGenerator.generateMockBlogPost(testKeyword);
    
    console.log("Blog post generated successfully!");
    console.log("-----------------------------------");
    console.log(`Title: ${blogPost.title}`);
    console.log(`Slug: ${blogPost.slug}`);
    console.log(`Keyword: ${blogPost.keyword}`);
    console.log(`Date: ${blogPost.date}`);
    console.log(`Description: ${blogPost.description}`);
    console.log(`Tags: ${blogPost.tags.join(', ')}`);
    console.log(`Word count: ${blogPost.content.split(' ').length}`);
    
    console.log("-----------------------------------");
    console.log("Saving blog post...");
    const saveResult = await mockGenerator.saveMockBlogPost(blogPost);
    
    if (saveResult.success) {
      console.log(`Blog post saved to: ${saveResult.path}`);
      
      // Mark the keyword as used
      await keywords.markKeywordAsUsed(testKeyword);
      console.log(`Marked "${testKeyword}" as used.`);
      
      console.log("\nThe blog post has been generated and is available at:");
      console.log(`/blog/public/posts/${blogPost.slug}.html`);
    } else {
      console.error("Error saving blog post:", saveResult.error);
    }
    
    return blogPost;
  } catch (error) {
    console.error("Error generating mock blog post:", error.message);
    console.error(error.stack);
  }
}

testMockBlogGeneration();