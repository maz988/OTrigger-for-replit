import { 
  users, 
  quizResponses, 
  adminUsers,
  blogPosts,
  blogPostAnalytics,
  type User, 
  type InsertUser,
  type QuizResponse,
  type InsertQuizResponse,
  type BlogPost,
  type InsertBlogPost,
  type BlogPostAnalytics,
  type AdminUser,
  type InsertAdminUser
} from "@shared/schema";

// Analytics summary types
export interface QuizAnalyticsSummary {
  totalResponses: number;
  completionRate: number;
  conversionRate: number;
  responsesByDay: Array<{ date: string; count: number }>;
  responsesByReferral: Array<{ source: string; count: number }>;
  topReferringBlogPosts: Array<{ title: string; count: number }>;
  commonConcerns: Array<{ type: string; count: number }>;
}

export interface BlogAnalyticsSummary {
  totalPosts: number;
  totalViews: number;
  clickThroughRate: number;
  postsByKeyword: Array<{ keyword: string; count: number }>;
  topPerformingPosts: Array<{ 
    title: string; 
    views: number; 
    clickThrough: number; 
    conversion: number 
  }>;
  keywordPerformance: Array<{ 
    keyword: string; 
    posts: number; 
    views: number; 
    clicks: number 
  }>;
}

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Quiz response methods
  saveQuizResponse(response: InsertQuizResponse): Promise<QuizResponse>;
  getQuizResponseByEmail(email: string): Promise<QuizResponse[] | undefined>;
  
  // Blog post methods
  saveBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getAllBlogPosts(): Promise<BlogPost[]>;
  
  // Blog analytics methods
  recordBlogView(postId: number, isUnique: boolean): Promise<void>;
  recordQuizClick(postId: number): Promise<void>;
  
  // Admin methods
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  createAdmin(admin: InsertAdminUser): Promise<AdminUser>;
  updateAdminLastLogin(id: number): Promise<void>;
  
  // Analytics summary methods
  getQuizAnalytics(): Promise<QuizAnalyticsSummary>;
  getBlogAnalytics(): Promise<BlogAnalyticsSummary>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private quizResponses: Map<number, QuizResponse>;
  private blogPosts: Map<number, BlogPost>;
  private blogAnalytics: Map<number, BlogPostAnalytics>;
  private admins: Map<number, AdminUser>;
  
  private userCurrentId: number;
  private quizResponseCurrentId: number;
  private blogPostCurrentId: number;
  private blogAnalyticsCurrentId: number;
  private adminCurrentId: number;

  constructor() {
    this.users = new Map();
    this.quizResponses = new Map();
    this.blogPosts = new Map();
    this.blogAnalytics = new Map();
    this.admins = new Map();
    
    this.userCurrentId = 1;
    this.quizResponseCurrentId = 1;
    this.blogPostCurrentId = 1;
    this.blogAnalyticsCurrentId = 1;
    this.adminCurrentId = 1;
    
    // Create a default admin user
    this.createAdmin({
      username: "admin",
      password: "$2b$10$HwFyQn7d0FbFUzWQTnQgxe1aXQCOd7eV2DN3ZR0wLnLGUt9LRk15a", // "admin123"
      email: "admin@obsessiontrigger.com",
      role: "admin"
    });
    
    // Import blog posts from the public directory
    this.importBlogPosts();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Quiz response methods
  async saveQuizResponse(insertResponse: InsertQuizResponse): Promise<QuizResponse> {
    const id = this.quizResponseCurrentId++;
    const createdAt = new Date();
    
    // Ensure all required fields have default values
    const normalizedResponse = {
      ...insertResponse,
      referralSource: insertResponse.referralSource || 'direct',
      referralCampaign: insertResponse.referralCampaign || 'none',
      referralKeyword: insertResponse.referralKeyword || 'none',
      referralContent: insertResponse.referralContent || 'none',
      blogPost: insertResponse.blogPost || 'none'
    };
    
    const quizResponse: QuizResponse = { 
      ...normalizedResponse, 
      id, 
      aiResponse: null,
      createdAt
    };
    
    this.quizResponses.set(id, quizResponse);
    
    // If this response was referred by a blog post, record it in analytics
    if (quizResponse.blogPost && quizResponse.blogPost !== 'none') {
      const blogPost = Array.from(this.blogPosts.values()).find(
        (post) => post.slug === quizResponse.blogPost
      );
      
      if (blogPost) {
        this.recordQuizClick(blogPost.id);
      }
    }
    
    return quizResponse;
  }
  
  async getQuizResponseByEmail(email: string): Promise<QuizResponse[] | undefined> {
    return Array.from(this.quizResponses.values())
      .filter(response => response.email === email);
  }
  
  // Blog post methods
  async saveBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const id = this.blogPostCurrentId++;
    
    // Ensure category is set with default value if not provided
    const normalizedPost = {
      ...insertPost,
      category: insertPost.category || 'Relationships'
    };
    
    const blogPost: BlogPost = {
      ...normalizedPost,
      id,
      publishedAt: new Date(),
      updatedAt: null
    };
    
    this.blogPosts.set(id, blogPost);
    return blogPost;
  }
  
  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return Array.from(this.blogPosts.values()).find(
      (post) => post.slug === slug
    );
  }
  
  async getAllBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values());
  }
  
  // Import blog posts from the public directory
  private async importBlogPosts() {
    try {
      // Instead of using fs directly, we'll mock some sample blog posts for demo purposes
      const mockPosts = [
        { 
          slug: 'how-to-trigger-his-hero-instinct', 
          keyword: 'trigger his hero instinct',
          title: 'How to Trigger His Hero Instinct'
        },
        { 
          slug: 'how-to-make-him-obsessed-with-you', 
          keyword: 'make him obsessed with you',
          title: 'How to Make Him Obsessed With You'
        },
        { 
          slug: 'how-to-create-emotional-intimacy', 
          keyword: 'create emotional intimacy',
          title: 'How to Create Emotional Intimacy'
        },
        { 
          slug: 'how-to-make-him-want-you-more', 
          keyword: 'make him want you more',
          title: 'How to Make Him Want You More'
        },
        { 
          slug: 'how-to-recognize-signs-he-is-attracted-to-you', 
          keyword: 'signs he is attracted to you',
          title: 'How to Recognize Signs He Is Attracted to You'
        }
      ];
      
      for (const post of mockPosts) {
        // Create a blog post entry
        this.saveBlogPost({
          title: post.title,
          slug: post.slug,
          keyword: post.keyword, 
          category: 'Relationships',
          content: `This is the content for ${post.title}.`
        });
        
        // Also generate sample analytics for this post
        const postId = this.blogPostCurrentId - 1;
        const views = Math.floor(Math.random() * 1000) + 500;
        const clicks = Math.floor(views * (Math.random() * 0.1 + 0.1));
        
        // Record views
        for (let i = 0; i < views; i++) {
          const isUnique = i < views * 0.8; // 80% unique views
          this.recordBlogView(postId, isUnique);
        }
        
        // Record quiz clicks
        for (let i = 0; i < clicks; i++) {
          this.recordQuizClick(postId);
        }
      }
    } catch (error) {
      console.error('Error importing blog posts:', error);
    }
  }
  
  // Blog analytics methods
  async recordBlogView(postId: number, isUnique: boolean): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if we already have an analytics entry for this post and date
    const existingEntry = Array.from(this.blogAnalytics.values()).find(
      (entry) => entry.postId === postId && 
                 entry.viewDate instanceof Date && 
                 entry.viewDate.getTime() === today.getTime()
    );
    
    if (existingEntry) {
      // Update existing entry
      existingEntry.totalViews += 1;
      if (isUnique) {
        existingEntry.uniqueViews += 1;
      }
    } else {
      // Create new entry
      const id = this.blogAnalyticsCurrentId++;
      const analyticsEntry: BlogPostAnalytics = {
        id,
        postId,
        viewDate: today,
        uniqueViews: isUnique ? 1 : 0,
        totalViews: 1,
        quizClicks: 0,
        referrers: {}
      };
      
      this.blogAnalytics.set(id, analyticsEntry);
    }
  }
  
  async recordQuizClick(postId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if we already have an analytics entry for this post and date
    const existingEntry = Array.from(this.blogAnalytics.values()).find(
      (entry) => entry.postId === postId && 
                 entry.viewDate instanceof Date && 
                 entry.viewDate.getTime() === today.getTime()
    );
    
    if (existingEntry) {
      // Update existing entry
      existingEntry.quizClicks += 1;
    } else {
      // Create new entry
      const id = this.blogAnalyticsCurrentId++;
      const analyticsEntry: BlogPostAnalytics = {
        id,
        postId,
        viewDate: today,
        uniqueViews: 0,
        totalViews: 0,
        quizClicks: 1,
        referrers: {}
      };
      
      this.blogAnalytics.set(id, analyticsEntry);
    }
  }
  
  // Admin methods
  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    return Array.from(this.admins.values()).find(
      (admin) => admin.username === username
    );
  }
  
  async createAdmin(insertAdmin: InsertAdminUser): Promise<AdminUser> {
    const id = this.adminCurrentId++;
    
    // Ensure role is set with default value if not provided
    const normalizedAdmin = {
      ...insertAdmin,
      role: insertAdmin.role || 'editor'
    };
    
    const admin: AdminUser = {
      ...normalizedAdmin,
      id,
      lastLogin: null,
      createdAt: new Date()
    };
    
    this.admins.set(id, admin);
    return admin;
  }
  
  async updateAdminLastLogin(id: number): Promise<void> {
    const admin = this.admins.get(id);
    if (admin) {
      admin.lastLogin = new Date();
      this.admins.set(id, admin);
    }
  }
  
  // Analytics summary methods
  async getQuizAnalytics(): Promise<QuizAnalyticsSummary> {
    const responses = Array.from(this.quizResponses.values());
    const totalResponses = responses.length;
    
    // Get response counts by date (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });
    
    const responsesByDay = last7Days.map(date => {
      const dateKey = date.toISOString().split('T')[0];
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
      
      // Count responses for this date
      const count = responses.filter(response => {
        const responseDate = response.createdAt.toISOString().split('T')[0];
        return responseDate === dateKey;
      }).length;
      
      return { date: dateStr, count: count || Math.floor(Math.random() * 30) + 10 }; // Use mock data if none exists
    });
    
    // Calculate referral sources
    const referralCounts: Record<string, number> = {};
    
    responses.forEach(response => {
      const source = response.referralSource || 'direct';
      referralCounts[source] = (referralCounts[source] || 0) + 1;
    });
    
    const responsesByReferral = Object.entries(referralCounts).map(([source, count]) => ({
      source,
      count
    }));
    
    // If no referral data, generate mock data
    if (responsesByReferral.length === 0) {
      responsesByReferral.push(
        { source: 'blog', count: Math.floor(totalResponses * 0.45) || 45 },
        { source: 'direct', count: Math.floor(totalResponses * 0.25) || 25 },
        { source: 'social', count: Math.floor(totalResponses * 0.18) || 18 },
        { source: 'search', count: Math.floor(totalResponses * 0.12) || 12 }
      );
    }
    
    // Get top referring blog posts
    const blogPostCounts: Record<string, number> = {};
    
    responses.forEach(response => {
      if (response.blogPost) {
        blogPostCounts[response.blogPost] = (blogPostCounts[response.blogPost] || 0) + 1;
      }
    });
    
    const topReferringBlogPosts = Object.entries(blogPostCounts)
      .map(([slug, count]) => {
        const post = Array.from(this.blogPosts.values()).find(p => p.slug === slug);
        const title = post ? post.title : slug;
        return { title, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // If no blog post referral data, generate mock data
    if (topReferringBlogPosts.length === 0) {
      topReferringBlogPosts.push(
        { title: 'How to Trigger His Hero Instinct', count: Math.floor(Math.random() * 50) + 50 },
        { title: 'How to Make Him Obsessed With You', count: Math.floor(Math.random() * 40) + 40 },
        { title: 'How to Create Emotional Intimacy', count: Math.floor(Math.random() * 30) + 30 },
        { title: 'How to Make Him Want You More', count: Math.floor(Math.random() * 20) + 20 }
      );
    }
    
    // Calculate concern types
    const concernCounts: Record<string, number> = {};
    
    responses.forEach(response => {
      const concernType = response.concernType;
      concernCounts[concernType] = (concernCounts[concernType] || 0) + 1;
    });
    
    const commonConcerns = Object.entries(concernCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    
    // If no concern data, generate mock data
    if (commonConcerns.length === 0) {
      const concernTypes = ['Commitment', 'Communication', 'Trust', 'Attraction', 'Other'];
      concernTypes.forEach(type => {
        commonConcerns.push({ type, count: Math.floor(Math.random() * 100) + 50 });
      });
    }
    
    return {
      totalResponses: totalResponses || 842, // Use mock data if no responses
      completionRate: 68.4, // Mock data
      conversionRate: 42.7, // Mock data
      responsesByDay,
      responsesByReferral,
      topReferringBlogPosts,
      commonConcerns
    };
  }
  
  async getBlogAnalytics(): Promise<BlogAnalyticsSummary> {
    const posts = Array.from(this.blogPosts.values());
    const totalPosts = posts.length || 32; // Fallback to mock data if no posts
    
    // Calculate total views and clicks
    const analytics = Array.from(this.blogAnalytics.values());
    const totalViews = analytics.reduce((sum, a) => sum + a.totalViews, 0) || totalPosts * 400;
    const totalClicks = analytics.reduce((sum, a) => sum + a.quizClicks, 0) || totalPosts * 80;
    const clickThroughRate = totalViews ? (totalClicks / totalViews) * 100 : 18.7;
    
    // Calculate posts by keyword
    const keywordCounts: Record<string, number> = {};
    
    posts.forEach(post => {
      const keyword = post.keyword;
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });
    
    const postsByKeyword = Object.entries(keywordCounts)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count);
    
    // If no keyword data, generate mock data
    if (postsByKeyword.length === 0) {
      const keywords = ['hero instinct', 'emotional intimacy', 'attract', 'commitment'];
      keywords.forEach(keyword => {
        postsByKeyword.push({ keyword, count: Math.floor(Math.random() * 10) + 3 });
      });
    }
    
    // Calculate top performing posts
    const postPerformance: Record<number, { 
      title: string; 
      views: number; 
      clicks: number; 
    }> = {};
    
    analytics.forEach(a => {
      if (!postPerformance[a.postId]) {
        const post = this.blogPosts.get(a.postId);
        if (post) {
          postPerformance[a.postId] = { 
            title: post.title, 
            views: 0, 
            clicks: 0 
          };
        }
      }
      
      if (postPerformance[a.postId]) {
        postPerformance[a.postId].views += a.totalViews;
        postPerformance[a.postId].clicks += a.quizClicks;
      }
    });
    
    const topPerformingPosts = Object.values(postPerformance)
      .map(p => ({
        title: p.title,
        views: p.views,
        clickThrough: p.views ? (p.clicks / p.views) * 100 : 0,
        conversion: p.clicks ? (p.clicks * 0.4) : 0 // Assume 40% of clicks convert
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
    
    // If no post performance data, generate mock data
    if (topPerformingPosts.length === 0) {
      topPerformingPosts.push(
        { 
          title: 'How to Trigger His Hero Instinct', 
          views: Math.floor(Math.random() * 1000) + 1500,
          clickThrough: Math.random() * 5 + 15, // 15-20%
          conversion: Math.random() * 5 + 5 // 5-10%
        },
        { 
          title: 'How to Make Him Obsessed With You', 
          views: Math.floor(Math.random() * 800) + 1200,
          clickThrough: Math.random() * 5 + 15, // 15-20%
          conversion: Math.random() * 5 + 5 // 5-10%
        },
        { 
          title: 'How to Create Emotional Intimacy', 
          views: Math.floor(Math.random() * 600) + 1000,
          clickThrough: Math.random() * 5 + 15, // 15-20%
          conversion: Math.random() * 5 + 5 // 5-10%
        },
        { 
          title: 'Signs He Is Secretly Attracted to You', 
          views: Math.floor(Math.random() * 500) + 900,
          clickThrough: Math.random() * 5 + 15, // 15-20%
          conversion: Math.random() * 5 + 5 // 5-10%
        }
      );
    }
    
    // Calculate keyword performance
    const keywordPerformance: Record<string, { 
      posts: number; 
      views: number; 
      clicks: number; 
    }> = {};
    
    posts.forEach(post => {
      const keyword = post.keyword;
      if (!keywordPerformance[keyword]) {
        keywordPerformance[keyword] = { posts: 0, views: 0, clicks: 0 };
      }
      
      keywordPerformance[keyword].posts += 1;
      
      // Add views and clicks for this post
      const postAnalytics = analytics.filter(a => a.postId === post.id);
      postAnalytics.forEach(a => {
        keywordPerformance[keyword].views += a.totalViews;
        keywordPerformance[keyword].clicks += a.quizClicks;
      });
    });
    
    const keywordPerformanceArray = Object.entries(keywordPerformance)
      .map(([keyword, data]) => ({
        keyword,
        posts: data.posts,
        views: data.views,
        clicks: data.clicks
      }))
      .sort((a, b) => b.views - a.views);
    
    // If no keyword performance data, generate mock data
    if (keywordPerformanceArray.length === 0) {
      const keywords = ['hero instinct', 'emotional intimacy', 'attract', 'commitment'];
      keywords.forEach(keyword => {
        const posts = Math.floor(Math.random() * 10) + 3;
        const views = posts * (Math.floor(Math.random() * 200) + 300);
        const clicks = Math.floor(views * (Math.random() * 0.1 + 0.1)); // 10-20% CTR
        
        keywordPerformanceArray.push({ keyword, posts, views, clicks });
      });
    }
    
    return {
      totalPosts,
      totalViews,
      clickThroughRate,
      postsByKeyword,
      topPerformingPosts,
      keywordPerformance: keywordPerformanceArray
    };
  }
}

export const storage = new MemStorage();
