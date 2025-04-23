import { 
  users, 
  quizResponses, 
  type User, 
  type InsertUser,
  type QuizResponse,
  type InsertQuizResponse
} from "@shared/schema";

// Modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Quiz response methods
  saveQuizResponse(response: InsertQuizResponse): Promise<QuizResponse>;
  getQuizResponseByEmail(email: string): Promise<QuizResponse[] | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private quizResponses: Map<number, QuizResponse>;
  private userCurrentId: number;
  private quizResponseCurrentId: number;

  constructor() {
    this.users = new Map();
    this.quizResponses = new Map();
    this.userCurrentId = 1;
    this.quizResponseCurrentId = 1;
  }

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
  
  async saveQuizResponse(insertResponse: InsertQuizResponse): Promise<QuizResponse> {
    const id = this.quizResponseCurrentId++;
    const createdAt = new Date();
    const quizResponse: QuizResponse = { 
      ...insertResponse, 
      id, 
      aiResponse: null,
      createdAt
    };
    this.quizResponses.set(id, quizResponse);
    return quizResponse;
  }
  
  async getQuizResponseByEmail(email: string): Promise<QuizResponse[] | undefined> {
    return Array.from(this.quizResponses.values())
      .filter(response => response.email === email);
  }
}

export const storage = new MemStorage();
