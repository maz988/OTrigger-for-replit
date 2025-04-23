import OpenAI from 'openai';

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

/**
 * Email types for the follow-up sequence
 */
export enum EmailType {
  WELCOME = 'welcome',
  PSYCHOLOGY_TIP = 'psychology-tip',
  PRACTICAL_TIP = 'practical-tip',
  SOFT_PROMO = 'soft-promo',
  EMOTIONAL_STORY = 'emotional-story'
}

/**
 * Email template parameters
 */
interface EmailTemplateParams {
  firstName?: string;
  leadMagnetName?: string;
  quizUrl?: string;
  affiliateUrl?: string;
}

/**
 * Generated email content
 */
interface EmailContent {
  subject: string;
  body: string;
}

/**
 * Default affiliate URL
 */
const DEFAULT_AFFILIATE_URL = 'https://obsessiontrigger.com/recommend/his-secret-obsession';

/**
 * Default quiz URL
 */
const DEFAULT_QUIZ_URL = 'https://obsessiontrigger.com/quiz';

/**
 * Generate an email template based on the type
 */
export async function generateEmailTemplate(
  type: EmailType,
  params: EmailTemplateParams = {}
): Promise<EmailContent> {
  const { 
    firstName = 'there', 
    leadMagnetName = 'Love Guide',
    quizUrl = DEFAULT_QUIZ_URL,
    affiliateUrl = DEFAULT_AFFILIATE_URL
  } = params;
  
  // Prepare the right prompt based on email type
  const prompt = getPromptForEmailType(type, { firstName, leadMagnetName, quizUrl, affiliateUrl });
  
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert relationship advisor specializing in women's relationship advice. 
          Write emails that are warm, empathetic, and intelligent. The tone should be conversational, 
          like a wise friend giving advice. Avoid clichés, cheesy language, or manipulative tactics. 
          Use psychology-based insights about male behavior and emotional needs, but ensure the advice 
          is ethical and focused on healthy relationship dynamics.`
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    
    const content = JSON.parse(response.choices[0].message.content);
    return {
      subject: content.subject,
      body: content.body
    };
  } catch (error) {
    console.error('Error generating email template:', error);
    
    // Fallback to pre-written templates if OpenAI fails
    return getFallbackEmailTemplate(type, { firstName, leadMagnetName, quizUrl, affiliateUrl });
  }
}

/**
 * Get the appropriate prompt for each email type
 */
function getPromptForEmailType(
  type: EmailType, 
  params: Required<EmailTemplateParams>
): string {
  const { firstName, leadMagnetName, quizUrl, affiliateUrl } = params;
  
  switch (type) {
    case EmailType.WELCOME:
      return `Create a warm welcome email for a woman named ${firstName} who just signed up for our "${leadMagnetName}". 
      This is the first email in our relationship advice sequence, so make it friendly and valuable.
      Include one practical tip about understanding male psychology that she can use right away.
      Do NOT include any links or calls to action - this is purely a welcome and value email.
      Respond in JSON format with "subject" and "body" fields.`;
      
    case EmailType.PSYCHOLOGY_TIP:
      return `Write the second email in our relationship advice sequence for ${firstName}.
      Focus on male emotional needs and psychology - specifically explain the "hero instinct" concept.
      Explain how men have a biological drive to feel needed, respected, and essential in their relationships.
      Include 2-3 practical ways a woman can trigger this instinct in her partner.
      Make the advice insightful but simple to implement.
      Respond in JSON format with "subject" and "body" fields.`;
      
    case EmailType.PRACTICAL_TIP:
      return `Create the third email in our relationship advice sequence for ${firstName}.
      Focus on practical communication techniques that can transform relationship dynamics.
      Include specific examples of phrases or questions that can open up emotional connections.
      At the end, invite her to take our relationship quiz at ${quizUrl} to get personalized advice.
      Make this feel helpful rather than promotional.
      Respond in JSON format with "subject" and "body" fields.`;
      
    case EmailType.SOFT_PROMO:
      return `Write the fourth email in our relationship advice sequence for ${firstName}.
      This email should focus on deeper relationship challenges and introduce the concept that understanding male psychology is essential for relationship success.
      Share a brief success story of how one woman transformed her relationship by understanding her partner's emotional needs.
      Then introduce "His Secret Obsession" as a resource that has helped many women, and include a link to learn more: ${affiliateUrl}
      Keep the tone helpful rather than pushy - this is a soft promotion.
      Respond in JSON format with "subject" and "body" fields.`;
      
    case EmailType.EMOTIONAL_STORY:
      return `Create the fifth email in our relationship advice sequence for ${firstName}.
      Tell an emotional story about a couple who overcame a relationship challenge through better understanding and communication.
      Make the story relatable and emotionally resonant for women who are trying to improve their relationships.
      The story should illustrate how understanding male psychology helped resolve the issue.
      At the end, share a brief insight gained from the story, but keep this email focused on storytelling rather than promotion.
      Optionally include a very soft mention of ${affiliateUrl} for those who want to learn more.
      Respond in JSON format with "subject" and "body" fields.`;
      
    default:
      return `Write a helpful relationship advice email for ${firstName} who received our "${leadMagnetName}".
      Include practical tips she can apply today.
      Respond in JSON format with "subject" and "body" fields.`;
  }
}

/**
 * Get fallback email templates in case the API fails
 */
function getFallbackEmailTemplate(
  type: EmailType,
  params: Required<EmailTemplateParams>
): EmailContent {
  const { firstName, leadMagnetName, quizUrl, affiliateUrl } = params;
  
  // Basic fallback templates for each email type
  switch (type) {
    case EmailType.WELCOME:
      return {
        subject: `Welcome to your ${leadMagnetName}, ${firstName}!`,
        body: `Hi ${firstName},

Thank you for downloading the ${leadMagnetName}! I'm so excited to share these relationship insights with you.

As promised, you'll find practical advice that you can start applying right away. One quick tip I want to share today is about appreciation. Men respond powerfully to genuine appreciation - it's hardwired into their psychology. When you specifically acknowledge something he's done (even something small), it creates a positive emotional response that strengthens your connection.

Over the next few days, I'll be sending you more valuable insights about male psychology and practical relationship advice.

Warmly,
Your Relationship Coach
`
      };
      
    case EmailType.PSYCHOLOGY_TIP:
      return {
        subject: `The "Hero Instinct" - What Every Woman Should Know`,
        body: `Hi ${firstName},

I want to share something powerful with you today - it's called the "Hero Instinct."

This concept explains why men behave the way they do in relationships. At his core, a man has a biological drive to feel needed, respected, and essential in his relationship. When this instinct is triggered, he becomes more attentive, loving, and committed.

Here are three simple ways to activate this instinct:

1. Ask for his help with something specific (even if you could do it yourself)
2. Acknowledge when he solves a problem or provides support
3. Express your appreciation for his unique qualities (be specific about what you admire)

These small actions tap into his natural desire to be your hero and can dramatically shift your relationship dynamics.

Warmly,
Your Relationship Coach
`
      };
      
    case EmailType.PRACTICAL_TIP:
      return {
        subject: `3 Communication Phrases That Transform Relationships`,
        body: `Hi ${firstName},

The way we communicate can completely transform our relationships. Today, I want to share three powerful phrases that can open up emotional connections with your partner.

1. "I feel appreciated when you..." - This phrase communicates your needs without criticism.

2. "I'm curious about..." - This opens conversations without defensiveness.

3. "I understand that you..." - This validates his perspective before sharing yours.

These phrases create safety in your communication and help him open up emotionally.

If you'd like personalized relationship advice, I've created a quick quiz that will help identify your specific relationship dynamics and provide customized strategies.

Take the quiz here: ${quizUrl}

Warmly,
Your Relationship Coach
`
      };
      
    case EmailType.SOFT_PROMO:
      return {
        subject: `Sarah's Relationship Transformation Story`,
        body: `Hi ${firstName},

I want to share a quick story about Sarah, who was struggling in her relationship. Her boyfriend of three years was becoming distant and unresponsive, despite her best efforts to connect.

Sarah discovered that she was unintentionally pushing him away by not understanding his emotional needs as a man. Once she learned about male psychology and what truly drives men in relationships, everything changed.

Within weeks, her boyfriend was texting her more, planning dates, and showing affection like he used to at the beginning of their relationship. The key was understanding what I call the "obsession triggers" - specific emotional buttons that activate deep attraction and commitment.

If you'd like to discover these triggers for yourself, I recommend checking out "His Secret Obsession" - it's the most comprehensive guide I've found on male psychology in relationships.

Learn more here: ${affiliateUrl}

Warmly,
Your Relationship Coach
`
      };
      
    case EmailType.EMOTIONAL_STORY:
      return {
        subject: `The Misunderstood Text Message (A Love Story)`,
        body: `Hi ${firstName},

I want to share a story that might resonate with you...

Emma and Jason had been together for two years when communication began breaking down. One evening, Emma texted Jason asking when he'd be home from work. His reply was brief: "Later."

Frustrated by his shortness, Emma responded with "Fine" and stopped texting. When Jason arrived home, the tension was palpable. Emma felt ignored, while Jason felt attacked.

During a conversation with a friend, Emma learned about how differently men and women communicate. Men often focus on solving problems and providing information, while women value connection in communication.

The next day, Emma approached Jason differently. "I missed you yesterday and was looking forward to seeing you. When do you think you'll be home today?"

Jason's response changed completely: "Should be done by 6. Had a rough day yesterday. Looking forward to seeing you too."

This small shift in approach - focusing on connection rather than just information - transformed their communication.

The insight here is simple but powerful: Understanding the differences in how men and women communicate can prevent misunderstandings and deepen your connection.

Warmly,
Your Relationship Coach

P.S. If you're interested in more insights like this, you might find this resource helpful: ${affiliateUrl}
`
      };
      
    default:
      return {
        subject: `Your ${leadMagnetName} - Relationship Tips for Success`,
        body: `Hi ${firstName},

I hope you're enjoying the ${leadMagnetName} you downloaded. I wanted to share some additional tips to help strengthen your relationship.

Remember that building a great relationship takes time and understanding. The most important thing is to approach your partner with empathy and openness.

Wishing you all the best,
Your Relationship Coach
`
      };
  }
}