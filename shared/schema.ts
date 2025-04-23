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
