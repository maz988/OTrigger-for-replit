import { storage } from '../storage';
import { EmailTemplate } from '@shared/schema';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Template Variables
 * Variables that can be replaced in email templates
 */
export interface TemplateVariables {
  firstName?: string;
  lastName?: string;
  email?: string;
  unsubscribeUrl?: string;
  productName?: string;
  blogLink?: string;
  affiliateLink?: string;
  [key: string]: string | undefined;
}

/**
 * Strip HTML from a string to create plain text
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Prepare email content by replacing template variables
 */
export async function prepareEmailContent(
  template: EmailTemplate,
  variables: TemplateVariables
): Promise<string> {
  let content = template.content;
  
  // Replace all variables in the template
  for (const [key, value] of Object.entries(variables)) {
    if (value) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    }
  }
  
  // Add default unsubscribe link if not present
  if (!content.includes('{{unsubscribeUrl}}') && variables.unsubscribeUrl) {
    content += `
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
        <p>If you no longer wish to receive these emails, you can <a href="${variables.unsubscribeUrl}">unsubscribe here</a>.</p>
      </div>
    `;
  }
  
  return content;
}

/**
 * Generate email content using AI
 */
export async function generateEmailContent(
  emailType: string,
  variables: TemplateVariables
): Promise<string> {
  try {
    // Determine which AI provider to use
    const settings = await storage.getSettingByKey('defaultAiProvider');
    const defaultProvider = settings?.value || 'both';
    
    // Get API keys
    const openaiApiKey = process.env.OPENAI_API_KEY || (await storage.getSettingByKey('openaiApiKey'))?.value;
    const geminiApiKey = process.env.GEMINI_API_KEY || (await storage.getSettingByKey('geminiApiKey'))?.value;
    
    // Generate content based on the available API keys and default provider
    if (defaultProvider === 'both' && openaiApiKey && geminiApiKey) {
      // Generate with OpenAI and enhance with Gemini
      const openaiContent = await generateWithOpenAI(emailType, variables, openaiApiKey);
      return await enhanceWithGemini(openaiContent, emailType, geminiApiKey);
    } else if ((defaultProvider === 'openai' || defaultProvider === 'both') && openaiApiKey) {
      // Generate with OpenAI only
      return await generateWithOpenAI(emailType, variables, openaiApiKey);
    } else if ((defaultProvider === 'gemini' || defaultProvider === 'both') && geminiApiKey) {
      // Generate with Gemini only
      return await generateWithGemini(emailType, variables, geminiApiKey);
    } else {
      // Fallback to default template
      return getDefaultTemplate(emailType, variables);
    }
  } catch (error) {
    console.error('Error generating email content:', error);
    return getDefaultTemplate(emailType, variables);
  }
}

/**
 * Generate email content with OpenAI
 */
async function generateWithOpenAI(
  emailType: string,
  variables: TemplateVariables,
  apiKey: string
): Promise<string> {
  try {
    const openai = new OpenAI({ apiKey });
    
    // Create prompt based on email type
    const prompt = createEmailPrompt(emailType, variables);
    
    // Generate content with OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert email copywriter specializing in relationship advice. 
          Create compelling, personalized email content that converts. 
          Always write in HTML format with proper formatting. 
          Always include personalization variables when provided (like first name). 
          Focus on building trust and providing value.
          Keep emails concise and mobile-friendly.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });
    
    // Return the generated content
    return response.choices[0].message.content || getDefaultTemplate(emailType, variables);
    
  } catch (error) {
    console.error('Error generating with OpenAI:', error);
    return getDefaultTemplate(emailType, variables);
  }
}

/**
 * Generate email content with Gemini
 */
async function generateWithGemini(
  emailType: string,
  variables: TemplateVariables,
  apiKey: string
): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Create prompt based on email type
    const prompt = createEmailPrompt(emailType, variables);
    
    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract HTML content if it's wrapped in backticks or code blocks
    let content = text;
    const htmlMatch = text.match(/```html\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/) || text.match(/<html[\s\S]*<\/html>/);
    
    if (htmlMatch && htmlMatch[1]) {
      content = htmlMatch[1];
    }
    
    return content || getDefaultTemplate(emailType, variables);
    
  } catch (error) {
    console.error('Error generating with Gemini:', error);
    return getDefaultTemplate(emailType, variables);
  }
}

/**
 * Enhance OpenAI content with Gemini insights
 */
async function enhanceWithGemini(
  openaiContent: string,
  emailType: string,
  apiKey: string
): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Create enhancement prompt
    const prompt = `
      I have the following email content generated for a ${emailType} email:
      
      ${openaiContent}
      
      Please enhance this email to make it more engaging and effective. Focus on:
      1. Improving emotional connection
      2. Making it more persuasive
      3. Adding any missing elements that would make it more effective
      4. Maintaining the same basic structure and HTML formatting
      5. Preserving all links and calls-to-action
      
      Respond with the enhanced HTML email only.
    `;
    
    // Generate enhancement with Gemini
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract HTML content if it's wrapped in backticks or code blocks
    let enhancedContent = text;
    const htmlMatch = text.match(/```html\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/) || text.match(/<html[\s\S]*<\/html>/);
    
    if (htmlMatch && htmlMatch[1]) {
      enhancedContent = htmlMatch[1];
    }
    
    return enhancedContent || openaiContent;
    
  } catch (error) {
    console.error('Error enhancing with Gemini:', error);
    return openaiContent; // Return original content if enhancement fails
  }
}

/**
 * Create email prompt based on email type
 */
function createEmailPrompt(
  emailType: string,
  variables: TemplateVariables
): string {
  const firstName = variables.firstName || 'valued subscriber';
  const affiliateLink = variables.affiliateLink || process.env.AFFILIATE_LINK || '#';
  const blogLink = variables.blogLink || '#';
  
  switch (emailType) {
    case 'welcome':
      return `
        Create a warm welcome email for someone who just downloaded a lead magnet about relationship advice.
        The person's first name is "${firstName}".
        This is the first email in the sequence, so focus on building trust and introducing your brand.
        Do not include any affiliate links in this first email.
        Include a brief introduction to what they'll learn in the coming emails.
        The email should be in HTML format with proper styling.
      `;
      
    case 'value':
      return `
        Create a value-providing email that shares emotional advice for relationships.
        The person's first name is "${firstName}".
        This is the second email in the sequence after they've downloaded a relationship advice lead magnet.
        Include a link to a blog post about relationship advice: ${blogLink}
        The email should provide genuine value and insights about emotional connection in relationships.
        The email should be in HTML format with proper styling.
      `;
      
    case 'hero_instinct':
      return `
        Create an educational email about the "Hero Instinct" concept in male psychology.
        The person's first name is "${firstName}".
        This is the third email in the sequence after they've downloaded a relationship advice lead magnet.
        Explain what the Hero Instinct is and why it's so powerful in relationships with men.
        Do not include any affiliate links yet - this email is purely educational.
        The email should be in HTML format with proper styling.
      `;
      
    case 'affiliate':
      return `
        Create a promotional email for "His Secret Obsession" relationship program.
        The person's first name is "${firstName}".
        This is the fourth email in a sequence after they've learned about the Hero Instinct concept.
        Introduce the "His Secret Obsession" program as the complete guide to understanding and triggering the Hero Instinct.
        Include a clear call-to-action with this affiliate link: ${affiliateLink}
        Focus on benefits and transformation, not just features.
        The email should be in HTML format with proper styling.
      `;
      
    case 'story':
      return `
        Create a storytelling email about a relationship transformation.
        The person's first name is "${firstName}".
        This is the fifth email in the sequence after they've been introduced to the "His Secret Obsession" program.
        Share a success story (can be fictional but realistic) about how understanding the Hero Instinct transformed a failing relationship.
        Include another subtle mention of the "His Secret Obsession" program with this affiliate link: ${affiliateLink}
        The email should be in HTML format with proper styling.
      `;
      
    default:
      return `
        Create a relationship advice email on the topic of trust and communication.
        The person's first name is "${firstName}".
        Include valuable insights and actionable tips they can apply immediately.
        The email should be in HTML format with proper styling.
      `;
  }
}

/**
 * Get default template for different email types
 */
function getDefaultTemplate(
  emailType: string,
  variables: TemplateVariables
): string {
  const firstName = variables.firstName || 'valued subscriber';
  const affiliateLink = variables.affiliateLink || process.env.AFFILIATE_LINK || '#';
  const blogLink = variables.blogLink || '#';
  const unsubscribeUrl = variables.unsubscribeUrl || '#';
  
  // Default templates for each email type
  switch (emailType) {
    case 'welcome':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Welcome, ${firstName}!</h1>
          <p>Thank you for downloading our relationship guide. I'm excited to have you join our community of people committed to building stronger, more fulfilling relationships.</p>
          <p>Over the next few days, I'll be sharing some powerful insights about relationships that have helped thousands of couples reconnect and reignite their passion.</p>
          <p>Keep an eye on your inbox—your journey to a more fulfilling relationship begins now.</p>
          <p>Warmly,<br>The Obsession Trigger Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>If you no longer wish to receive these emails, you can <a href="${unsubscribeUrl}">unsubscribe here</a>.</p>
          </div>
        </div>
      `;
      
    case 'value':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Emotional Connection: The Key to Lasting Love</h1>
          <p>Hello ${firstName},</p>
          <p>Today I want to share something powerful with you about emotional connection in relationships.</p>
          <p>Did you know that emotional intimacy is actually more important than physical connection for long-term relationship satisfaction?</p>
          <p>I've written a detailed guide on this topic that I think you'll find valuable. You can <a href="${blogLink}">read it here</a>.</p>
          <p>Let me know what you think!</p>
          <p>Warmly,<br>The Obsession Trigger Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>If you no longer wish to receive these emails, you can <a href="${unsubscribeUrl}">unsubscribe here</a>.</p>
          </div>
        </div>
      `;
      
    case 'hero_instinct':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>The "Hero Instinct" - The Hidden Key to a Man's Heart</h1>
          <p>Hello ${firstName},</p>
          <p>Today I want to introduce you to a powerful concept in male psychology called the "Hero Instinct."</p>
          <p>This deeply embedded instinct is present in virtually every man, yet most women have no idea it exists.</p>
          <p>When triggered properly, the Hero Instinct can create deep feelings of purpose, satisfaction, and romantic connection in a man.</p>
          <p>In simple terms, it's a biological drive that makes him want to provide for and protect you, while feeling appreciated for his efforts.</p>
          <p>Understanding this concept can be transformative for your relationship.</p>
          <p>In my next email, I'll share how you can practically apply this knowledge.</p>
          <p>Warmly,<br>The Obsession Trigger Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>If you no longer wish to receive these emails, you can <a href="${unsubscribeUrl}">unsubscribe here</a>.</p>
          </div>
        </div>
      `;
      
    case 'affiliate':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Unlock His Lasting Devotion: The Complete System</h1>
          <p>Hello ${firstName},</p>
          <p>Since I shared the concept of the "Hero Instinct" with you, I've received many questions about how to actually trigger this powerful drive in practice.</p>
          <p>That's why I wanted to tell you about the most comprehensive resource available on this topic: <strong>"His Secret Obsession"</strong>.</p>
          <p>This complete program shows you exactly how to tap into a man's Hero Instinct using specific phrases, texts, and actions that create a deep emotional bond.</p>
          <p>Inside, you'll discover:</p>
          <ul>
            <li>The exact phrases that trigger his Hero Instinct</li>
            <li>How to make him feel irreplaceable in your life</li>
            <li>The "Secret Signal" that makes him see you as "the one"</li>
            <li>Why neediness repels men and how to avoid this common mistake</li>
          </ul>
          <p><a href="${affiliateLink}" style="display: inline-block; padding: 12px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Discover His Secret Obsession</a></p>
          <p>Thousands of women have already transformed their relationships with these techniques.</p>
          <p>Warmly,<br>The Obsession Trigger Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>If you no longer wish to receive these emails, you can <a href="${unsubscribeUrl}">unsubscribe here</a>.</p>
          </div>
        </div>
      `;
      
    case 'story':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>How Sarah Saved Her Relationship...</h1>
          <p>Hello ${firstName},</p>
          <p>I want to share a story with you today about Sarah, who was on the verge of losing her relationship of 5 years.</p>
          <p>Sarah and Michael had been together since college, but their relationship had fallen into a familiar pattern: she felt ignored and undervalued, while he seemed distant and disinterested.</p>
          <p>Sound familiar?</p>
          <p>After discovering the Hero Instinct concept, Sarah began implementing small changes in how she communicated with Michael.</p>
          <p>Within weeks, she noticed he was more attentive, affectionate, and engaged in their relationship. He started planning dates again and telling her how special she was to him.</p>
          <p>The transformation wasn't magic - it was simply about understanding and working with male psychology rather than against it.</p>
          <p>Sarah is just one of thousands who have used the techniques from <a href="${affiliateLink}">His Secret Obsession</a> to transform their relationships.</p>
          <p>Warmly,<br>The Obsession Trigger Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>If you no longer wish to receive these emails, you can <a href="${unsubscribeUrl}">unsubscribe here</a>.</p>
          </div>
        </div>
      `;
      
    default:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Building Trust in Your Relationship</h1>
          <p>Hello ${firstName},</p>
          <p>Trust and communication form the foundation of every successful relationship.</p>
          <p>Today, I wanted to share some thoughts on how to strengthen these essential elements in your own relationship.</p>
          <p>Remember that trust is built in small moments, one day at a time.</p>
          <p>Warmly,<br>The Obsession Trigger Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>If you no longer wish to receive these emails, you can <a href="${unsubscribeUrl}">unsubscribe here</a>.</p>
          </div>
        </div>
      `;
  }
}

/**
 * Create default email sequence templates if none exist
 */
export async function createDefaultEmailTemplates(): Promise<void> {
  try {
    // Check if templates already exist
    const existingTemplates = await storage.getAllEmailTemplates();
    if (existingTemplates && existingTemplates.length > 0) {
      return; // Templates already exist
    }
    
    // Create default sequence
    const sequence = await storage.saveEmailSequence({
      name: 'Default Email Sequence',
      description: 'Standard 5-email followup sequence after lead magnet signup',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Create default templates
    const templateData = [
      {
        name: 'Welcome Email',
        subject: 'Welcome to Obsession Trigger AI',
        content: getDefaultTemplate('welcome', {}),
        emailType: 'welcome',
        sequenceId: sequence.id,
        delayDays: 0, // Immediate delivery
        attachLeadMagnet: true,
        isActive: true
      },
      {
        name: 'Value Email - Emotional Connection',
        subject: 'The Secret to Deeper Emotional Connection',
        content: getDefaultTemplate('value', {}),
        emailType: 'value',
        sequenceId: sequence.id,
        delayDays: 1, // Send 1 day after signup
        attachLeadMagnet: false,
        isActive: true
      },
      {
        name: 'Hero Instinct Introduction',
        subject: 'The "Hero Instinct" - What Every Woman Should Know',
        content: getDefaultTemplate('hero_instinct', {}),
        emailType: 'hero_instinct',
        sequenceId: sequence.id,
        delayDays: 3, // Send 3 days after signup
        attachLeadMagnet: false,
        isActive: true
      },
      {
        name: 'Affiliate - His Secret Obsession',
        subject: 'Transform Your Relationship With This Powerful Approach',
        content: getDefaultTemplate('affiliate', {}),
        emailType: 'affiliate',
        sequenceId: sequence.id,
        delayDays: 5, // Send 5 days after signup
        attachLeadMagnet: false,
        isActive: true
      },
      {
        name: 'Success Story Email',
        subject: 'How Sarah Rekindled Her Relationship (And How You Can Too)',
        content: getDefaultTemplate('story', {}),
        emailType: 'story',
        sequenceId: sequence.id,
        delayDays: 7, // Send 7 days after signup
        attachLeadMagnet: false,
        isActive: true
      }
    ];
    
    // Save each template
    for (const template of templateData) {
      await storage.saveEmailTemplate(template);
    }
    
    console.log('Default email templates created successfully');
  } catch (error) {
    console.error('Error creating default email templates:', error);
  }
}