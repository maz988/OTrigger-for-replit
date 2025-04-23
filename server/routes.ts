import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import * as bcrypt from "bcrypt";
import express from "express";

// Initialize OpenAI
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "default_key" 
});

// Authentication middleware for admin routes
const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the admin token from cookies, headers, or request body
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }
    
    // Extract username from token (in a real app, this would be a JWT)
    const token = authHeader.split(' ')[1];
    const username = Buffer.from(token, 'base64').toString().split(':')[0];
    
    // Check if admin exists
    const admin = await storage.getAdminByUsername(username);
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "Invalid authentication"
      });
    }
    
    // Add admin info to request object
    (req as any).admin = admin;
    next();
  } catch (err) {
    console.error(`Authentication error: ${err}`);
    res.status(401).json({
      success: false,
      error: "Authentication failed"
    });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up JSON request body parsing
  app.use(express.json());
  
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

  // Submit a quiz response
  app.post("/api/quiz/submit", async (req, res) => {
    try {
      const quizData = req.body;
      const result = await storage.saveQuizResponse(quizData);
      
      res.status(200).json({
        success: true,
        data: { id: result.id }
      });
    } catch (err: any) {
      console.error(`Error submitting quiz: ${err.message}`);
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  });

  // Register admin (only for testing)
  app.post("/api/admin/register", async (req, res) => {
    try {
      const { username, password, email, role } = req.body;
      
      if (!username || !password || !email) {
        return res.status(400).json({
          success: false,
          error: "Username, password, and email are required"
        });
      }
      
      // Check if admin already exists
      const existingAdmin = await storage.getAdminByUsername(username);
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          error: "Admin with this username already exists"
        });
      }
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create the admin user
      const admin = await storage.createAdmin({
        username,
        password: hashedPassword,
        email,
        role: role || "admin"
      });
      
      // Return the admin data without the password
      res.status(201).json({
        success: true,
        data: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (err: any) {
      console.error(`Error registering admin: ${err.message}`);
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });

  // Admin Authentication
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: "Username and password are required"
        });
      }
      
      // Check if admin exists
      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({
          success: false,
          error: "Invalid username or password"
        });
      }
      
      // Compare passwords
      const passwordMatch = await bcrypt.compare(password, admin.password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          error: "Invalid username or password"
        });
      }
      
      // Update last login time
      await storage.updateAdminLastLogin(admin.id);
      
      // Admin authenticated successfully
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      
      res.status(200).json({
        success: true,
        data: {
          id: admin.id,
          username: admin.username,
          role: admin.role,
          token
        }
      });
    } catch (err: any) {
      console.error(`Error logging in admin: ${err.message}`);
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });
  
  // Get current admin user
  app.get("/api/admin/me", authenticateAdmin, async (req, res) => {
    try {
      const admin = (req as any).admin;
      
      // Return admin data without the password
      res.status(200).json({
        success: true,
        data: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          lastLogin: admin.lastLogin
        }
      });
    } catch (err: any) {
      console.error(`Error getting admin user: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  
  // Analytics Routes - Protected by admin auth
  app.get("/api/admin/analytics/quiz", authenticateAdmin, async (req, res) => {
    try {
      const analytics = await storage.getQuizAnalytics();
      
      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (err: any) {
      console.error(`Error getting quiz analytics: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  
  app.get("/api/admin/analytics/blog", authenticateAdmin, async (req, res) => {
    try {
      const analytics = await storage.getBlogAnalytics();
      
      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (err: any) {
      console.error(`Error getting blog analytics: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  
  // Blog post routes
  app.get("/api/blog/posts", async (req, res) => {
    try {
      const posts = await storage.getAllBlogPosts();
      
      // Filter by category if provided
      const category = req.query.category as string;
      let filteredPosts = posts;
      
      if (category) {
        filteredPosts = posts.filter(post => 
          post.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      // Sort by publish date, newest first
      filteredPosts.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      
      res.status(200).json({
        success: true,
        data: filteredPosts
      });
    } catch (err: any) {
      console.error(`Error getting blog posts: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  // Featured blog posts
  app.get("/api/blog/featured", async (req, res) => {
    try {
      const allPosts = await storage.getAllBlogPosts();
      
      // Sort by publish date, newest first
      const sortedPosts = [...allPosts].sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      
      // Get the most recent 3 posts
      const featuredPosts = sortedPosts.slice(0, 3);
      
      res.status(200).json({
        success: true,
        data: featuredPosts
      });
    } catch (err: any) {
      console.error(`Error getting featured blog posts: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  
  app.get("/api/blog/posts/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          error: "Blog post not found"
        });
      }
      
      // Record a view
      const isUnique = true; // In a real app, this would be determined by cookies/IP
      await storage.recordBlogView(post.id, isUnique);
      
      res.status(200).json({
        success: true,
        data: post
      });
    } catch (err: any) {
      console.error(`Error getting blog post: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  
  // Record a quiz click from a blog post
  app.post("/api/blog/record-click", async (req, res) => {
    try {
      const { slug } = req.body;
      
      if (!slug) {
        return res.status(400).json({
          success: false,
          error: "Blog post slug is required"
        });
      }
      
      const post = await storage.getBlogPostBySlug(slug);
      if (!post) {
        return res.status(404).json({
          success: false,
          error: "Blog post not found"
        });
      }
      
      await storage.recordQuizClick(post.id);
      
      res.status(200).json({
        success: true
      });
    } catch (err: any) {
      console.error(`Error recording quiz click: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  const httpServer = createServer(app);
  
  // The server is started in index.ts, so we don't need to listen here
  
  return httpServer;
}
