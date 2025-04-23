import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
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

export type QuizFormData = z.infer<typeof quizFormSchema>;
export type EmailFormData = z.infer<typeof emailFormSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type QuizResponse = typeof quizResponses.$inferSelect;
export type InsertQuizResponse = z.infer<typeof insertQuizResponseSchema>;
