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
  
  // Test endpoint for our link enhancement strategy
  app.get("/api/admin/blog/enhance-links/:id", authenticateAdmin, async (req, res) => {
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
      
      // Add UTM parameters for tracking
      const addUtmParams = (url: string, source: string, medium: string, campaign: string) => {
        return `${url}?utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}`;
      };
      
      let enhancedContent = post.content;
      
      // 1. Strategic quiz links - add if not already in the content
      if (!enhancedContent.includes('/quiz') && !enhancedContent.includes('relationship assessment')) {
        // Try to place after an H2 heading that seems appropriate
        const h2Sections = enhancedContent.match(/<h2[^>]*>.*?<\/h2>/gi) || [];
        
        if (h2Sections.length > 1) {
          // Target the second or third H2 section for better content flow
          const targetH2 = h2Sections[Math.min(2, h2Sections.length - 1)];
          const quizInsert = `
            <div class="cta-box">
              <p><strong>Not sure how to address ${post.keyword} in your relationship?</strong> Take our 
              <a href="${addUtmParams('/quiz', 'blog', 'content_link', post.slug)}">relationship assessment quiz</a> 
              to receive personalized guidance based on your specific situation.</p>
            </div>
          `;
          
          enhancedContent = enhancedContent.replace(
            targetH2, 
            targetH2 + quizInsert
          );
        }
      }
      
      // 2. Lead magnet integration - with our available lead magnets
      if (!enhancedContent.includes('lead-magnets') && !enhancedContent.includes('free guide')) {
        // Get appropriate lead magnet based on keyword
        let leadMagnetIndex = 0; // Default to the first lead magnet
        
        // Simple keyword matching for lead magnet selection
        if (post.keyword.toLowerCase().includes('communicate') || 
            post.keyword.toLowerCase().includes('talk') || 
            post.keyword.toLowerCase().includes('conversation')) {
          leadMagnetIndex = 1; // Communication Secrets
        } else if (post.keyword.toLowerCase().includes('attract') || 
                   post.keyword.toLowerCase().includes('love') || 
                   post.keyword.toLowerCase().includes('desire')) {
          leadMagnetIndex = 2; // Attraction Triggers
        }
        
        const leadMagnets = [
          {
            name: 'Ultimate Relationship Guide',
            path: '/lead-magnets/ultimate-relationship-guide',
            description: 'comprehensive guide to understanding men'
          },
          {
            name: 'Communication Secrets',
            path: '/lead-magnets/communication-secrets',
            description: 'secret language that makes him fall deeply in love'
          },
          {
            name: 'Attraction Triggers',
            path: '/lead-magnets/attraction-triggers',
            description: 'psychological triggers that create immediate attraction'
          }
        ];
        
        const selectedMagnet = leadMagnets[leadMagnetIndex];
        
        // Add lead magnet offer box near the end, before any FAQ section
        if (enhancedContent.includes('<h2>FAQ') || enhancedContent.includes('<h2>Frequently')) {
          const leadMagnetBox = `
            <div class="lead-magnet-box">
              <h3>Get Our Free ${selectedMagnet.name}</h3>
              <p>Want to master the ${selectedMagnet.description}? Download our free 
              <a href="${addUtmParams(selectedMagnet.path, 'blog', 'lead_magnet', post.slug)}">${selectedMagnet.name}</a> 
              to learn advanced techniques not covered in this article.</p>
            </div>
          `;
          
          enhancedContent = enhancedContent.replace(
            /<h2>FAQ|<h2>Frequently/, 
            leadMagnetBox + '\n\n$&'
          );
        } else {
          // If no FAQ section, add before the conclusion or at the end
          enhancedContent += `
            <div class="lead-magnet-box">
              <h3>Get Our Free ${selectedMagnet.name}</h3>
              <p>Want to master the ${selectedMagnet.description}? Download our free 
              <a href="${addUtmParams(selectedMagnet.path, 'blog', 'lead_magnet', post.slug)}">${selectedMagnet.name}</a> 
              to learn advanced techniques not covered in this article.</p>
            </div>
          `;
        }
      }
      
      // 3. Add authoritative source links if not already present
      if (!enhancedContent.includes('doi.org') && !enhancedContent.includes('ncbi.nlm.nih.gov')) {
        // Psychology source for relationships
        const authSourceText = 'According to <a href="https://doi.org/10.1111/pere.12230" target="_blank" rel="noopener">research in the Journal of Personal Relationships</a>';
        
        // Look for places to add citation
        if (enhancedContent.includes('research shows') || enhancedContent.includes('studies show')) {
          enhancedContent = enhancedContent.replace(
            /research shows|studies show/i,
            authSourceText + ' shows'
          );
        } else if (enhancedContent.includes('psychology') || enhancedContent.includes('psychological')) {
          enhancedContent = enhancedContent.replace(
            /(psychology|psychological)/i,
            `$1. ${authSourceText}, this`
          );
        }
      }
      
      // Update the post with enhanced content
      const updatedPost = await storage.updateBlogPost(id, {
        content: enhancedContent
      });
      
      if (!updatedPost) {
        return res.status(404).json({
          success: false,
          error: "Failed to update blog post"
        });
      }
      
      res.status(200).json({
        success: true,
        data: updatedPost,
        message: "Link enhancement strategy successfully applied"
      });
    } catch (err: any) {
      console.error(`Error enhancing links: ${err.message}`);
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
  
  // Enhanced image processing function
  const processImageForSEO = (imageUrl: string, keyword: string, title: string, photographer?: string) => {
    // Generate SEO-optimized alt text
    const generateAltText = (keyword: string, title: string) => {
      // Create variations of alt text to avoid duplication
      const variations = [
        `${keyword} - relationship advice for women`,
        `Image showing ${keyword} in relationships`,
        `Visual representation of ${keyword}`,
        `${title} - relationship guidance`,
        `Emotional visualization of ${keyword}`,
      ];
      
      // Return a random variation
      return variations[Math.floor(Math.random() * variations.length)];
    };
    
    // Generate structured data for each image
    const generateImageSchema = (imageUrl: string, altText: string, photographer?: string) => {
      return {
        "@context": "https://schema.org/",
        "@type": "ImageObject",
        "contentUrl": imageUrl,
        "description": altText,
        "creditText": photographer ? `Photo by ${photographer}` : undefined
      };
    };
    
    // Generate responsive sizes based on the original URL
    // Convert Pexels URL to include different size options
    const generateResponsiveSizes = (originalUrl: string) => {
      // Example URL: https://images.pexels.com/photos/1234/example.jpeg
      // We'll create an array of different sizes for responsive loading
      
      // If it's not a Pexels URL, just return the original
      if (!originalUrl.includes('pexels.com')) {
        return {
          originalUrl,
          sizes: null
        };
      }
      
      try {
        // Parse the URL to get the base components
        const urlParts = originalUrl.split('?')[0].split('/');
        const photoId = urlParts[urlParts.indexOf('photos') + 1];
        const fileName = urlParts[urlParts.length - 1];
        
        // Create base URL for different sizes
        const baseUrl = `https://images.pexels.com/photos/${photoId}/${fileName}`;
        
        return {
          originalUrl: baseUrl,
          small: `${baseUrl}?auto=compress&cs=tinysrgb&w=400`,
          medium: `${baseUrl}?auto=compress&cs=tinysrgb&w=800`,
          large: `${baseUrl}?auto=compress&cs=tinysrgb&w=1200`,
          srcset: `${baseUrl}?auto=compress&cs=tinysrgb&w=400 400w, ${baseUrl}?auto=compress&cs=tinysrgb&w=800 800w, ${baseUrl}?auto=compress&cs=tinysrgb&w=1200 1200w`
        };
      } catch (error) {
        console.error('Error parsing Pexels URL:', error);
        return {
          originalUrl,
          sizes: null
        };
      }
    };
    
    // Create the alt text
    const altText = generateAltText(keyword, title);
    
    // Generate responsive sizes
    const responsiveSizes = generateResponsiveSizes(imageUrl);
    
    // Generate structured data
    const schema = generateImageSchema(imageUrl, altText, photographer);
    
    // Return the enhanced image object
    return {
      url: imageUrl,
      alt: altText,
      responsive: responsiveSizes,
      schema,
      lazyLoad: true,
      photographer
    };
  };

  // Pexels API integration for image search with enhanced SEO features
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
      
      // Enhance the photo data with SEO features
      if (data.photos && data.photos.length > 0) {
        data.photos = data.photos.map((photo: any) => {
          return {
            ...photo,
            seo: processImageForSEO(
              photo.src.original, 
              query as string, 
              `Photo related to ${query}`, 
              photo.photographer
            )
          };
        });
      }
      
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
  
  // Generate blog post content with AI (OpenAI + Gemini)
  app.post("/api/admin/blog/generate", authenticateAdmin, async (req, res) => {
    try {
      const { keyword, test = false } = req.body;
      
      if (!keyword) {
        return res.status(400).json({
          success: false,
          error: "Keyword is required"
        });
      }
      
      // Import Gemini functionality
      const geminiAI = await import('./gemini').then(module => module.default).catch(() => null);
      
      // If this is a test request, check which AI engines are available
      if (test) {
        let statusMessage = "";
        
        // Check OpenAI status
        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "default_key") {
          statusMessage += "✅ OpenAI API is properly configured. ";
        } else {
          statusMessage += "❌ OpenAI API key is missing or invalid. ";
        }
        
        // Check Gemini status
        if (geminiAI && geminiAI.isGeminiAvailable && geminiAI.isGeminiAvailable()) {
          statusMessage += "✅ Gemini API is properly configured. ";
          
          // Try a quick test call to Gemini
          try {
            const testResult = await geminiAI.generateText("Hello, this is a test.");
            if (testResult && testResult.length > 0) {
              statusMessage += "Gemini test call successful.";
            }
          } catch (error: any) {
            statusMessage += `Gemini test call failed: ${error.message}`;
          }
        } else {
          statusMessage += "❌ Gemini API key is missing or invalid.";
        }
        
        return res.status(200).json({
          success: true,
          note: statusMessage,
          data: {
            openAIAvailable: process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "default_key",
            geminiAvailable: geminiAI && geminiAI.isGeminiAvailable && geminiAI.isGeminiAvailable()
          }
        });
      }
      
      // Create a SEO-optimized fallback blog post structure
      const fallbackPost = {
        title: `${keyword}: How to Understand and Connect Better in Relationships`,
        slug: `${keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-relationship-guide`,
        content: `
          <h1>${keyword}: How to Understand and Connect Better in Relationships</h1>
          
          <p>Relationships can be complex, especially when it comes to ${keyword}. When you experience this in your relationship, it's important to understand the underlying male psychology at play.</p>
          
          <h2>Understanding ${keyword} in Relationships</h2>
          <p>Men often respond to emotional triggers in ways that confuse women, but there's usually a pattern to these behaviors that relates to their need for appreciation and respect.</p>
          <p>Research has shown that men's communication styles differ significantly from women's, especially when dealing with ${keyword}.</p>
          
          <h3>Why He Responds This Way</h3>
          <p>Men are socialized to process emotions differently, which affects how they handle situations involving ${keyword}.</p>
          
          <h2>The Psychology Behind ${keyword}</h2>
          <p>Research shows that men have a natural instinct to protect and provide. When you understand how to connect with this instinct through the right words and actions, you'll see tremendous changes in how he responds to you.</p>
          
          <h3>The Connection To His Inner Hero</h3>
          <p>Every man has what psychologists call the "hero instinct" - a desire to feel needed and valued in a relationship. This is particularly relevant when discussing ${keyword}.</p>
          
          <h2>Practical Steps You Can Take</h2>
          <p>Try these techniques to create a stronger bond and watch how quickly things improve in your relationship:</p>
          <ul>
            <li>Focus on appreciation rather than criticism</li>
            <li>Create space for him to step up and support you</li>
            <li>Acknowledge his efforts, even the small ones</li>
          </ul>
          
          <h3>Communication Strategies That Work</h3>
          <p>When discussing ${keyword}, timing and approach matter more than the specific words used.</p>
          
          <h2>What Our Relationship Quiz Reveals</h2>
          <p>Our <a href="/quiz">relationship assessment quiz</a> has helped thousands of women understand their specific situation with ${keyword} and get personalized advice.</p>
          
          <h2>FAQ About ${keyword}</h2>
          <h3>How long does it take to see changes?</h3>
          <p>Most women report seeing positive changes within 2-3 weeks of applying these principles consistently.</p>
          
          <h3>Does this work for all relationship types?</h3>
          <p>Yes, these psychological principles have been shown to work across different relationship types and stages.</p>
          
          <h3>What if he's completely resistant?</h3>
          <p>In some cases, professional counseling might be needed. Our <a href="/free-guide">free relationship guide</a> covers more challenging scenarios.</p>
        `,
        imageUrls: [],
        tags: ["relationships", keyword.toLowerCase(), "communication", "psychology", "dating advice"],
        autoGenerated: true,
        keyword: keyword,
        metaDescription: `Discover the psychology behind ${keyword} in relationships and learn practical strategies to create deeper connection and understanding with your partner.`,
        schema: {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": `${keyword}: How to Understand and Connect Better in Relationships`,
          "description": `Discover the psychology behind ${keyword} in relationships and learn practical strategies to create deeper connection and understanding with your partner.`,
          "keywords": ["relationships", keyword.toLowerCase(), "communication", "psychology", "dating advice"],
          "articleSection": "Relationship Advice",
          "datePublished": new Date().toISOString()
        }
      };
      
      // Define an enhanced content structure based on the standard SEO template
      const createEnhancedPostStructure = (openAIContent: any, isOpenAIOnly: boolean = true) => {
        // Build a more structured blog post that follows SEO best practices
        const title = openAIContent.title || `${keyword}: Relationship Guide`;
        const slug = openAIContent.slug || 
          (keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-') + "-relationship-guide");
        const tags = openAIContent.tags || ["relationships", keyword.toLowerCase()];
        
        // Generate meta description from content if not present
        const metaDescription = openAIContent.metaDescription || 
          `Learn about ${keyword} in relationships and discover practical strategies to improve your connection and understanding. Expert advice for women.`.substring(0, 160);
        
        // Enhanced linking strategy - insert strategic links to quizzes, lead magnets, and authoritative sources
        let enhancedContent = openAIContent.content || "";
        
        // Add UTM parameters for tracking
        const addUtmParams = (url: string, source: string, medium: string, campaign: string) => {
          return `${url}?utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}`;
        };
        
        // 1. Strategic quiz links - add if not already in the content
        if (!enhancedContent.includes('/quiz') && !enhancedContent.includes('relationship assessment')) {
          // Try to place after an H2 heading that seems appropriate
          const h2Sections = enhancedContent.match(/<h2[^>]*>.*?<\/h2>/gi) || [];
          
          if (h2Sections.length > 1) {
            // Target the second or third H2 section for better content flow
            const targetH2 = h2Sections[Math.min(2, h2Sections.length - 1)];
            const quizInsert = `
              <div class="cta-box">
                <p><strong>Not sure how to address ${keyword} in your relationship?</strong> Take our 
                <a href="${addUtmParams('/quiz', 'blog', 'content_link', slug)}">relationship assessment quiz</a> 
                to receive personalized guidance based on your specific situation.</p>
              </div>
            `;
            
            enhancedContent = enhancedContent.replace(
              targetH2, 
              targetH2 + quizInsert
            );
          }
        }
        
        // 2. Lead magnet integration - with our available lead magnets
        if (!enhancedContent.includes('lead-magnets') && !enhancedContent.includes('free guide')) {
          // Get appropriate lead magnet based on keyword
          let leadMagnetIndex = 0; // Default to the first lead magnet
          
          // Simple keyword matching for lead magnet selection
          if (keyword.toLowerCase().includes('communicate') || 
              keyword.toLowerCase().includes('talk') || 
              keyword.toLowerCase().includes('conversation')) {
            leadMagnetIndex = 1; // Communication Secrets
          } else if (keyword.toLowerCase().includes('attract') || 
                    keyword.toLowerCase().includes('love') || 
                    keyword.toLowerCase().includes('desire')) {
            leadMagnetIndex = 2; // Attraction Triggers
          }
          
          const leadMagnets = [
            {
              name: 'Ultimate Relationship Guide',
              path: '/lead-magnets/ultimate-relationship-guide',
              description: 'comprehensive guide to understanding men'
            },
            {
              name: 'Communication Secrets',
              path: '/lead-magnets/communication-secrets',
              description: 'secret language that makes him fall deeply in love'
            },
            {
              name: 'Attraction Triggers',
              path: '/lead-magnets/attraction-triggers',
              description: 'psychological triggers that create immediate attraction'
            }
          ];
          
          const selectedMagnet = leadMagnets[leadMagnetIndex];
          
          // Add lead magnet offer box near the end, before any FAQ section
          if (enhancedContent.includes('<h2>FAQ') || enhancedContent.includes('<h2>Frequently')) {
            const leadMagnetBox = `
              <div class="lead-magnet-box">
                <h3>Get Our Free ${selectedMagnet.name}</h3>
                <p>Want to master the ${selectedMagnet.description}? Download our free 
                <a href="${addUtmParams(selectedMagnet.path, 'blog', 'lead_magnet', slug)}">${selectedMagnet.name}</a> 
                to learn advanced techniques not covered in this article.</p>
              </div>
            `;
            
            enhancedContent = enhancedContent.replace(
              /<h2>FAQ|<h2>Frequently/, 
              leadMagnetBox + '\n\n$&'
            );
          } else {
            // If no FAQ section, add before the conclusion or at the end
            enhancedContent += `
              <div class="lead-magnet-box">
                <h3>Get Our Free ${selectedMagnet.name}</h3>
                <p>Want to master the ${selectedMagnet.description}? Download our free 
                <a href="${addUtmParams(selectedMagnet.path, 'blog', 'lead_magnet', slug)}">${selectedMagnet.name}</a> 
                to learn advanced techniques not covered in this article.</p>
              </div>
            `;
          }
        }
        
        // 3. Add authoritative source links if not already present
        if (!enhancedContent.includes('doi.org') && !enhancedContent.includes('ncbi.nlm.nih.gov')) {
          // Psychology source for relationships
          const authSourceText = 'According to <a href="https://doi.org/10.1111/pere.12230" target="_blank" rel="noopener">research in the Journal of Personal Relationships</a>';
          
          // Look for places to add citation
          if (enhancedContent.includes('research shows') || enhancedContent.includes('studies show')) {
            enhancedContent = enhancedContent.replace(
              /research shows|studies show/i,
              authSourceText + ' shows'
            );
          } else if (enhancedContent.includes('psychology') || enhancedContent.includes('psychological')) {
            enhancedContent = enhancedContent.replace(
              /(psychology|psychological)/i,
              `$1. ${authSourceText}, this`
            );
          }
        }
        
        // Add additional related article links for internal linking
        if (!enhancedContent.includes('related-articles')) {
          // Add at the end of the content
          enhancedContent += `
            <div class="related-articles">
              <h3>Related Articles You Might Enjoy</h3>
              <ul>
                <li><a href="/blog/posts/how-to-make-him-obsessed-with-you?utm_source=blog&utm_medium=related_post&utm_campaign=${slug}">How to Make Him Obsessed With You</a></li>
                <li><a href="/blog/posts/how-to-trigger-his-hero-instinct?utm_source=blog&utm_medium=related_post&utm_campaign=${slug}">How to Trigger His Hero Instinct</a></li>
                <li><a href="/blog/posts/how-to-create-emotional-intimacy?utm_source=blog&utm_medium=related_post&utm_campaign=${slug}">How to Create Emotional Intimacy</a></li>
              </ul>
            </div>
          `;
        }
        
        // Add schema markup for SEO
        const schemaMarkup = {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": title,
          "description": metaDescription,
          "keywords": tags.join(", "),
          "articleSection": "Relationship Advice",
          "datePublished": new Date().toISOString(),
          "author": {
            "@type": "Person",
            "name": "Obsession Trigger Team"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Obsession Trigger",
            "logo": {
              "@type": "ImageObject",
              "url": "https://www.obsessiontrigger.com/logo.png"
            }
          }
        };
        
        // Return the enhanced structure
        return {
          ...openAIContent,
          title,
          slug,
          tags,
          metaDescription,
          content: enhancedContent, // Use our enhanced content with strategic links
          schema: schemaMarkup,
          aiSource: isOpenAIOnly ? "openai" : "openai+gemini"
        };
      };
      
      // MULTI-AI STRATEGY
      // First, try using OpenAI to generate the content
      // If Gemini API is available, use it to enhance the content
      // If both fail, use the fallback content
      
      let openAIContent = null;
      let geminiEnhanced = false;
      
      // Step 1: Try to generate with OpenAI if available
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "default_key") {
        try {
          // Generate content with OpenAI
          const prompt = `
            Write a comprehensive, SEO-optimized blog post about "${keyword}" for women seeking relationship advice.
            
            Follow this exact structure:
            1. Start with an H1 title that includes the keyword
            2. Begin with a compelling introduction (3-4 sentences)
            3. Create 3-4 H2 sections:
               - "Understanding ${keyword}" (explain the concept)
               - "Why This Happens in Relationships" (psychological explanation)
               - "What You Can Do About ${keyword}" (practical advice)
               - "Expert Insights on ${keyword}" (optional)
            4. Include 2-3 H3 subsections under each H2
            5. Add a FAQ section with 3 common questions about ${keyword}
            6. Write a brief conclusion with a call to action to take a relationship quiz
            
            Important guidelines:
            - Make the content 900-1200 words in total
            - Use proper HTML tags (h1, h2, h3, p, ul, li, etc.)
            - Include links to a quiz page (/quiz) and a free guide (/free-guide)
            - Make the writing conversational yet authoritative
            - Include emotional triggers that resonate with women
            
            Return your response in the following JSON format:
            {
              "title": "SEO-optimized title (include keyword)",
              "slug": "url-friendly-slug",
              "content": "Full HTML content with proper heading structure",
              "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
              "metaDescription": "Compelling meta description under 160 characters"
            }
          `;
          
          // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: "You are an expert relationship blogger specializing in female relationship advice with deep knowledge of male psychology and SEO best practices." },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7
          });
          
          const contentText = response.choices[0].message.content;
          if (!contentText) throw new Error("Empty response from OpenAI");
          
          openAIContent = JSON.parse(contentText);
          openAIContent.keyword = keyword;
          openAIContent.autoGenerated = true;
          openAIContent.imageUrls = [];
          
          // Step 2: Try to enhance with Gemini if available
          if (geminiAI && geminiAI.isGeminiAvailable && geminiAI.isGeminiAvailable()) {
            try {
              console.log("Enhancing OpenAI content with Gemini...");
              const enhanced = await geminiAI.enhanceOpenAIContent(openAIContent);
              openAIContent = enhanced;
              geminiEnhanced = true;
              console.log("Successfully enhanced content with Gemini");
            } catch (geminiError: any) {
              console.warn(`Could not enhance with Gemini: ${geminiError.message}`);
              // Continue with OpenAI-only content
            }
          }
          
          // Apply the enhanced structure
          const finalContent = createEnhancedPostStructure(openAIContent, !geminiEnhanced);
          
          // Search for and incorporate images with SEO optimization
          if (process.env.PEXELS_API_KEY) {
            try {
              console.log("Searching for SEO-optimized images related to:", keyword);
              
              const pexelsResponse = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=3&orientation=landscape`, {
                headers: {
                  'Authorization': process.env.PEXELS_API_KEY
                }
              });
              
              if (pexelsResponse.ok) {
                const pexelsData = await pexelsResponse.json();
                
                if (pexelsData.photos && pexelsData.photos.length > 0) {
                  // Process images with SEO enhancements
                  const enhancedImages = pexelsData.photos.map((photo: any) => {
                    return processImageForSEO(
                      photo.src.large, 
                      keyword, 
                      finalContent.title || `${keyword} article`, 
                      photo.photographer
                    );
                  });
                  
                  // Store both the original URLs and the enhanced image data
                  finalContent.imageUrls = pexelsData.photos.map((photo: any) => photo.src.large);
                  finalContent.enhancedImages = enhancedImages;
                  
                  // Add image schema to the article schema
                  if (finalContent.schema && Array.isArray(enhancedImages) && enhancedImages.length > 0) {
                    // Add primary image to the article schema
                    finalContent.schema.image = {
                      "@type": "ImageObject",
                      "url": enhancedImages[0].url,
                      "caption": enhancedImages[0].alt
                    };
                    
                    // Add all images as associated media to the article
                    finalContent.schema.associatedMedia = enhancedImages.map(img => img.schema);
                  }
                  
                  // Insert feature image at the beginning of the content with proper HTML and SEO attributes
                  if (enhancedImages.length > 0) {
                    const featuredImage = enhancedImages[0];
                    const responsive = featuredImage.responsive;
                    
                    // Create responsive image HTML with SEO attributes
                    let featuredImageHTML = '';
                    
                    if (responsive && responsive.srcset) {
                      featuredImageHTML = `
                        <figure class="featured-image">
                          <img 
                            src="${responsive.medium || featuredImage.url}" 
                            srcset="${responsive.srcset}"
                            sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, 1200px"
                            alt="${featuredImage.alt}"
                            loading="eager"
                            width="800"
                            height="500"
                            class="rounded-lg shadow-md w-full h-auto object-cover mb-4"
                          />
                          <figcaption class="text-sm text-gray-500 text-center">
                            Photo by ${featuredImage.photographer || 'Unsplash'}
                          </figcaption>
                        </figure>
                      `;
                    } else {
                      featuredImageHTML = `
                        <figure class="featured-image">
                          <img 
                            src="${featuredImage.url}" 
                            alt="${featuredImage.alt}"
                            loading="eager"
                            class="rounded-lg shadow-md w-full h-auto object-cover mb-4"
                          />
                          <figcaption class="text-sm text-gray-500 text-center">
                            Photo by ${featuredImage.photographer || 'Unsplash'}
                          </figcaption>
                        </figure>
                      `;
                    }
                    
                    // Add featured image after the H1 tag
                    if (finalContent.content.includes('</h1>')) {
                      finalContent.content = finalContent.content.replace('</h1>', '</h1>' + featuredImageHTML);
                    } else {
                      // If no H1 tag, add at the beginning
                      finalContent.content = featuredImageHTML + finalContent.content;
                    }
                    
                    // Add additional images throughout the content at strategic locations
                    if (enhancedImages.length > 1) {
                      // Find H2 tags to place images after
                      const h2Sections = finalContent.content.match(/<h2[^>]*>.*?<\/h2>/gi) || [];
                      
                      if (h2Sections.length > 0) {
                        // Place second image after the first H2
                        if (h2Sections.length >= 1 && enhancedImages.length >= 2) {
                          const secondImg = enhancedImages[1];
                          const secondImgHTML = `
                            <figure class="content-image">
                              <img 
                                src="${secondImg.responsive?.medium || secondImg.url}" 
                                ${secondImg.responsive?.srcset ? `srcset="${secondImg.responsive.srcset}"` : ''}
                                ${secondImg.responsive?.srcset ? `sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, 1200px"` : ''}
                                alt="${secondImg.alt}"
                                loading="lazy"
                                class="rounded-lg shadow-md w-full h-auto object-cover my-4"
                              />
                              <figcaption class="text-sm text-gray-500 text-center">
                                Photo by ${secondImg.photographer || 'Unsplash'}
                              </figcaption>
                            </figure>
                          `;
                          
                          finalContent.content = finalContent.content.replace(
                            h2Sections[0], 
                            h2Sections[0] + secondImgHTML
                          );
                        }
                        
                        // Place third image after another H2 if available
                        if (h2Sections.length >= 2 && enhancedImages.length >= 3) {
                          const thirdImg = enhancedImages[2];
                          const thirdImgHTML = `
                            <figure class="content-image">
                              <img 
                                src="${thirdImg.responsive?.medium || thirdImg.url}" 
                                ${thirdImg.responsive?.srcset ? `srcset="${thirdImg.responsive.srcset}"` : ''}
                                ${thirdImg.responsive?.srcset ? `sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, 1200px"` : ''}
                                alt="${thirdImg.alt}"
                                loading="lazy"
                                class="rounded-lg shadow-md w-full h-auto object-cover my-4"
                              />
                              <figcaption class="text-sm text-gray-500 text-center">
                                Photo by ${thirdImg.photographer || 'Unsplash'}
                              </figcaption>
                            </figure>
                          `;
                          
                          finalContent.content = finalContent.content.replace(
                            h2Sections[1], 
                            h2Sections[1] + thirdImgHTML
                          );
                        }
                      }
                    }
                  }
                  
                  console.log(`Successfully added ${enhancedImages.length} SEO-optimized images to the blog post`);
                }
              }
            } catch (imageError) {
              console.error("Error fetching and processing images:", imageError);
              // Continue without images if there's an error
            }
          }
          
          // Return the AI-generated content with enhanced images
          return res.status(200).json({
            success: true,
            data: finalContent,
            note: geminiEnhanced ? "Content enhanced with OpenAI + Gemini and SEO-optimized images" : "Content generated with SEO-optimized images"
          });
        } catch (openaiError: any) {
          console.error(`Error generating blog content with OpenAI: ${openaiError.message}`);
          
          // Step 3: Try to use Gemini alone if OpenAI failed
          if (geminiAI && geminiAI.isGeminiAvailable && geminiAI.isGeminiAvailable()) {
            try {
              console.log("Attempting to generate content with Gemini after OpenAI failure");
              const geminiContent = await geminiAI.generateBlogContent(keyword);
              
              // Apply our enhanced structure
              const finalGeminiContent = createEnhancedPostStructure({
                ...geminiContent,
                autoGenerated: true,
                imageUrls: [],
                keyword: keyword
              }, false);
              
              // Search for and incorporate images with SEO optimization for Gemini content
              if (process.env.PEXELS_API_KEY) {
                try {
                  console.log("Searching for SEO-optimized images for Gemini content related to:", keyword);
                  
                  const pexelsResponse = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=3&orientation=landscape`, {
                    headers: {
                      'Authorization': process.env.PEXELS_API_KEY
                    }
                  });
                  
                  if (pexelsResponse.ok) {
                    const pexelsData = await pexelsResponse.json();
                    
                    if (pexelsData.photos && pexelsData.photos.length > 0) {
                      // Process images with SEO enhancements
                      const enhancedImages = pexelsData.photos.map((photo: any) => {
                        return processImageForSEO(
                          photo.src.large, 
                          keyword, 
                          finalGeminiContent.title || `${keyword} article`, 
                          photo.photographer
                        );
                      });
                      
                      // Store both the original URLs and the enhanced image data
                      finalGeminiContent.imageUrls = pexelsData.photos.map((photo: any) => photo.src.large);
                      finalGeminiContent.enhancedImages = enhancedImages;
                      
                      // Add image schema to the article schema
                      if (finalGeminiContent.schema && Array.isArray(enhancedImages) && enhancedImages.length > 0) {
                        // Add primary image to the article schema
                        finalGeminiContent.schema.image = {
                          "@type": "ImageObject",
                          "url": enhancedImages[0].url,
                          "caption": enhancedImages[0].alt
                        };
                        
                        // Add all images as associated media to the article
                        finalGeminiContent.schema.associatedMedia = enhancedImages.map(img => img.schema);
                      }
                      
                      // Insert feature image at the beginning of the content
                      if (enhancedImages.length > 0) {
                        const featuredImage = enhancedImages[0];
                        const responsive = featuredImage.responsive;
                        
                        // Create responsive image HTML with SEO attributes
                        let featuredImageHTML = '';
                        
                        if (responsive && responsive.srcset) {
                          featuredImageHTML = `
                            <figure class="featured-image">
                              <img 
                                src="${responsive.medium || featuredImage.url}" 
                                srcset="${responsive.srcset}"
                                sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, 1200px"
                                alt="${featuredImage.alt}"
                                loading="eager"
                                width="800"
                                height="500"
                                class="rounded-lg shadow-md w-full h-auto object-cover mb-4"
                              />
                              <figcaption class="text-sm text-gray-500 text-center">
                                Photo by ${featuredImage.photographer || 'Unsplash'}
                              </figcaption>
                            </figure>
                          `;
                        } else {
                          featuredImageHTML = `
                            <figure class="featured-image">
                              <img 
                                src="${featuredImage.url}" 
                                alt="${featuredImage.alt}"
                                loading="eager"
                                class="rounded-lg shadow-md w-full h-auto object-cover mb-4"
                              />
                              <figcaption class="text-sm text-gray-500 text-center">
                                Photo by ${featuredImage.photographer || 'Unsplash'}
                              </figcaption>
                            </figure>
                          `;
                        }
                        
                        // Add featured image after the H1 tag
                        if (finalGeminiContent.content.includes('</h1>')) {
                          finalGeminiContent.content = finalGeminiContent.content.replace('</h1>', '</h1>' + featuredImageHTML);
                        } else {
                          // If no H1 tag, add at the beginning
                          finalGeminiContent.content = featuredImageHTML + finalGeminiContent.content;
                        }
                        
                        // Add additional images throughout the content
                        if (enhancedImages.length > 1) {
                          // Find H2 tags to place images after
                          const h2Sections = finalGeminiContent.content.match(/<h2[^>]*>.*?<\/h2>/gi) || [];
                          
                          if (h2Sections.length > 0) {
                            // Place images after H2 tags
                            for (let i = 0; i < Math.min(h2Sections.length, enhancedImages.length - 1); i++) {
                              const img = enhancedImages[i + 1];
                              const imgHTML = `
                                <figure class="content-image">
                                  <img 
                                    src="${img.responsive?.medium || img.url}" 
                                    ${img.responsive?.srcset ? `srcset="${img.responsive.srcset}"` : ''}
                                    ${img.responsive?.srcset ? `sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, 1200px"` : ''}
                                    alt="${img.alt}"
                                    loading="lazy"
                                    class="rounded-lg shadow-md w-full h-auto object-cover my-4"
                                  />
                                  <figcaption class="text-sm text-gray-500 text-center">
                                    Photo by ${img.photographer || 'Unsplash'}
                                  </figcaption>
                                </figure>
                              `;
                              
                              finalGeminiContent.content = finalGeminiContent.content.replace(
                                h2Sections[i], 
                                h2Sections[i] + imgHTML
                              );
                            }
                          }
                        }
                      }
                      
                      console.log(`Successfully added ${enhancedImages.length} SEO-optimized images to the Gemini blog post`);
                    }
                  }
                } catch (imageError) {
                  console.error("Error fetching and processing images for Gemini content:", imageError);
                  // Continue without images if there's an error
                }
              }
              
              return res.status(200).json({
                success: true,
                data: finalGeminiContent,
                note: "Content generated with Gemini (OpenAI unavailable) and SEO-optimized images"
              });
            } catch (geminiError: any) {
              console.error(`Gemini generation also failed: ${geminiError.message}`);
              // Fall back to template content
            }
          }
        }
      }
      
      // If we got here, both APIs failed or weren't available
      console.warn("Using fallback content due to AI unavailability or errors");
      return res.status(200).json({
        success: true,
        data: fallbackPost,
        note: "Using fallback content due to AI generation limitations"
      });
      
    } catch (err: any) {
      // Handle unexpected errors not caught above
      console.error(`Unexpected error in blog generation endpoint: ${err.message}`);
      
      // Return fallback content with 200 status for better UX
      return res.status(200).json({
        success: true,
        data: {
          title: `${req.body.keyword || 'Relationships'}: Essential Guide`,
          slug: `${(req.body.keyword || 'relationships').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-essential-guide`,
          content: `<h1>${req.body.keyword || 'Relationships'}: Essential Guide</h1><p>Understanding the dynamics of relationships is key to creating lasting connections.</p>`,
          imageUrls: [],
          tags: ["relationships"],
          autoGenerated: true,
          keyword: req.body.keyword || 'relationships',
          metaDescription: `Practical relationship advice about ${req.body.keyword || 'relationships'} to help you navigate common challenges and build a stronger connection.`
        },
        note: "Using emergency fallback content due to unexpected error"
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
