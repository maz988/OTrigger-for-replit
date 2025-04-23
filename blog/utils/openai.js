const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a blog post using OpenAI API
 * @param {string} keyword - The keyword/topic for the blog post
 * @returns {Object} Generated blog post content
 */
async function generateBlogPost(keyword) {
  try {
    console.log(`Generating blog post for keyword: ${keyword}`);
    
    const blogPrompt = `
    Write a comprehensive, engaging, and SEO-optimized blog post about "${keyword}" for women seeking relationship advice.
    
    The blog post should:
    1. Be 700-900 words long
    2. Include an attention-grabbing introduction
    3. Have 3-5 main sections with descriptive H2 subheadings
    4. Provide actionable advice and insights
    5. Include a conclusion with a call-to-action
    
    Important guidelines:
    - Write in a conversational, empathetic tone
    - Target women who are dating or in relationships
    - Include psychology-backed insights when possible
    - Avoid clichés and generic advice
    - Make the content genuinely helpful and insightful
    
    Also, generate:
    1. An SEO-optimized title (60 chars max)
    2. A meta description (160 chars max)
    3. 5 relevant tags for the post
    4. 2 image search keywords related to the post
    
    Format the response as valid JSON with these fields:
    {
      "title": "SEO Title Here",
      "metaDescription": "Meta description here...",
      "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
      "imageKeywords": ["keyword1", "keyword2"],
      "content": "The full blog post content in markdown format..."
    }
    `;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert relationship blogger and copywriter who specializes in writing engaging, helpful content for women seeking relationship advice." },
        { role: "user", content: blogPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    // Parse the response content
    const generatedContent = JSON.parse(response.choices[0].message.content);
    
    return {
      ...generatedContent,
      slug: generateSlug(generatedContent.title),
      dateCreated: new Date().toISOString(),
      originalKeyword: keyword
    };
  } catch (error) {
    console.error('Error generating blog post:', error);
    throw error;
  }
}

/**
 * Generate a slug from a title
 * @param {string} title - The blog post title
 * @returns {string} Generated slug
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

module.exports = {
  generateBlogPost
};