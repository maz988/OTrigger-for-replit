/**
 * Email Templates Service
 * 
 * This service handles the management of email templates, including:
 * - Template variable replacement
 * - Template rendering
 * - Default templates management
 */

import { EmailTemplate, EmailSubscriber, InsertEmailTemplate, InsertEmailSequence } from '@shared/schema';
import { storage } from '../storage';

// Regex for matching template variables like {{firstName}}
const TEMPLATE_VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;

/**
 * Email variable replacer function type
 */
export type VariableReplacer = (varName: string, subscriber: EmailSubscriber) => string;

/**
 * Base email message structure
 */
export interface EmailMessage {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  attachments?: Array<{
    filename: string;
    path: string;
    contentType: string;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Sanitize HTML content to prevent issues with email providers
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  // Remove DOCTYPE and other potentially problematic tags that would cause issues
  return html
    .replace(/<!DOCTYPE[^>]*>/i, '')
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
}

/**
 * Process a template for a specific subscriber
 */
export async function processTemplate(
  template: EmailTemplate,
  subscriber: EmailSubscriber
): Promise<EmailMessage> {
  // Get system settings for default from email
  const fromNameSetting = await storage.getSettingByKey('EMAIL_FROM_NAME');
  const fromEmailSetting = await storage.getSettingByKey('EMAIL_FROM');
  const replyToSetting = await storage.getSettingByKey('EMAIL_REPLY_TO');

  const fromName = fromNameSetting?.settingValue || 'Obsession Trigger Team';
  const fromEmail = fromEmailSetting?.settingValue || 'info@obsessiontrigger.com';
  const replyToEmail = replyToSetting?.settingValue || fromEmail;

  // Replace variables in subject
  const subject = replaceVariables(template.subject, subscriber);
  
  // Sanitize HTML content
  const sanitizedContent = sanitizeHtml(template.content);
  
  // Replace variables in content
  const html = replaceVariables(sanitizedContent, subscriber);
  
  // Generate plain text version
  const text = convertHtmlToText(html);
  
  // Create email message
  const emailMessage: EmailMessage = {
    to: subscriber.email,
    from: `${fromName} <${fromEmail}>`,
    subject,
    html,
    text,
    metadata: {
      subscriberId: subscriber.id,
      templateId: template.id,
      sequenceId: template.sequenceId,
      emailType: template.emailType
    }
  };
  
  // Add attachment if needed
  if (template.attachLeadMagnet && template.leadMagnetPath) {
    emailMessage.attachments = [
      {
        filename: template.leadMagnetPath.split('/').pop() || 'attachment.pdf',
        path: template.leadMagnetPath,
        contentType: 'application/pdf'
      }
    ];
  }
  
  return emailMessage;
}

/**
 * Replace template variables with actual subscriber data
 */
export function replaceVariables(
  template: string,
  subscriber: EmailSubscriber,
  customReplacer?: VariableReplacer
): string {
  return template.replace(
    TEMPLATE_VARIABLE_REGEX,
    (match, varName) => {
      // Allow custom replacer to handle special variables
      if (customReplacer) {
        const result = customReplacer(varName, subscriber);
        if (result !== undefined) {
          return result;
        }
      }
      
      // Handle standard subscriber fields
      switch (varName.trim()) {
        case 'firstName':
          return subscriber.firstName || 'there';
        case 'lastName':
          return subscriber.lastName || '';
        case 'email':
          return subscriber.email;
        case 'unsubscribeUrl':
          return `https://obsessiontrigger.com/unsubscribe?token=${subscriber.unsubscribeToken}`;
        default:
          return match; // Keep original variable if not recognized
      }
    }
  );
}

/**
 * Simple HTML to text converter for email clients that don't support HTML
 */
export function convertHtmlToText(html: string): string {
  return html
    // Replace common HTML elements with plain text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<div\s+[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<p\s+[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<li\s+[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<ul\s+[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol\s+[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<strong\s+[^>]*>|<b\s+[^>]*>/gi, '*')
    .replace(/<\/strong>|<\/b>/gi, '*')
    .replace(/<em\s+[^>]*>|<i\s+[^>]*>/gi, '_')
    .replace(/<\/em>|<\/i>/gi, '_')
    // Remove all remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    // Fix excessive whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Initialize default email sequence and templates if needed
 */
export async function initializeDefaultEmailSequence(): Promise<void> {
  try {
    // Check if default sequence already exists
    const defaultSequence = await storage.getDefaultEmailSequence();
    
    if (!defaultSequence) {
      // Create default welcome sequence
      const welcomeSequence: InsertEmailSequence = {
        name: 'Welcome Sequence',
        description: 'Default welcome sequence for new subscribers',
        isDefault: true
      };
      
      const sequence = await storage.saveEmailSequence(welcomeSequence);
      
      // Create welcome email template
      const welcomeTemplate: InsertEmailTemplate = {
        name: 'Welcome Email',
        subject: 'Welcome to Obsession Trigger!',
        content: `<p>Dear {{firstName}},</p>
<p>Welcome to Obsession Trigger! We're excited to have you join our community.</p>
<p>Over the next few days, you'll receive a series of emails with valuable relationship advice and insights that can help transform your love life.</p>
<p>If you have any questions, feel free to reply to this email.</p>
<p>Warm regards,<br>The Obsession Trigger Team</p>`,
        sequenceId: sequence.id,
        emailType: 'welcome',
        delayDays: 0
      };
      
      await storage.saveEmailTemplate(welcomeTemplate);
      
      // Create follow-up email templates
      const heroInstinct: InsertEmailTemplate = {
        name: 'Hero Instinct Guide',
        subject: 'Understanding His Hero Instinct [GUIDE]',
        content: `<p>Dear {{firstName}},</p>
<p>Today I wanted to share something powerful with you - understanding the hero instinct in men.</p>
<p>The hero instinct is a biological drive that all men have. It's a desire to feel needed, to feel important, and to provide for those he cares about.</p>
<p>When you know how to trigger this instinct, you can create a deep, passionate connection with any man.</p>
<p>Here are three simple ways to activate his hero instinct:</p>
<ol>
  <li>Ask for his help on something specific</li>
  <li>Express your appreciation when he does something for you</li>
  <li>Support his goals and ambitions</li>
</ol>
<p>Try these techniques and see how he responds - you might be surprised at the results!</p>
<p>Warm regards,<br>The Obsession Trigger Team</p>`,
        sequenceId: sequence.id,
        emailType: 'content',
        delayDays: 2
      };
      
      await storage.saveEmailTemplate(heroInstinct);
      
      console.log('Default email sequence and templates created successfully');
    }
  } catch (error) {
    console.error('Error initializing default email sequence:', error);
  }
}

/**
 * Get template for a given email type
 */
export async function getTemplateByType(
  emailType: string, 
  sequenceId?: number
): Promise<EmailTemplate | undefined> {
  try {
    const templates = await storage.getAllEmailTemplates();
    
    // Filter by sequence id if provided
    let filteredTemplates = templates;
    if (sequenceId !== undefined) {
      filteredTemplates = templates.filter(t => t.sequenceId === sequenceId);
    }
    
    // Find first active template with matching type
    return filteredTemplates.find(t => t.emailType === emailType && t.isActive);
  } catch (error) {
    console.error('Error getting template by type:', error);
    return undefined;
  }
}