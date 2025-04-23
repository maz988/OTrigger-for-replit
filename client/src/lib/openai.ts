import type { QuizFormData } from "@shared/schema";
import { apiRequest } from "./queryClient";

export const generateAdvice = async (quizData: QuizFormData): Promise<string> => {
  try {
    const response = await apiRequest(
      "POST", 
      "/api/generate-advice", 
      quizData
    );
    
    const data = await response.json();
    return data.advice;
  } catch (error) {
    console.error("Error generating advice:", error);
    throw new Error("Failed to generate personalized advice. Please try again.");
  }
};
