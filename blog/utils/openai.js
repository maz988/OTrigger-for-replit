const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs-extra');
// Use dynamic import for slug
const slugify = (text, options = {}) => {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize OpenAI API client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate a blog post using OpenAI API
 * @param {string} keyword - The keyword/topic for the blog post
 * @returns {Object} Generated blog post content
 */
async function generateBlogPost(keyword) {
  console.log(`Generating blog post for keyword: ${keyword}`);
  
  try {
    // First, generate a title, description and outline
    const planningResponse = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert relationship writer specializing in women's relationship advice. 
          You write engaging, helpful, and actionable content focused on helping women improve their romantic relationships.
          Your content has a friendly, supportive tone but avoids being overly casual. Use a mix of personal anecdotes, 
          expert opinions, and scientific research to back up your advice.`
        },
        {
          role: "user",
          content: `Create a comprehensive blog post plan for the topic: "${keyword}".
          
          Generate the following in JSON format:
          {
            "title": "A catchy, SEO-friendly title that includes the keyword",
            "description": "A compelling meta description under 160 characters that would make someone click",
            "outline": ["Introduction", "Point 1", "Point 2", "Point 3", "Point 4", "Point 5", "Conclusion with CTA"],
            "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
          }
          
          The title should be engaging and include the keyword naturally.
          The description should entice readers to click through.
          The outline should include 5-7 main sections (including intro and conclusion).
          Tags should be relevant categories for this article.`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const planData = JSON.parse(planningResponse.choices[0].message.content);
    
    // Now generate the full blog post content based on the outline
    const contentResponse = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert relationship writer specializing in women's relationship advice. 
          You write engaging, helpful, and actionable content focused on helping women improve their romantic relationships.
          Your content has a friendly, supportive tone but avoids being overly casual. 
          
          Important guidelines:
          1. Write in markdown format with proper headings (##, ###), paragraphs, bullet points, etc.
          2. Include 2-3 places where you naturally mention and link to a relationship quiz with text like "our Obsession Trigger quiz" or "take our free quiz" 
          3. Include at least one blockquote with an interesting fact or statistic
          4. End with a call-to-action encouraging readers to take the Obsession Trigger Quiz
          5. Use a conversational, second-person perspective (you/your)
          6. Write comprehensive content that addresses each section thoroughly
          7. All advice should be ethical and respectful
          8. Include specific, actionable tips that readers can implement immediately`
        },
        {
          role: "user",
          content: `Write a comprehensive, well-structured blog post about "${keyword}" following this outline:
          
          Title: ${planData.title}
          
          Outline:
          ${planData.outline.map(item => `- ${item}`).join('\n')}
          
          Write the full blog post in markdown format. Aim for at least 1,500 words of engaging, useful content.
          Include internal links to a relationship quiz called "Obsession Trigger Quiz" where appropriate.
          End with a strong call-to-action encouraging readers to take the quiz for personalized advice.`
        }
      ],
    });
    
    const content = contentResponse.choices[0].message.content;
    
    // Create the final blog post data object
    const postSlug = generateSlug(planData.title);
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Estimate reading time based on 200 words per minute
    
    return {
      title: planData.title,
      description: planData.description,
      slug: postSlug,
      content,
      tags: planData.tags,
      keyword,
      wordCount,
      readingTime,
      date: new Date().toISOString()
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
  return slugify(title);
}

// Create data directory if it doesn't exist
async function ensureDataDirectories() {
  await fs.ensureDir(path.join(__dirname, '../data'));
  await fs.ensureDir(path.join(__dirname, '../data/posts'));
  await fs.ensureDir(path.join(__dirname, '../public/images'));
}

module.exports = {
  generateBlogPost,
  generateSlug,
  ensureDataDirectories
};