import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";

// Initialize OpenAI
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "default_key" 
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Route to generate AI advice
  app.post("/api/generate-advice", async (req, res) => {
    try {
      const quizData = req.body;
      
      // Validate that all required fields are present
      const requiredFields = [
        "relationshipStatus",
        "concernType",
        "confusingBehavior",
        "communicationStyle",
        "desiredOutcome",
      ];
      
      const missingFields = requiredFields.filter(field => !quizData[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          message: `Missing required fields: ${missingFields.join(", ")}`
        });
      }
      
      // Format prompt for OpenAI
      const prompt = `
        Act as a women's relationship expert. Based on the following information about a woman and her relationship, give warm, intelligent advice that references emotional triggers, male psychology, and the Hero Instinct concept. End with a recommendation to explore this topic more deeply.
        
        Her relationship status: ${quizData.relationshipStatus}
        Her biggest concern: ${quizData.concernType}
        Confusing behavior she described: ${quizData.confusingBehavior}
        Her communication style: ${quizData.communicationStyle}
        Her desired outcome: ${quizData.desiredOutcome}
        
        Provide 2-3 paragraphs of personalized advice that she can apply immediately to improve her situation.
      `;
      
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a compassionate relationship expert specializing in women's relationship advice. You understand male psychology deeply." },
          { role: "user", content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });
      
      const advice = response.choices[0].message.content;
      
      res.json({ advice });
    } catch (error) {
      console.error("Error generating advice:", error);
      res.status(500).json({
        message: "Failed to generate advice",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
