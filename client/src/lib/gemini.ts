import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// We need to check for the API key in the environment
// When running on the client, we need to use import.meta.env
// The API key should be formatted properly with no spaces
const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "default_key").trim();

/**
 * Initialize the Gemini API client
 */
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Helper function to handle missing API key
 */
function isGeminiAvailable(): boolean {
  return API_KEY !== "default_key";
}

/**
 * Generate text using Gemini AI
 * @param prompt - The prompt to generate text from
 * @returns The generated text
 */
export async function generateWithGemini(prompt: string): Promise<string> {
  try {
    if (!isGeminiAvailable()) {
      throw new Error("Gemini API key not configured");
    }

    // For most scenarios, we'll use the Gemini model
    // Note: The model name format has changed in newer versions of the API
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating with Gemini:", error);
    throw error;
  }
}

/**
 * Enhance text content using Gemini AI
 * @param content - The content to enhance
 * @param instructions - Specific instructions for enhancement
 * @returns The enhanced content
 */
export async function enhanceContent(content: string, instructions: string): Promise<string> {
  try {
    if (!isGeminiAvailable()) {
      throw new Error("Gemini API key not configured");
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const prompt = `
      CONTENT TO ENHANCE:
      ${content}
      
      ENHANCEMENT INSTRUCTIONS:
      ${instructions}
      
      Please provide the enhanced content only, without any additional commentary.
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error enhancing content with Gemini:", error);
    return content; // Return original content if enhancement fails
  }
}

/**
 * Generate an outline for a blog post
 * @param keyword - The target keyword
 * @returns The generated outline
 */
export async function generateOutline(keyword: string): Promise<string> {
  try {
    if (!isGeminiAvailable()) {
      throw new Error("Gemini API key not configured");
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const prompt = `
      Create a detailed outline for a blog post about "${keyword}" focused on relationship advice.
      
      The outline should include:
      1. H1 title (compelling and SEO-friendly)
      2. 3-4 major H2 sections
      3. 2-3 H3 subsections under each H2
      4. Brief notes about what to include in each section
      
      Format as a structured outline with proper indentation.
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating outline with Gemini:", error);
    throw error;
  }
}

/**
 * Use Gemini to fact-check and improve accuracy
 * @param content - The content to fact check
 * @returns Fact-checking results and suggestions
 */
export async function factCheckContent(content: string): Promise<string> {
  try {
    if (!isGeminiAvailable()) {
      throw new Error("Gemini API key not configured");
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const prompt = `
      Please fact-check the following relationship advice content:
      
      ${content}
      
      Provide feedback on:
      1. Any inaccurate or questionable claims
      2. Suggestions for more accurate information
      3. Citations or references that could strengthen the content
      
      Format your response as a structured review with clear sections.
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error fact-checking with Gemini:", error);
    return "Fact-checking unavailable"; // Fallback message
  }
}

export default {
  generateWithGemini,
  enhanceContent,
  generateOutline,
  factCheckContent,
  isGeminiAvailable
};