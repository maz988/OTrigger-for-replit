import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Check if API key is available
const API_KEY = process.env.GEMINI_API_KEY || "default_key";
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Check if Gemini API is available
 */
export function isGeminiAvailable(): boolean {
  return API_KEY !== "default_key";
}

/**
 * Generate text content with Gemini pro model
 */
export async function generateText(prompt: string): Promise<string> {
  try {
    if (!isGeminiAvailable()) {
      throw new Error("Gemini API key not configured");
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error: any) {
    console.error(`Error generating text with Gemini: ${error.message}`);
    throw error;
  }
}

/**
 * Generate blog content using a structured approach
 */
export async function generateBlogContent(keyword: string): Promise<any> {
  try {
    if (!isGeminiAvailable()) {
      throw new Error("Gemini API key not configured");
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // First generate a blog outline
    const outlinePrompt = `
      Create a comprehensive SEO-optimized blog outline for keyword "${keyword}" 
      in the context of relationship advice for women.
      
      The outline should include:
      1. An engaging H1 title (include the keyword)
      2. Meta description (150-160 characters)
      3. 4-5 H2 section titles
      4. 2-3 H3 subsections under each H2
      5. Brief notes about what to include in each section
      
      Format as JSON with the following structure:
      {
        "title": "The H1 title with keyword",
        "metaDescription": "SEO meta description",
        "slug": "url-friendly-slug",
        "outline": [
          {
            "heading": "H2 Section Title",
            "subsections": [
              {"heading": "H3 Subsection Title", "notes": "Brief content notes"}
            ]
          }
        ]
      }
    `;
    
    const outlineResult = await model.generateContent(outlinePrompt);
    const outlineText = outlineResult.response.text();
    const outlineJson = JSON.parse(outlineText);
    
    // Now generate the full content based on the outline
    const contentPrompt = `
      Write a comprehensive blog post based on this outline:
      ${outlineText}
      
      Follow these guidelines:
      - Write in a friendly, conversational tone
      - Include practical examples and advice
      - Use emotional language that resonates with women
      - Add relevant statistics or expert opinions where appropriate
      - Format with proper HTML tags (h2, h3, p, ul, li, etc)
      - Add a strong conclusion with a call to action
      - Include a FAQ section at the end with 3 relevant questions and answers
      
      The full post should be 900-1400 words.
    `;
    
    const contentResult = await model.generateContent(contentPrompt);
    const content = contentResult.response.text();
    
    // Return both the outline and the generated content
    return {
      title: outlineJson.title,
      metaDescription: outlineJson.metaDescription,
      slug: outlineJson.slug || keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      content: content,
      outline: outlineJson.outline,
      keyword: keyword
    };
  } catch (error: any) {
    console.error(`Error generating blog content with Gemini: ${error.message}`);
    throw error;
  }
}

/**
 * Improve OpenAI-generated content with Gemini insights
 */
export async function enhanceOpenAIContent(openAIContent: any): Promise<any> {
  try {
    if (!isGeminiAvailable()) {
      return openAIContent; // Return original if Gemini not available
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const enhancementPrompt = `
      Enhance the following blog post content to make it more engaging,
      accurate, and SEO-optimized. Keep the overall structure, but improve:
      
      1. Fact accuracy and depth
      2. Storytelling elements
      3. Emotional appeal
      4. Practical advice quality
      
      Original content:
      ${openAIContent.content}
      
      Return the enhanced HTML content only, maintaining all HTML formatting.
    `;
    
    const enhancementResult = await model.generateContent(enhancementPrompt);
    const enhancedContent = enhancementResult.response.text();
    
    // Return enhanced version
    return {
      ...openAIContent,
      content: enhancedContent
    };
  } catch (error: any) {
    console.error(`Error enhancing content with Gemini: ${error.message}`);
    return openAIContent; // Return original content if enhancement fails
  }
}

export default {
  generateText,
  generateBlogContent,
  enhanceOpenAIContent,
  isGeminiAvailable
};