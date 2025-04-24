import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const quizResponses = pgTable("quiz_responses", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  email: text("email").notNull(),
  relationshipStatus: text("relationship_status").notNull(),
  concernType: text("concern_type").notNull(),
  confusingBehavior: text("confusing_behavior").notNull(),
  communicationStyle: text("communication_style").notNull(),
  desiredOutcome: text("desired_outcome").notNull(),
  aiResponse: text("ai_response"),
  // Referral tracking fields
  referralSource: text("referral_source").notNull().default('direct'),
  referralCampaign: text("referral_campaign").notNull().default('none'),
  referralKeyword: text("referral_keyword").notNull().default('none'),
  referralContent: text("referral_content").notNull().default('none'),
  blogPost: text("blog_post").notNull().default('none'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Blog post analytics tracking
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  keyword: text("keyword").notNull(),
  category: text("category").notNull().default('Relationships'),
  content: text("content").notNull(),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Track views and interactions with blog posts
export const blogPostAnalytics = pgTable("blog_post_analytics", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  viewDate: timestamp("view_date").notNull(),
  uniqueViews: integer("unique_views").notNull().default(0),
  totalViews: integer("total_views").notNull().default(0),
  quizClicks: integer("quiz_clicks").notNull().default(0),
  referrers: jsonb("referrers").notNull().default({})
});

// Admin users with access to dashboard
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("editor"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Email subscribers table
export const emailSubscribers = pgTable("email_subscribers", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default('unknown'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  unsubscribed: boolean("unsubscribed").notNull().default(false),
  lastEmailSent: timestamp("last_email_sent"),
});

// Lead magnets (downloadable content)
export const leadMagnets = pgTable("lead_magnets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  filePath: text("file_path").notNull(),
  downloadCount: integer("download_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// Email templates for automated emails
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

// System settings (API keys, integration settings, etc.)
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value"),
  settingType: text("setting_type").notNull().default('string'), // string, json, boolean, etc.
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  description: text("description"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertQuizResponseSchema = createInsertSchema(quizResponses).omit({
  id: true,
  aiResponse: true,
  createdAt: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  publishedAt: true,
  updatedAt: true,
});

export const insertBlogPostAnalyticsSchema = createInsertSchema(blogPostAnalytics).omit({
  id: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  lastLogin: true,
  createdAt: true,
});

export const insertEmailSubscriberSchema = createInsertSchema(emailSubscribers).omit({
  id: true,
  createdAt: true,
  lastEmailSent: true,
});

export const insertLeadMagnetSchema = createInsertSchema(leadMagnets).omit({
  id: true,
  downloadCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  lastUpdated: true,
});

export const quizFormSchema = z.object({
  relationshipStatus: z.string().min(1, { message: "Please select your relationship status" }),
  concernType: z.string().min(1, { message: "Please select your biggest concern" }),
  confusingBehavior: z.string().min(5, { message: "Please describe the confusing behavior" }),
  communicationStyle: z.string().min(1, { message: "Please select your communication style" }),
  desiredOutcome: z.string().min(1, { message: "Please select your desired outcome" }),
});

export const emailFormSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  email: z.string().email({ message: "Please enter a valid email" }),
});

export const adminLoginSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters"}),
  password: z.string().min(6, { message: "Password must be at least 6 characters"}),
});

export type QuizFormData = z.infer<typeof quizFormSchema>;
export type EmailFormData = z.infer<typeof emailFormSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type QuizResponse = typeof quizResponses.$inferSelect;
export type InsertQuizResponse = z.infer<typeof insertQuizResponseSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPostAnalytics = typeof blogPostAnalytics.$inferSelect;
export type InsertBlogPostAnalytics = z.infer<typeof insertBlogPostAnalyticsSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type EmailSubscriber = typeof emailSubscribers.$inferSelect;
export type InsertEmailSubscriber = z.infer<typeof insertEmailSubscriberSchema>;
export type LeadMagnet = typeof leadMagnets.$inferSelect;
export type InsertLeadMagnet = z.infer<typeof insertLeadMagnetSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
