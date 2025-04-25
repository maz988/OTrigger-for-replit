import { 
  users, 
  quizResponses, 
  adminUsers,
  blogPosts,
  blogPostAnalytics,
  emailSubscribers,
  leadMagnets,
  emailTemplates,
  emailSequences,
  emailQueue,
  emailHistory,
  systemSettings,
  notificationTemplates,
  notificationLog,
  type User, 
  type InsertUser,
  type QuizResponse,
  type InsertQuizResponse,
  type BlogPost,
  type InsertBlogPost,
  type BlogPostAnalytics,
  type AdminUser,
  type InsertAdminUser,
  type EmailSubscriber,
  type InsertEmailSubscriber,
  type LeadMagnet,
  type InsertLeadMagnet,
  type EmailSequence,
  type InsertEmailSequence,
  type EmailTemplate,
  type InsertEmailTemplate,
  type EmailQueue,
  type InsertEmailQueue,
  type EmailHistory,
  type InsertEmailHistory,
  type SystemSetting,
  type InsertSystemSetting,
  type NotificationTemplate,
  type InsertNotificationTemplate,
  type NotificationLog,
  type InsertNotificationLog
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

export interface DashboardOverview {
  // Quiz stats
  totalQuizResponses: number;
  quizCompletionRate: number;
  
  // Blog stats
  totalBlogPosts: number;
  totalBlogViews: number;
  blogCTR: number;
  
  // Email stats
  totalSubscribers: number;
  activeSubscribers: number;
  
  // Lead magnet stats
  totalLeadMagnets: number;
  leadMagnetDownloads: number;
  
  // Affiliate stats
  totalAffiliateClicks: number;
  
  // Trending data
  quizResponsesTrend: Array<{ date: string; count: number }>;
  subscribersTrend: Array<{ date: string; count: number }>;
  blogViewsTrend: Array<{ date: string; count: number }>;
  
  // Quick stats (last 7 days)
  newQuizResponsesLast7Days: number;
  newSubscribersLast7Days: number;
  blogViewsLast7Days: number;
  leadMagnetDownloadsLast7Days: number;
}

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Quiz response methods
  saveQuizResponse(response: InsertQuizResponse): Promise<QuizResponse>;
  getQuizResponseByEmail(email: string): Promise<QuizResponse[] | undefined>;
  getAllQuizResponses(): Promise<QuizResponse[]>;
  exportQuizResponses(): Promise<string>; // CSV export
  
  // Blog post methods
  saveBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  getBlogPostById(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getAllBlogPosts(): Promise<BlogPost[]>;
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  toggleAutoScheduling(isEnabled: boolean): Promise<boolean>;
  addKeyword(keyword: string): Promise<boolean>;
  deleteKeyword(keyword: string): Promise<boolean>;
  getAllKeywords(): Promise<string[]>;
  
  // Blog analytics methods
  recordBlogView(postId: number, isUnique: boolean): Promise<void>;
  recordQuizClick(postId: number): Promise<void>;
  recordLinkClick(postId: number, linkUrl: string): Promise<void>;
  getBlogPostAnalytics(postId: number): Promise<BlogPostAnalytics | undefined>;
  
  // Admin methods
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  createAdmin(admin: InsertAdminUser): Promise<AdminUser>;
  updateAdminLastLogin(id: number): Promise<void>;
  
  // Email Subscriber methods
  getAllSubscribers(): Promise<EmailSubscriber[]>;
  getSubscriberById(id: number): Promise<EmailSubscriber | undefined>;
  getSubscriberByEmail(email: string): Promise<EmailSubscriber | undefined>;
  saveSubscriber(subscriber: InsertEmailSubscriber): Promise<EmailSubscriber>;
  updateSubscriber(id: number, subscriber: Partial<InsertEmailSubscriber>): Promise<EmailSubscriber | undefined>;
  unsubscribeByEmail(email: string): Promise<boolean>;
  
  // Lead Magnet methods
  getAllLeadMagnets(): Promise<LeadMagnet[]>;
  getLeadMagnetById(id: number): Promise<LeadMagnet | undefined>;
  saveLeadMagnet(leadMagnet: InsertLeadMagnet): Promise<LeadMagnet>;
  updateLeadMagnet(id: number, leadMagnet: Partial<InsertLeadMagnet>): Promise<LeadMagnet | undefined>;
  deleteLeadMagnet(id: number): Promise<boolean>;
  recordLeadMagnetDownload(id: number): Promise<void>;
  
  // Email Sequence methods
  getAllEmailSequences(): Promise<EmailSequence[]>;
  getEmailSequenceById(id: number): Promise<EmailSequence | undefined>;
  getDefaultEmailSequence(): Promise<EmailSequence | undefined>;
  saveEmailSequence(sequence: InsertEmailSequence): Promise<EmailSequence>;
  updateEmailSequence(id: number, sequence: Partial<InsertEmailSequence>): Promise<EmailSequence | undefined>;
  deleteEmailSequence(id: number): Promise<boolean>;
  
  // Email Template methods
  getAllEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplateById(id: number): Promise<EmailTemplate | undefined>;
  getEmailTemplatesBySequenceId(sequenceId: number): Promise<EmailTemplate[]>;
  saveEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<boolean>;
  toggleEmailTemplateStatus(id: number, isActive: boolean): Promise<boolean>;
  
  // Email Queue methods
  getAllQueuedEmails(): Promise<EmailQueue[]>;
  getQueuedEmailById(id: number): Promise<EmailQueue | undefined>;
  getQueuedEmailsBySubscriberId(subscriberId: number): Promise<EmailQueue[]>;
  getDueQueuedEmails(): Promise<EmailQueue[]>;
  queueEmail(emailQueue: InsertEmailQueue): Promise<EmailQueue>;
  updateQueuedEmailStatus(id: number, status: string, message?: string): Promise<EmailQueue | undefined>;
  deleteQueuedEmail(id: number): Promise<boolean>;
  
  // Email History methods
  getAllEmailHistory(): Promise<EmailHistory[]>;
  getEmailHistoryBySubscriberId(subscriberId: number): Promise<EmailHistory[]>;
  recordEmailSent(emailHistory: InsertEmailHistory): Promise<EmailHistory>;
  
  // System Settings methods
  getAllSettings(): Promise<SystemSetting[]>;
  getSettingByKey(key: string): Promise<SystemSetting | undefined>;
  saveSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  updateSetting(key: string, value: string): Promise<SystemSetting | undefined>;
  deleteSetting(key: string): Promise<boolean>;
  
  // Analytics summary methods
  getQuizAnalytics(): Promise<QuizAnalyticsSummary>;
  getBlogAnalytics(): Promise<BlogAnalyticsSummary>;
  getDashboardOverview(): Promise<DashboardOverview>;
  
  // Simple Notification methods (replacing HTML email templates)
  getAllNotificationTemplates(): Promise<NotificationTemplate[]>;
  getNotificationTemplate(type: string): Promise<NotificationTemplate | undefined>;
  saveNotificationTemplate(template: InsertNotificationTemplate): Promise<NotificationTemplate>;
  updateNotificationTemplate(id: number, template: Partial<InsertNotificationTemplate>): Promise<NotificationTemplate | undefined>;
  deleteNotificationTemplate(id: number): Promise<boolean>;
  
  // Notification log methods
  getAllNotificationLogs(): Promise<NotificationLog[]>;
  getNotificationLogsBySubscriberId(subscriberId: number): Promise<NotificationLog[]>;
  logNotification(log: InsertNotificationLog): Promise<NotificationLog>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private quizResponses: Map<number, QuizResponse>;
  private blogPosts: Map<number, BlogPost>;
  private blogAnalytics: Map<number, BlogPostAnalytics>;
  private admins: Map<number, AdminUser>;
  private emailSubscribers: Map<number, EmailSubscriber>;
  private leadMagnets: Map<number, LeadMagnet>;
  private emailSequences: Map<number, EmailSequence>;
  private emailTemplates: Map<number, EmailTemplate>;
  private emailQueue: Map<number, EmailQueue>;
  private emailHistory: Map<number, EmailHistory>;
  private systemSettings: Map<string, SystemSetting>;
  private notificationTemplates: Map<number, NotificationTemplate>;
  private notificationLogs: Map<number, NotificationLog>;
  private keywords: Set<string>;
  private autoSchedulingEnabled: boolean;
  
  // Email queue methods
  async getAllQueuedEmails(): Promise<EmailQueue[]> {
    return Array.from(this.emailQueue.values());
  }
  
  async getQueuedEmailById(id: number): Promise<EmailQueue | undefined> {
    return this.emailQueue.get(id);
  }
  
  async getQueuedEmailsBySubscriberId(subscriberId: number): Promise<EmailQueue[]> {
    return Array.from(this.emailQueue.values())
      .filter(queue => queue.subscriberId === subscriberId);
  }
  
  async getDueQueuedEmails(): Promise<EmailQueue[]> {
    const now = new Date();
    return Array.from(this.emailQueue.values())
      .filter(queue => 
        queue.status === 'pending' && 
        queue.scheduledFor <= now
      );
  }
  
  async queueEmail(insertQueuedEmail: InsertEmailQueue): Promise<EmailQueue> {
    const id = this.emailQueueCurrentId++;
    
    const queuedEmail: EmailQueue = {
      ...insertQueuedEmail,
      id,
      createdAt: new Date(),
      processedAt: null,
      status: 'pending',
      statusMessage: null
    };
    
    this.emailQueue.set(id, queuedEmail);
    return queuedEmail;
  }
  
  async updateQueuedEmailStatus(id: number, status: string, message?: string): Promise<EmailQueue | undefined> {
    const queuedEmail = this.emailQueue.get(id);
    
    if (!queuedEmail) {
      return undefined;
    }
    
    const updatedQueuedEmail: EmailQueue = {
      ...queuedEmail,
      status,
      statusMessage: message || null,
      processedAt: status === 'pending' ? null : new Date()
    };
    
    this.emailQueue.set(id, updatedQueuedEmail);
    return updatedQueuedEmail;
  }
  
  async deleteQueuedEmail(id: number): Promise<boolean> {
    if (!this.emailQueue.has(id)) {
      return false;
    }
    
    this.emailQueue.delete(id);
    return true;
  }
  
  // Email history methods
  async getAllEmailHistory(): Promise<EmailHistory[]> {
    return Array.from(this.emailHistory.values());
  }
  
  async getEmailHistoryBySubscriberId(subscriberId: number): Promise<EmailHistory[]> {
    return Array.from(this.emailHistory.values())
      .filter(history => history.subscriberId === subscriberId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime()); // Most recent first
  }
  
  async recordEmailSent(insertEmailHistory: InsertEmailHistory): Promise<EmailHistory> {
    const id = this.emailHistoryCurrentId++;
    
    const emailHistory: EmailHistory = {
      ...insertEmailHistory,
      id,
      sentAt: new Date()
    };
    
    this.emailHistory.set(id, emailHistory);
    
    // Update subscriber's lastEmailSent date
    const subscriber = this.emailSubscribers.get(insertEmailHistory.subscriberId);
    if (subscriber) {
      subscriber.lastEmailSent = new Date();
    }
    
    return emailHistory;
  }
  
  private userCurrentId: number;
  private quizResponseCurrentId: number;
  private blogPostCurrentId: number;
  private blogAnalyticsCurrentId: number;
  private adminCurrentId: number;
  private emailSubscriberCurrentId: number;
  private leadMagnetCurrentId: number;
  private emailSequenceCurrentId: number;
  private emailTemplateCurrentId: number;
  private emailQueueCurrentId: number;
  private emailHistoryCurrentId: number;
  private systemSettingCurrentId: number;
  private notificationTemplateCurrentId: number;
  private notificationLogCurrentId: number;

  constructor() {
    this.users = new Map();
    this.quizResponses = new Map();
    this.blogPosts = new Map();
    this.blogAnalytics = new Map();
    this.admins = new Map();
    this.emailSubscribers = new Map();
    this.leadMagnets = new Map();
    this.emailSequences = new Map();
    this.emailTemplates = new Map();
    this.emailQueue = new Map();
    this.emailHistory = new Map();
    this.systemSettings = new Map();
    this.keywords = new Set();
    this.autoSchedulingEnabled = true;
    
    this.userCurrentId = 1;
    this.quizResponseCurrentId = 1;
    this.blogPostCurrentId = 1;
    this.blogAnalyticsCurrentId = 1;
    this.adminCurrentId = 1;
    this.emailSubscriberCurrentId = 1;
    this.leadMagnetCurrentId = 1;
    this.emailSequenceCurrentId = 1;
    this.emailTemplateCurrentId = 1;
    this.emailQueueCurrentId = 1;
    this.emailHistoryCurrentId = 1;
    this.systemSettingCurrentId = 1;
    
    // Create a default admin user with password "admin123"
    this.createDefaultAdmin();
    
    // Import blog posts from the public directory
    this.importBlogPosts();
    
    // Initialize default keywords
    this.initializeKeywords();
    
    // Initialize sample subscribers
    this.initializeSubscribers();
    
    // Initialize sample lead magnets
    this.initializeLeadMagnets();
    
    // Initialize system settings
    this.initializeSystemSettings();
    
    // Initialize default email sequence and templates
    this.initializeEmailSequences();
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
          category: post.slug.includes('hero-instinct') || post.slug.includes('obsessed') ? 'Attraction' : 
                 post.slug.includes('intimacy') ? 'Communication' : 'Relationships',
          content: this.generateMockContentForPost(post.title, post.keyword)
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
  
  async recordLinkClick(postId: number, linkUrl: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if we already have an analytics entry for this post and date
    const existingEntry = Array.from(this.blogAnalytics.values()).find(
      (entry) => entry.postId === postId && 
                 entry.viewDate instanceof Date && 
                 entry.viewDate.getTime() === today.getTime()
    );
    
    if (existingEntry) {
      // Update existing entry's referrers
      if (!existingEntry.referrers) {
        existingEntry.referrers = {};
      }
      
      if (existingEntry.referrers[linkUrl]) {
        existingEntry.referrers[linkUrl]++;
      } else {
        existingEntry.referrers[linkUrl] = 1;
      }
    } else {
      // Create new entry
      const id = this.blogAnalyticsCurrentId++;
      const analyticsEntry: BlogPostAnalytics = {
        id,
        postId,
        viewDate: today,
        uniqueViews: 0,
        totalViews: 0,
        quizClicks: 0,
        referrers: {
          [linkUrl]: 1
        }
      };
      
      this.blogAnalytics.set(id, analyticsEntry);
    }
  }
  
  async getBlogPostById(id: number): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }
  
  async getBlogPostAnalytics(postId: number): Promise<BlogPostAnalytics | undefined> {
    return Array.from(this.blogAnalytics.values()).find(
      (analytics) => analytics.postId === postId
    );
  }
  
  async updateBlogPost(id: number, updates: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const post = this.blogPosts.get(id);
    
    if (!post) {
      return undefined;
    }
    
    // Create updated post with new values
    const updatedPost: BlogPost = {
      ...post,
      ...updates,
      updatedAt: new Date()
    };
    
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }
  
  async deleteBlogPost(id: number): Promise<boolean> {
    if (!this.blogPosts.has(id)) {
      return false;
    }
    
    this.blogPosts.delete(id);
    
    // Also delete associated analytics
    const analyticsToDelete = Array.from(this.blogAnalytics.entries())
      .filter(([_, analytics]) => analytics.postId === id);
      
    for (const [analyticsId, _] of analyticsToDelete) {
      this.blogAnalytics.delete(analyticsId);
    }
    
    return true;
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
  
  private async createDefaultAdmin() {
    try {
      // Use static password hash for password123
      // This is pre-computed using bcrypt.hash('password123', 10)
      const hashedPassword = '$2b$10$MhMpHSVh3hV/qV6QGcSJdutMOA5biJDjdm5UmSNL.fSURJQnmi1g.';
      
      // Create a default admin user with the previously used credentials
      const adminExists = await this.getAdminByUsername('newadmin');
      
      if (!adminExists) {
        // Create admin
        const admin = {
          username: 'newadmin',
          password: hashedPassword,
          email: 'admin@obsessiontrigger.com',
          role: 'admin'
        };
        
        await this.createAdmin(admin);
        console.log('Default admin user created with username: newadmin, password: password123');
      }
    } catch (error) {
      console.error('Error creating default admin:', error);
    }
  }
  
  private generateMockContentForPost(title: string, keyword: string): string {
    // Create realistic blog post content for each post
    return `Understanding ${keyword} is crucial for a fulfilling relationship. Many women struggle with this aspect of their romantic relationships, often unsure about how to navigate the complex emotions involved.

When it comes to ${keyword}, psychological research shows that men and women often approach relationships differently. Men tend to respond strongly to feeling needed and appreciated, while also requiring space to pursue their own goals.

The "Hero Instinct" concept explains that men have an innate desire to feel essential in their partner's life. By triggering this natural instinct, you can create a deeper connection with your partner that goes beyond surface-level attraction.

Here are three practical ways to approach ${title.toLowerCase()}:

1. Create opportunities for him to feel needed without seeming dependent. Small requests for his help or opinion can make him feel valued without overwhelming him.

2. Acknowledge and appreciate his efforts, especially when he goes out of his way for you. Recognition is a powerful motivator for continued positive behavior.

3. Support his ambitions and goals while maintaining your own independence. This balanced approach creates mutual respect that strengthens your relationship foundation.

Remember that effective communication remains at the heart of any successful relationship strategy. Being clear about your needs while remaining receptive to his perspective creates the emotional safety needed for vulnerability and growth together.

If you'd like a personalized assessment of your unique relationship situation, take our comprehensive relationship quiz. In just 60 seconds, you'll receive tailored insights and strategies designed specifically for your circumstances.`;
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


  // Keyword methods
  async getAllKeywords(): Promise<string[]> {
    return Array.from(this.keywords);
  }
  
  async addKeyword(keyword: string): Promise<boolean> {
    this.keywords.add(keyword);
    return true;
  }
  
  async deleteKeyword(keyword: string): Promise<boolean> {
    return this.keywords.delete(keyword);
  }
  
  async toggleAutoScheduling(isEnabled: boolean): Promise<boolean> {
    this.autoSchedulingEnabled = isEnabled;
    return true;
  }
  
  // Quiz response methods (continued)
  async getAllQuizResponses(): Promise<QuizResponse[]> {
    return Array.from(this.quizResponses.values());
  }
  
  async exportQuizResponses(): Promise<string> {
    const responses = await this.getAllQuizResponses();
    
    // Create CSV content
    const headers = ['ID', 'First Name', 'Email', 'Relationship Status', 'Concern Type', 'Created At', 'Source'];
    const rows = responses.map(response => [
      response.id,
      response.firstName,
      response.email,
      response.relationshipStatus,
      response.concernType,
      response.createdAt.toISOString(),
      response.referralSource
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  }
  
  // Email subscriber methods
  async getAllSubscribers(): Promise<EmailSubscriber[]> {
    return Array.from(this.emailSubscribers.values());
  }
  
  async getSubscriberById(id: number): Promise<EmailSubscriber | undefined> {
    return this.emailSubscribers.get(id);
  }
  
  async getSubscriberByEmail(email: string): Promise<EmailSubscriber | undefined> {
    return Array.from(this.emailSubscribers.values()).find(
      subscriber => subscriber.email === email
    );
  }
  
  async saveSubscriber(insertSubscriber: InsertEmailSubscriber): Promise<EmailSubscriber> {
    const id = this.emailSubscriberCurrentId++;
    
    const subscriber: EmailSubscriber = {
      ...insertSubscriber,
      id,
      createdAt: new Date(),
      unsubscribed: false,
      lastEmailSent: null
    };
    
    this.emailSubscribers.set(id, subscriber);
    return subscriber;
  }
  
  async updateSubscriber(id: number, updates: Partial<InsertEmailSubscriber>): Promise<EmailSubscriber | undefined> {
    const subscriber = this.emailSubscribers.get(id);
    
    if (!subscriber) {
      return undefined;
    }
    
    const updatedSubscriber: EmailSubscriber = {
      ...subscriber,
      ...updates
    };
    
    this.emailSubscribers.set(id, updatedSubscriber);
    return updatedSubscriber;
  }
  
  async unsubscribeByEmail(email: string): Promise<boolean> {
    const subscriber = await this.getSubscriberByEmail(email);
    
    if (!subscriber) {
      return false;
    }
    
    const updatedSubscriber: EmailSubscriber = {
      ...subscriber,
      unsubscribed: true
    };
    
    this.emailSubscribers.set(subscriber.id, updatedSubscriber);
    return true;
  }
  
  // Lead magnet methods
  async getAllLeadMagnets(): Promise<LeadMagnet[]> {
    return Array.from(this.leadMagnets.values());
  }
  
  async getLeadMagnetById(id: number): Promise<LeadMagnet | undefined> {
    return this.leadMagnets.get(id);
  }
  
  async saveLeadMagnet(insertLeadMagnet: InsertLeadMagnet): Promise<LeadMagnet> {
    const id = this.leadMagnetCurrentId++;
    
    const leadMagnet: LeadMagnet = {
      ...insertLeadMagnet,
      id,
      downloadCount: 0,
      createdAt: new Date(),
      updatedAt: null
    };
    
    this.leadMagnets.set(id, leadMagnet);
    return leadMagnet;
  }
  
  async updateLeadMagnet(id: number, updates: Partial<InsertLeadMagnet>): Promise<LeadMagnet | undefined> {
    const leadMagnet = this.leadMagnets.get(id);
    
    if (!leadMagnet) {
      return undefined;
    }
    
    const updatedLeadMagnet: LeadMagnet = {
      ...leadMagnet,
      ...updates,
      updatedAt: new Date()
    };
    
    this.leadMagnets.set(id, updatedLeadMagnet);
    return updatedLeadMagnet;
  }
  
  async deleteLeadMagnet(id: number): Promise<boolean> {
    if (!this.leadMagnets.has(id)) {
      return false;
    }
    
    this.leadMagnets.delete(id);
    return true;
  }
  
  async recordLeadMagnetDownload(id: number): Promise<void> {
    const leadMagnet = this.leadMagnets.get(id);
    
    if (leadMagnet) {
      leadMagnet.downloadCount++;
      this.leadMagnets.set(id, leadMagnet);
    }
  }
  
  // Email sequence methods
  async getAllEmailSequences(): Promise<EmailSequence[]> {
    return Array.from(this.emailSequences.values());
  }
  
  async getEmailSequenceById(id: number): Promise<EmailSequence | undefined> {
    return this.emailSequences.get(id);
  }
  
  async getDefaultEmailSequence(): Promise<EmailSequence | undefined> {
    return Array.from(this.emailSequences.values()).find(
      sequence => sequence.isDefault === true
    );
  }
  
  async saveEmailSequence(insertSequence: InsertEmailSequence): Promise<EmailSequence> {
    const id = this.emailSequenceCurrentId++;
    
    // Create a complete sequence record
    const sequence: EmailSequence = {
      ...insertSequence,
      id,
      createdAt: new Date(),
      updatedAt: null,
      // Set default values for optional fields if not provided
      isActive: insertSequence.isActive ?? true,
      isDefault: insertSequence.isDefault ?? false,
      subscribersCount: 0
    };
    
    this.emailSequences.set(id, sequence);
    return sequence;
  }
  
  async updateEmailSequence(id: number, updates: Partial<InsertEmailSequence>): Promise<EmailSequence | undefined> {
    const sequence = this.emailSequences.get(id);
    
    if (!sequence) {
      return undefined;
    }
    
    // Update the sequence with new values
    const updatedSequence: EmailSequence = {
      ...sequence,
      ...updates,
      updatedAt: new Date()
    };
    
    this.emailSequences.set(id, updatedSequence);
    return updatedSequence;
  }
  
  async deleteEmailSequence(id: number): Promise<boolean> {
    if (!this.emailSequences.has(id)) {
      return false;
    }
    
    // Don't allow deleting default sequence
    const sequence = this.emailSequences.get(id);
    if (sequence && sequence.isDefault) {
      return false;
    }
    
    // Delete related templates
    const templatesForSequence = Array.from(this.emailTemplates.entries())
      .filter(([_, template]) => template.sequenceId === id);
      
    for (const [templateId, _] of templatesForSequence) {
      this.emailTemplates.delete(templateId);
    }
    
    this.emailSequences.delete(id);
    return true;
  }
  
  // Email template methods
  async getAllEmailTemplates(): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values());
  }
  
  async getEmailTemplateById(id: number): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }
  
  async getEmailTemplatesBySequenceId(sequenceId: number): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values())
      .filter(template => template.sequenceId === sequenceId)
      .sort((a, b) => a.delayDays - b.delayDays);
  }
  
  async saveEmailTemplate(insertTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const id = this.emailTemplateCurrentId++;
    
    // Create a complete template record
    const template: EmailTemplate = {
      ...insertTemplate,
      id,
      createdAt: new Date(),
      updatedAt: null,
      // Set default values for optional fields if not provided
      emailType: insertTemplate.emailType || 'standard',
      delayDays: insertTemplate.delayDays || 0,
      attachLeadMagnet: insertTemplate.attachLeadMagnet || false,
      leadMagnetPath: insertTemplate.leadMagnetPath || null,
      isActive: true
    };
    
    this.emailTemplates.set(id, template);
    return template;
  }
  
  async updateEmailTemplate(id: number, updates: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const template = this.emailTemplates.get(id);
    
    if (!template) {
      return undefined;
    }
    
    const updatedTemplate: EmailTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date()
    };
    
    this.emailTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }
  
  async deleteEmailTemplate(id: number): Promise<boolean> {
    if (!this.emailTemplates.has(id)) {
      return false;
    }
    
    this.emailTemplates.delete(id);
    return true;
  }
  
  async toggleEmailTemplateStatus(id: number, isActive: boolean): Promise<boolean> {
    const template = this.emailTemplates.get(id);
    
    if (!template) {
      return false;
    }
    
    const updatedTemplate: EmailTemplate = {
      ...template,
      isActive,
      updatedAt: new Date()
    };
    
    this.emailTemplates.set(id, updatedTemplate);
    return true;
  }
  
  // System settings methods
  async getAllSettings(): Promise<SystemSetting[]> {
    return Array.from(this.systemSettings.values());
  }
  
  async getSettingByKey(key: string): Promise<SystemSetting | undefined> {
    return this.systemSettings.get(key);
  }
  
  async saveSetting(insertSetting: InsertSystemSetting): Promise<SystemSetting> {
    const id = this.systemSettingCurrentId++;
    
    const setting: SystemSetting = {
      ...insertSetting,
      id,
      lastUpdated: new Date()
    };
    
    this.systemSettings.set(setting.settingKey, setting);
    return setting;
  }
  
  async updateSetting(key: string, value: string): Promise<SystemSetting | undefined> {
    const setting = this.systemSettings.get(key);
    
    if (!setting) {
      return undefined;
    }
    
    const updatedSetting: SystemSetting = {
      ...setting,
      settingValue: value,
      lastUpdated: new Date()
    };
    
    this.systemSettings.set(key, updatedSetting);
    return updatedSetting;
  }
  
  async deleteSetting(key: string): Promise<boolean> {
    if (!this.systemSettings.has(key)) {
      return false;
    }
    
    this.systemSettings.delete(key);
    return true;
  }
  
  // Dashboard overview
  async getDashboardOverview(): Promise<DashboardOverview> {
    // Quiz stats
    const quizResponses = Array.from(this.quizResponses.values());
    const totalQuizResponses = quizResponses.length;
    const quizCompletionRate = 0.85; // Default value for demo
    
    // Blog stats
    const blogPosts = Array.from(this.blogPosts.values());
    const totalBlogPosts = blogPosts.length;
    let totalBlogViews = 0;
    let quizClicks = 0;
    
    Array.from(this.blogAnalytics.values()).forEach(analytics => {
      totalBlogViews += analytics.totalViews;
      quizClicks += analytics.quizClicks;
    });
    
    const blogCTR = totalBlogViews > 0 ? (quizClicks / totalBlogViews) * 100 : 0;
    
    // Email stats
    const subscribers = Array.from(this.emailSubscribers.values());
    const totalSubscribers = subscribers.length;
    const activeSubscribers = subscribers.filter(s => !s.unsubscribed).length;
    
    // Lead magnet stats
    const leadMagnets = Array.from(this.leadMagnets.values());
    const totalLeadMagnets = leadMagnets.length;
    let leadMagnetDownloads = 0;
    
    leadMagnets.forEach(lm => {
      leadMagnetDownloads += lm.downloadCount;
    });
    
    // Affiliate stats (for demo purposes)
    const totalAffiliateClicks = Math.floor(Math.random() * 1000) + 500;
    
    // Trending data - create sample data for last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });
    
    const quizResponsesTrend = last7Days.map(date => {
      // Count responses for each day
      const count = quizResponses.filter(r => 
        r.createdAt.toISOString().split('T')[0] === date
      ).length;
      
      return { date, count };
    });
    
    const subscribersTrend = last7Days.map(date => {
      // Count subscribers for each day
      const count = subscribers.filter(s => 
        s.createdAt.toISOString().split('T')[0] === date
      ).length;
      
      return { date, count };
    });
    
    const blogViewsTrend = last7Days.map(date => {
      // Count blog views for each day
      let count = 0;
      
      Array.from(this.blogAnalytics.values()).forEach(analytics => {
        if (analytics.viewDate.toISOString().split('T')[0] === date) {
          count += analytics.totalViews;
        }
      });
      
      return { date, count };
    });
    
    // Calculate stats for last 7 days
    const newQuizResponsesLast7Days = quizResponsesTrend.reduce((sum, day) => sum + day.count, 0);
    const newSubscribersLast7Days = subscribersTrend.reduce((sum, day) => sum + day.count, 0);
    const blogViewsLast7Days = blogViewsTrend.reduce((sum, day) => sum + day.count, 0);
    
    // For demo purposes
    const leadMagnetDownloadsLast7Days = Math.floor(leadMagnetDownloads * 0.3);
    
    return {
      totalQuizResponses,
      quizCompletionRate,
      totalBlogPosts,
      totalBlogViews,
      blogCTR,
      totalSubscribers,
      activeSubscribers,
      totalLeadMagnets,
      leadMagnetDownloads,
      totalAffiliateClicks,
      quizResponsesTrend,
      subscribersTrend,
      blogViewsTrend,
      newQuizResponsesLast7Days,
      newSubscribersLast7Days,
      blogViewsLast7Days,
      leadMagnetDownloadsLast7Days
    };
  }
  
  // Helper method to initialize sample subscribers
  private async initializeKeywords(): Promise<void> {
    const defaultKeywords = [
      'trigger his hero instinct',
      'make him obsessed with you',
      'create emotional intimacy',
      'make him want you more',
      'signs he is attracted to you',
      'how to understand men',
      'build lasting relationship',
      'overcome relationship anxiety',
      'effective communication',
      'signs he loves you',
      'how to get him back',
      'make him commit',
      'tell if he\'s lying',
      'make him miss you',
      'relationship red flags'
    ];
    
    defaultKeywords.forEach(keyword => this.keywords.add(keyword));
  }
  
  private async initializeSubscribers(): Promise<void> {
    const sampleSubscribers = [
      { firstName: 'Sarah', email: 'sarah@example.com', source: 'quiz' },
      { firstName: 'Jennifer', email: 'jennifer@example.com', source: 'blog-sidebar' },
      { firstName: 'Emma', email: 'emma@example.com', source: 'quiz' },
      { firstName: 'Lisa', email: 'lisa@example.com', source: 'homepage' },
      { firstName: 'Jessica', email: 'jessica@example.com', source: 'quiz' },
      { firstName: 'Ashley', email: 'ashley@example.com', source: 'blog-post' },
      { firstName: 'Michelle', email: 'michelle@example.com', source: 'quiz' },
      { firstName: 'Amanda', email: 'amanda@example.com', source: 'blog-sidebar' }
    ];
    
    for (const subscriber of sampleSubscribers) {
      const id = this.emailSubscriberCurrentId++;
      const createDate = new Date();
      createDate.setDate(createDate.getDate() - Math.floor(Math.random() * 30)); // Random date in the last 30 days
      
      const emailSubscriber: EmailSubscriber = {
        id,
        firstName: subscriber.firstName,
        email: subscriber.email,
        source: subscriber.source,
        createdAt: createDate,
        unsubscribed: false,
        lastEmailSent: null
      };
      
      this.emailSubscribers.set(id, emailSubscriber);
    }
  }
  
  private async initializeLeadMagnets(): Promise<void> {
    const sampleLeadMagnets = [
      { 
        name: 'Ultimate Relationship Guide', 
        description: 'A comprehensive guide to understanding men and building a lasting relationship', 
        filePath: '/lead-magnets/ultimate-relationship-guide.pdf',
        downloadCount: 248
      },
      { 
        name: 'Communication Secrets', 
        description: 'Learn the secret language that makes him fall deeply in love', 
        filePath: '/lead-magnets/communication-secrets.pdf',
        downloadCount: 175
      },
      { 
        name: 'Attraction Triggers', 
        description: 'Discover the psychological triggers that create immediate attraction', 
        filePath: '/lead-magnets/attraction-triggers.pdf',
        downloadCount: 312
      }
    ];
    
    for (const magnet of sampleLeadMagnets) {
      const id = this.leadMagnetCurrentId++;
      const createDate = new Date();
      createDate.setDate(createDate.getDate() - Math.floor(Math.random() * 60)); // Random date in the last 60 days
      
      const leadMagnet: LeadMagnet = {
        id,
        name: magnet.name,
        description: magnet.description,
        filePath: magnet.filePath,
        downloadCount: magnet.downloadCount,
        createdAt: createDate,
        updatedAt: null
      };
      
      this.leadMagnets.set(id, leadMagnet);
    }
  }
  
  // Helper method to initialize email sequences and templates
  private async initializeEmailSequences(): Promise<void> {
    // Create default welcome sequence if no sequences exist
    if (this.emailSequences.size === 0) {
      // Create default welcome sequence
      const welcomeSequence: EmailSequence = {
        id: this.emailSequenceCurrentId++,
        name: 'Welcome Sequence',
        description: 'Default welcome sequence for new subscribers',
        isDefault: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: null,
        subscribersCount: 0
      };
      
      this.emailSequences.set(welcomeSequence.id, welcomeSequence);
      
      // Create a few email templates for the welcome sequence
      const welcomeEmail: EmailTemplate = {
        id: this.emailTemplateCurrentId++,
        name: 'Welcome Email',
        subject: 'Welcome to Obsession Trigger!',
        content: `<p>Dear {{firstName}},</p>
<p>Welcome to Obsession Trigger! We're excited to have you join our community.</p>
<p>Over the next few days, you'll receive a series of emails with valuable relationship advice and insights that can help transform your love life.</p>
<p>If you have any questions, feel free to reply to this email.</p>
<p>Warm regards,<br>The Obsession Trigger Team</p>`,
        sequenceId: welcomeSequence.id,
        emailType: 'welcome',
        delayDays: 0,
        createdAt: new Date(),
        updatedAt: null,
        attachLeadMagnet: false,
        leadMagnetPath: null,
        isActive: true
      };
      
      this.emailTemplates.set(welcomeEmail.id, welcomeEmail);
      
      const heroInstinctGuide: EmailTemplate = {
        id: this.emailTemplateCurrentId++,
        name: 'Hero Instinct Guide',
        subject: 'Understanding His Hero Instinct [GUIDE]',
        content: `<p>Dear {{firstName}},</p>
<p>Today I wanted to share something powerful with you - understanding the hero instinct in men.</p>
<p>The hero instinct is a biological drive that all men have. It's a desire to feel needed, to feel important, and to provide for those he cares about.</p>
<p>When you know how to trigger this instinct, you can create a deep, passionate connection with any man.</p>
<p>Here are three simple ways to activate his hero instinct:</p>
<ol>
  <li>Ask for his help on something specific</li>
  <li>Express your appreciation when he does something for you</li>
  <li>Support his goals and ambitions</li>
</ol>
<p>Try these techniques and see how he responds - you might be surprised at the results!</p>
<p>Warm regards,<br>The Obsession Trigger Team</p>`,
        sequenceId: welcomeSequence.id,
        emailType: 'content',
        delayDays: 2,
        createdAt: new Date(),
        updatedAt: null,
        attachLeadMagnet: false,
        leadMagnetPath: null,
        isActive: true
      };
      
      this.emailTemplates.set(heroInstinctGuide.id, heroInstinctGuide);
      
      const communicationTips: EmailTemplate = {
        id: this.emailTemplateCurrentId++,
        name: 'Communication Tips',
        subject: 'The Secret to Better Communication With Him',
        content: `<p>Hi {{firstName}},</p>
<p>Communication is the foundation of any healthy relationship, but men and women often communicate differently.</p>
<p>Understanding these differences can help you connect more deeply with your partner and avoid unnecessary conflicts.</p>
<p>Here are some key insights about male communication patterns:</p>
<ul>
  <li>Men tend to be more direct and solution-focused</li>
  <li>Men often need time to process emotional information</li>
  <li>Men sometimes express emotions through actions rather than words</li>
</ul>
<p>When you adapt your communication style to accommodate these differences, you'll find that your conversations become more productive and your connection grows stronger.</p>
<p>In our next email, I'll share some practical techniques for creating emotional intimacy with your partner.</p>
<p>Until then,<br>The Obsession Trigger Team</p>`,
        sequenceId: welcomeSequence.id,
        emailType: 'content',
        delayDays: 4,
        createdAt: new Date(),
        updatedAt: null,
        attachLeadMagnet: false,
        leadMagnetPath: null,
        isActive: true
      };
      
      this.emailTemplates.set(communicationTips.id, communicationTips);
      
      console.log('Default email sequence created with 3 templates');
    }
  }
  
  private async initializeSystemSettings(): Promise<void> {
    const defaultSettings = [
      { key: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY || '', type: 'string', description: 'API key for OpenAI integration' },
      { key: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY || '', type: 'string', description: 'API key for Google Gemini integration' },
      { key: 'PEXELS_API_KEY', value: process.env.PEXELS_API_KEY || '', type: 'string', description: 'API key for Pexels image integration' },
      { key: 'BLOG_AUTO_SCHEDULE', value: 'true', type: 'boolean', description: 'Automatically schedule blog posts' },
      { key: 'EMAIL_SERVICE', value: 'sendgrid', type: 'string', description: 'Primary email service provider' },
      { key: 'EMAIL_FROM', value: 'info@obsessiontrigger.com', type: 'string', description: 'Default from email address' },
      { key: 'EMAIL_FROM_NAME', value: 'Obsession Trigger Team', type: 'string', description: 'Default from name for emails' },
      { key: 'EMAIL_REPLY_TO', value: 'support@obsessiontrigger.com', type: 'string', description: 'Default reply-to email address' },
      { key: 'SENDGRID_API_KEY', value: process.env.SENDGRID_API_KEY || '', type: 'string', description: 'API key for SendGrid integration' },
      { key: 'MAILERLITE_API_KEY', value: process.env.MAILERLITE_API_KEY || '', type: 'string', description: 'API key for MailerLite integration' },
      { key: 'BREVO_API_KEY', value: process.env.BREVO_API_KEY || '', type: 'string', description: 'API key for Brevo integration' },
      { key: 'DEFAULT_LEAD_MAGNET', value: '1', type: 'number', description: 'Default lead magnet ID for new subscribers' },
      { key: 'QUIZ_LEAD_MAGNET', value: '1', type: 'number', description: 'Lead magnet ID for quiz completions' },
      { key: 'BLOG_LEAD_MAGNET', value: '2', type: 'number', description: 'Lead magnet ID for blog opt-ins' },
      { key: 'AFFILIATE_LINK_PREFIX', value: 'https://affiliate.example.com/', type: 'string', description: 'Prefix for affiliate links' },
      { key: 'POSTS_PER_PAGE', value: '10', type: 'number', description: 'Number of posts to display per page' }
    ];
    
    for (const setting of defaultSettings) {
      const id = this.systemSettingCurrentId++;
      
      const systemSetting: SystemSetting = {
        id,
        settingKey: setting.key,
        settingValue: setting.value,
        settingType: setting.type,
        lastUpdated: new Date(),
        description: setting.description
      };
      
      this.systemSettings.set(setting.key, systemSetting);
    }
  }
}

export const storage = new MemStorage();
