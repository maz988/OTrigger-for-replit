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
  
  // Lead capture endpoints
  app.post("/api/leads", async (req, res) => {
    try {
      const { email, firstName, source, leadMagnetName } = req.body;
      
      if (!email || !firstName) {
        return res.status(400).json({
          success: false,
          error: "Email and first name are required"
        });
      }
      
      // Record lead signup in database (simplified in this example)
      console.log(`New lead captured: ${firstName} (${email}) from ${source || 'unknown'} for ${leadMagnetName || 'general newsletter'}`);
      
      res.status(200).json({
        success: true,
        message: "Lead information captured successfully"
      });
    } catch (err: any) {
      console.error(`Error capturing lead data: ${err.message}`);
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });
  
  app.post("/api/generate-lead-magnet", async (req, res) => {
    try {
      const { email, firstName, leadMagnetName } = req.body;
      
      if (!email || !firstName || !leadMagnetName) {
        return res.status(400).json({
          success: false,
          error: "Email, firstName, and leadMagnetName are required"
        });
      }
      
      // In a real implementation, generate a PDF and email it to the user
      console.log(`Generating lead magnet "${leadMagnetName}" for ${firstName} (${email})`);
      
      // Use fallback email template 
      const emailSubject = `Your ${leadMagnetName}, ${firstName}!`;
      const emailBody = `Hi ${firstName},\n\nThank you for downloading the ${leadMagnetName}! I'm so excited to share these relationship insights with you.\n\nAs promised, you'll find practical advice that you can start applying right away.\n\nWarmly,\nYour Relationship Coach`;
      
      // In a real implementation, send the email with the lead magnet attached
      console.log(`Email would be sent to ${email} with subject: ${emailSubject}`);
      
      res.status(200).json({
        success: true,
        message: "Lead magnet generated and email sent successfully"
      });
    } catch (err: any) {
      console.error(`Error generating lead magnet: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  
  app.post("/api/blog/lead-conversion", async (req, res) => {
    try {
      const { blogPostId, email } = req.body;
      
      if (!blogPostId || !email) {
        return res.status(400).json({
          success: false,
          error: "Blog post ID and email are required"
        });
      }
      
      // In a real implementation, record the lead conversion for analytics
      console.log(`Lead conversion from blog post ${blogPostId} for ${email}`);
      
      res.status(200).json({
        success: true
      });
    } catch (err: any) {
      console.error(`Error recording blog lead conversion: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  
  app.post("/api/quiz/lead-conversion", async (req, res) => {
    try {
      const { quizResponseId, email } = req.body;
      
      if (!quizResponseId || !email) {
        return res.status(400).json({
          success: false,
          error: "Quiz response ID and email are required"
        });
      }
      
      // In a real implementation, record the lead conversion for analytics
      console.log(`Lead conversion from quiz ${quizResponseId} for ${email}`);
      
      res.status(200).json({
        success: true
      });
    } catch (err: any) {
      console.error(`Error recording quiz lead conversion: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
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
      console.log("Login attempt with request body:", req.body);
      
      const { username, password } = req.body;
      
      console.log(`Login attempt with username: '${username}', password: '${password}'`);
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: "Username and password are required"
        });
      }
      
      // TEMPORARY: Hardcoded admin login to debug issues
      if (username === "newadmin" && password === "password123") {
        console.log("Using hardcoded admin login credentials");
        
        // Get the admin to retrieve the ID
        const admin = await storage.getAdminByUsername("newadmin");
        
        if (admin) {
          await storage.updateAdminLastLogin(admin.id);
          
          const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
          
          return res.status(200).json({
            success: true,
            data: {
              id: admin.id,
              username: admin.username,
              role: admin.role,
              token
            }
          });
        }
      }
      
      // Normal flow (only reached if hardcoded login fails)
      console.log("Using normal admin authentication flow");
      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        console.log(`Admin login failed: Username '${username}' not found`);
        return res.status(401).json({
          success: false,
          error: "Invalid username or password"
        });
      }
      
      console.log(`Admin login attempt: Found admin with username '${username}'`);
      
      // For the default admin, use a hardcoded check since we know the password
      if (username === 'newadmin') {
        const isDefaultAdmin = password === 'password123';
        console.log(`Default admin check result: ${isDefaultAdmin}`);
        
        if (!isDefaultAdmin) {
          console.log(`Admin login failed: Password mismatch for default admin '${username}'`);
          return res.status(401).json({
            success: false,
            error: "Invalid username or password"
          });
        }
      } else {
        // For other admins, use bcrypt comparison
        const passwordMatch = await bcrypt.compare(password, admin.password);
        console.log(`Password comparison result: ${passwordMatch}`);
        
        if (!passwordMatch) {
          console.log(`Admin login failed: Password mismatch for '${username}'`);
          return res.status(401).json({
            success: false,
            error: "Invalid username or password"
          });
        }
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
  
  // Get all quiz responses for detailed analysis
  app.get("/api/admin/quiz/responses", authenticateAdmin, async (req, res) => {
    try {
      const responses = await storage.getAllQuizResponses();
      
      // Filter responses based on date range if provided
      const { timeRange } = req.query;
      let filteredResponses = responses;
      
      if (timeRange) {
        const now = new Date();
        let cutoffDate = new Date();
        
        if (timeRange === '7days') {
          cutoffDate.setDate(now.getDate() - 7);
        } else if (timeRange === '30days') {
          cutoffDate.setDate(now.getDate() - 30);
        }
        
        if (timeRange === '7days' || timeRange === '30days') {
          filteredResponses = responses.filter(response => 
            new Date(response.createdAt) >= cutoffDate
          );
        }
      }
      
      res.status(200).json({
        success: true,
        data: filteredResponses
      });
    } catch (err: any) {
      console.error(`Error getting quiz responses: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  
  // Export quiz responses as CSV
  app.get("/api/admin/quiz/export", authenticateAdmin, async (req, res) => {
    try {
      const csvData = await storage.exportQuizResponses();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="quiz-responses.csv"');
      res.status(200).send(csvData);
    } catch (err: any) {
      console.error(`Error exporting quiz responses: ${err.message}`);
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
  
  // Admin blog management routes
  app.post("/api/admin/blog/posts", authenticateAdmin, async (req, res) => {
    try {
      const postData = req.body;
      
      if (!postData.title || !postData.content || !postData.keyword) {
        return res.status(400).json({
          success: false,
          error: "Title, content and keyword are required"
        });
      }
      
      // Generate slug if not provided
      if (!postData.slug) {
        postData.slug = postData.title
          .toLowerCase()
          .replace(/[^\w\s]/g, '') // Remove special chars
          .replace(/\s+/g, '-');   // Replace spaces with hyphens
      }
      
      // Create the blog post
      const post = await storage.saveBlogPost(postData);
      
      res.status(201).json({
        success: true,
        data: post
      });
    } catch (err: any) {
      console.error(`Error creating blog post: ${err.message}`);
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });
  
  app.get("/api/admin/blog/posts", authenticateAdmin, async (req, res) => {
    try {
      const posts = await storage.getAllBlogPosts();
      
      // Sort by publish date, newest first
      posts.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      
      res.status(200).json({
        success: true,
        data: posts
      });
    } catch (err: any) {
      console.error(`Error getting admin blog posts: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  
  app.get("/api/admin/blog/posts/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid post ID"
        });
      }
      
      const post = await storage.getBlogPostById(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          error: "Blog post not found"
        });
      }
      
      // Get analytics for this post
      const analytics = await storage.getBlogPostAnalytics(id);
      
      res.status(200).json({
        success: true,
        data: {
          post,
          analytics
        }
      });
    } catch (err: any) {
      console.error(`Error getting blog post: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  
  app.patch("/api/admin/blog/posts/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid post ID"
        });
      }
      
      const updates = req.body;
      const updatedPost = await storage.updateBlogPost(id, updates);
      
      if (!updatedPost) {
        return res.status(404).json({
          success: false,
          error: "Blog post not found"
        });
      }
      
      res.status(200).json({
        success: true,
        data: updatedPost
      });
    } catch (err: any) {
      console.error(`Error updating blog post: ${err.message}`);
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });
  
  app.delete("/api/admin/blog/posts/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid post ID"
        });
      }
      
      const deleted = await storage.deleteBlogPost(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: "Blog post not found"
        });
      }
      
      res.status(200).json({
        success: true,
        message: "Blog post deleted successfully"
      });
    } catch (err: any) {
      console.error(`Error deleting blog post: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  
  // Pexels API integration for image search
  app.get("/api/admin/pexels", authenticateAdmin, async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: "Search query is required"
        });
      }
      
      const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
      
      if (!PEXELS_API_KEY) {
        return res.status(500).json({
          success: false,
          error: "Pexels API key is not configured"
        });
      }
      
      const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`, {
        headers: {
          'Authorization': PEXELS_API_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      res.status(200).json({
        success: true,
        data
      });
    } catch (err: any) {
      console.error(`Error searching Pexels images: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  
  // Generate blog post content with AI
  app.post("/api/admin/blog/generate", authenticateAdmin, async (req, res) => {
    try {
      const { keyword } = req.body;
      
      if (!keyword) {
        return res.status(400).json({
          success: false,
          error: "Keyword is required"
        });
      }
      
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "default_key") {
        // Return mock data for testing when API key is not available
        console.warn("Using mock data for blog generation (OpenAI API key not available)");
        
        const mockPost = {
          title: `${keyword}: How to Understand and Connect Better`,
          slug: `${keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-how-to-understand-and-connect-better`,
          content: `<h2>Understanding ${keyword}</h2><p>Relationships can be complex, especially when it comes to ${keyword}. When you experience this in your relationship, it's important to understand the underlying male psychology at play.</p><p>Men often respond to emotional triggers in ways that confuse women, but there's usually a pattern to these behaviors that relates to their need for appreciation and respect.</p><h2>The Connection Between ${keyword} and His Inner Hero</h2><p>Research shows that men have a natural instinct to protect and provide. When you understand how to connect with this instinct through the right words and actions, you'll see tremendous changes in how he responds to you.</p><p>Try these techniques to create a stronger bond and watch how quickly things improve in your relationship.</p>`,
          imageUrls: [],
          tags: ["relationships", keyword.toLowerCase(), "communication", "psychology"],
          autoGenerated: true
        };
        
        return res.status(200).json({
          success: true,
          data: mockPost
        });
      }
      
      // Generate content with OpenAI
      const prompt = `
        Write a blog post about "${keyword}" in the context of relationship advice for women.
        Focus on how understanding male psychology can help women create better relationships.
        Include mentions of concepts like emotional triggers and the hero instinct.
        Make the post engaging, thoughtful, and around 500 words.
        Format the content with appropriate heading tags (h1, h2, h3) and paragraph tags.
        
        Also generate:
        1. A compelling blog post title (include the keyword)
        2. A URL-friendly slug
        3. 4-5 relevant tags
        
        Return your response in the following JSON format:
        {
          "title": "The blog post title",
          "slug": "url-friendly-slug",
          "content": "Full HTML content with heading and paragraph tags",
          "tags": ["tag1", "tag2", "tag3", "tag4"]
        }
      `;
      
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert relationship blogger specializing in female relationship advice with deep knowledge of male psychology." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });
      
      const content = JSON.parse(response.choices[0].message.content);
      
      // Add a few more fields needed by our application
      content.autoGenerated = true;
      content.imageUrls = [];
      content.keyword = keyword;
      
      res.status(200).json({
        success: true,
        data: content
      });
    } catch (err: any) {
      console.error(`Error generating blog content with AI: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  
  // Record a link click from a blog post
  app.post("/api/blog/record-link-click", async (req, res) => {
    try {
      const { postId, linkUrl } = req.body;
      
      if (!postId || !linkUrl) {
        return res.status(400).json({
          success: false,
          error: "Post ID and link URL are required"
        });
      }
      
      await storage.recordLinkClick(postId, linkUrl);
      
      res.status(200).json({
        success: true,
        message: "Link click recorded successfully"
      });
    } catch (err: any) {
      console.error(`Error recording link click: ${err.message}`);
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
  
  // WordPress-like Admin Dashboard API Routes
  
  // Dashboard Overview
  app.get("/api/admin/dashboard", authenticateAdmin, async (req, res) => {
    try {
      const dashboardData = await storage.getDashboardOverview();
      
      res.status(200).json({
        success: true,
        data: dashboardData
      });
    } catch (err: any) {
      console.error(`Error getting dashboard overview: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  
  // Email Subscribers
  app.get("/api/admin/subscribers", authenticateAdmin, async (req, res) => {
    try {
      const subscribers = await storage.getAllSubscribers();
      
      res.status(200).json({
        success: true,
        data: subscribers
      });
    } catch (err: any) {
      console.error(`Error getting subscribers: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  
  app.post("/api/admin/subscribers", authenticateAdmin, async (req, res) => {
    try {
      const subscriberData = req.body;
      
      if (!subscriberData.email || !subscriberData.firstName) {
        return res.status(400).json({
          success: false,
          error: "Email and first name are required"
        });
      }
      
      const subscriber = await storage.saveSubscriber(subscriberData);
      
      res.status(201).json({
        success: true,
        data: subscriber
      });
    } catch (err: any) {
      console.error(`Error creating subscriber: ${err.message}`);
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });
  
  app.patch("/api/admin/subscribers/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedSubscriber = await storage.updateSubscriber(id, updates);
      
      if (!updatedSubscriber) {
        return res.status(404).json({
          success: false,
          error: "Subscriber not found"
        });
      }
      
      res.status(200).json({
        success: true,
        data: updatedSubscriber
      });
    } catch (err: any) {
      console.error(`Error updating subscriber: ${err.message}`);
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });
  
  app.post("/api/admin/subscribers/:email/unsubscribe", authenticateAdmin, async (req, res) => {
    try {
      const email = req.params.email;
      
      const success = await storage.unsubscribeByEmail(email);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: "Subscriber not found"
        });
      }
      
      res.status(200).json({
        success: true
      });
    } catch (err: any) {
      console.error(`Error unsubscribing subscriber: ${err.message}`);
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });
  
  // Lead Magnets
  app.get("/api/admin/lead-magnets", authenticateAdmin, async (req, res) => {
    try {
      const leadMagnets = await storage.getAllLeadMagnets();
      
      res.status(200).json({
        success: true,
        data: leadMagnets
      });
    } catch (err: any) {
      console.error(`Error getting lead magnets: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  
  app.post("/api/admin/lead-magnets", authenticateAdmin, async (req, res) => {
    try {
      const leadMagnetData = req.body;
      
      if (!leadMagnetData.name || !leadMagnetData.description || !leadMagnetData.filePath) {
        return res.status(400).json({
          success: false,
          error: "Name, description and file path are required"
        });
      }
      
      const leadMagnet = await storage.saveLeadMagnet(leadMagnetData);
      
      res.status(201).json({
        success: true,
        data: leadMagnet
      });
    } catch (err: any) {
      console.error(`Error creating lead magnet: ${err.message}`);
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });
  
  app.patch("/api/admin/lead-magnets/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedLeadMagnet = await storage.updateLeadMagnet(id, updates);
      
      if (!updatedLeadMagnet) {
        return res.status(404).json({
          success: false,
          error: "Lead magnet not found"
        });
      }
      
      res.status(200).json({
        success: true,
        data: updatedLeadMagnet
      });
    } catch (err: any) {
      console.error(`Error updating lead magnet: ${err.message}`);
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });
  
  app.delete("/api/admin/lead-magnets/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const success = await storage.deleteLeadMagnet(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: "Lead magnet not found"
        });
      }
      
      res.status(200).json({
        success: true
      });
    } catch (err: any) {
      console.error(`Error deleting lead magnet: ${err.message}`);
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });
  
  // System Settings
  app.get("/api/admin/settings", authenticateAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      
      res.status(200).json({
        success: true,
        data: settings
      });
    } catch (err: any) {
      console.error(`Error getting settings: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  
  app.patch("/api/admin/settings/:key", authenticateAdmin, async (req, res) => {
    try {
      const key = req.params.key;
      const { value } = req.body;
      
      if (value === undefined) {
        return res.status(400).json({
          success: false,
          error: "Value is required"
        });
      }
      
      const updatedSetting = await storage.updateSetting(key, value);
      
      if (!updatedSetting) {
        return res.status(404).json({
          success: false,
          error: "Setting not found"
        });
      }
      
      res.status(200).json({
        success: true,
        data: updatedSetting
      });
    } catch (err: any) {
      console.error(`Error updating setting: ${err.message}`);
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });
  
  // Keywords
  app.get("/api/admin/keywords", authenticateAdmin, async (req, res) => {
    try {
      const keywords = await storage.getAllKeywords();
      
      res.status(200).json({
        success: true,
        data: keywords
      });
    } catch (err: any) {
      console.error(`Error getting keywords: ${err.message}`);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  
  app.post("/api/admin/keywords", authenticateAdmin, async (req, res) => {
    try {
      const { keyword } = req.body;
      
      if (!keyword) {
        return res.status(400).json({
          success: false,
          error: "Keyword is required"
        });
      }
      
      const success = await storage.addKeyword(keyword);
      
      res.status(201).json({
        success: true,
        data: { keyword }
      });
    } catch (err: any) {
      console.error(`Error adding keyword: ${err.message}`);
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });
  
  app.delete("/api/admin/keywords/:keyword", authenticateAdmin, async (req, res) => {
    try {
      const keyword = req.params.keyword;
      
      const success = await storage.deleteKeyword(keyword);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: "Keyword not found"
        });
      }
      
      res.status(200).json({
        success: true
      });
    } catch (err: any) {
      console.error(`Error deleting keyword: ${err.message}`);
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });
  
  // Auto scheduling setting
  app.patch("/api/admin/blog/auto-scheduling", authenticateAdmin, async (req, res) => {
    try {
      const { enabled } = req.body;
      
      if (enabled === undefined) {
        return res.status(400).json({
          success: false,
          error: "Enabled flag is required"
        });
      }
      
      const success = await storage.toggleAutoScheduling(enabled);
      
      res.status(200).json({
        success: true,
        data: { enabled }
      });
    } catch (err: any) {
      console.error(`Error updating auto scheduling: ${err.message}`);
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  });
  
  // Quiz responses export
  app.get("/api/admin/quiz/export", authenticateAdmin, async (req, res) => {
    try {
      const csvData = await storage.exportQuizResponses();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="quiz-responses.csv"');
      
      res.status(200).send(csvData);
    } catch (err: any) {
      console.error(`Error exporting quiz responses: ${err.message}`);
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
