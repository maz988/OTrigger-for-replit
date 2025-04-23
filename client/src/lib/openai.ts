import type { QuizFormData } from "@shared/schema";
import { apiRequest } from "./queryClient";

export const generateAdvice = async (quizData: QuizFormData): Promise<string> => {
  try {
    // For demo purposes, return a mock response immediately
    return `
## Your Personalized Obsession Trigger Plan

Based on your answers, here's your personalized relationship advice:

### Understanding His Hot and Cold Behavior

The inconsistent behavior you're experiencing is actually quite common. When a man is "hot and cold," it often indicates he's experiencing internal conflict. He's interested in you, but something is holding him back from fully committing.

### How to Respond Effectively

Since you tend to communicate emotionally, try these strategies:

1. **Create Space**: When he pulls away, resist the urge to chase him. This often creates the "rubber band effect" where he'll naturally come back stronger.

2. **Focus on Your Value**: Continue developing your own interests and social life. Men are naturally attracted to women who have their own fulfilling lives.

3. **Use the Attraction Trigger**: When he reaches out after being distant, be warm but not overly available. Respond positively but don't clear your schedule for him.

4. **Communicate Clearly**: Express your needs calmly without accusation. For example: "I enjoy our time together and would like more consistency. What are your thoughts?"

### Next Steps

Apply these techniques for the next 2-3 weeks, and you'll likely notice a shift in his behavior pattern. Remember that a man who truly values you will work to keep you in his life.

Remember: You deserve someone who recognizes your worth consistently, not just when it's convenient for them.
    `;
    
    // The original implementation for when the backend API is ready:
    /*
    const response = await apiRequest(
      "POST", 
      "/api/generate-advice", 
      quizData
    );
    
    const data = await response.json();
    return data.advice;
    */
  } catch (error) {
    console.error("Error generating advice:", error);
    throw new Error("Failed to generate personalized advice. Please try again.");
  }
};
