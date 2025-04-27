import type { QuizFormData } from "@shared/schema";
import { apiRequest } from "./queryClient";

// Track the latest quiz response ID for email collection
let lastQuizResponseId: number | null = null;

export const getLastQuizResponseId = (): number | null => {
  return lastQuizResponseId;
};

export const generateAdvice = async (quizData: QuizFormData): Promise<string> => {
  try {
    // Call our backend API endpoint for personalized advice with affiliate links
    const response = await fetch('/api/quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quizData),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to generate advice");
    }
    
    // Store the quiz response ID for later use when the user submits their email
    lastQuizResponseId = data.data.quizResponseId;
    
    // Return the advice with affiliate links already embedded
    return data.data.advice;
  } catch (error) {
    console.error("Error generating advice:", error);
    
    // As a fallback, if the API fails, return a static response with affiliate links
    const affiliateLink = "https://hop.clickbank.net/?affiliate=otrigger&vendor=hissecret&lp=0&tid=quiz";
    
    return `
## Your Personalized Obsession Trigger Plan

Based on your answers, here's your personalized relationship advice:

### Understanding His Behavior

The inconsistent behavior you're experiencing is actually quite common. When a man is hot and cold, it often indicates he's experiencing internal conflict. He's interested in you, but something is holding him back from fully committing.

### How to Respond Effectively

Try these proven strategies:

1. **Create Space**: When he pulls away, resist the urge to chase him. This often creates the "rubber band effect" where he'll naturally come back stronger.

2. **Focus on Your Value**: Continue developing your own interests and social life. Men are naturally attracted to women who have their own fulfilling lives.

3. **Use the Hero Instinct**: Activate his natural desire to feel needed and appreciated. When you make him feel like a hero (without being needy), he'll work harder to maintain your connection.

4. **Communicate Clearly**: Express your needs calmly without accusation. For example: "I enjoy our time together and would like more consistency. What are your thoughts?"

<div class="affiliate-callout p-4 my-6 border rounded-lg border-primary-200 bg-primary-50">
  <h4 class="font-medium text-primary-800 mb-2">Expert Recommendation</h4>
  <p class="text-sm">
    His Secret Obsession specializes in activating a man's 'Hero Instinct' - the psychological trigger that makes a man feel a deep biological drive to protect, provide for, and commit to the woman he loves. Learn more about this powerful relationship technique: <a href="${affiliateLink}" target="_blank" class="text-primary-600 hover:underline">His Secret Obsession</a>
  </p>
</div>

### Next Steps

Apply these techniques for the next 2-3 weeks, and you'll likely notice a shift in his behavior pattern. Remember that a man who truly values you will work to keep you in his life.

Remember: You deserve someone who recognizes your worth consistently, not just when it's convenient for them.
    `;
  }
};
