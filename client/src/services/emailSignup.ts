import { EmailFormData } from '@shared/schema';
import { EmailType } from '@/utils/emailTemplates';

/**
 * Interface for lead data submission
 */
export interface LeadData extends EmailFormData {
  source?: string;
  leadMagnetName?: string;
}

/**
 * Submit lead data to the server
 * @param leadData Email and lead data
 * @returns Promise with the response
 */
export async function submitLeadData(leadData: LeadData): Promise<any> {
  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit lead data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting lead:', error);
    throw error;
  }
}

/**
 * Generate a lead magnet PDF and email it to the user
 * @param email User email
 * @param firstName User first name
 * @param leadMagnetName Name of the lead magnet
 * @returns Promise with the response
 */
export async function generateAndSendLeadMagnet(
  email: string,
  firstName: string,
  leadMagnetName: string
): Promise<any> {
  try {
    const response = await fetch('/api/generate-lead-magnet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        firstName,
        leadMagnetName,
        emailType: EmailType.WELCOME
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate lead magnet');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating lead magnet:', error);
    throw error;
  }
}

/**
 * Track lead conversion from specific blog post
 * @param blogPostId ID of the blog post
 * @param email User email
 * @returns Promise with the response
 */
export async function trackBlogLeadConversion(
  blogPostId: number | undefined,
  email: string
): Promise<void> {
  if (!blogPostId) return;
  
  try {
    const response = await fetch('/api/blog/lead-conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blogPostId,
        email
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to track blog lead conversion');
    }
  } catch (error) {
    console.error('Error tracking blog lead conversion:', error);
  }
}

/**
 * Track lead conversion from quiz
 * @param quizResponseId ID of the quiz response
 * @param email User email
 * @returns Promise with the response
 */
export async function trackQuizLeadConversion(
  quizResponseId: number | undefined,
  email: string
): Promise<void> {
  if (!quizResponseId) return;
  
  try {
    const response = await fetch('/api/quiz/lead-conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quizResponseId,
        email
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to track quiz lead conversion');
    }
  } catch (error) {
    console.error('Error tracking quiz lead conversion:', error);
  }
}