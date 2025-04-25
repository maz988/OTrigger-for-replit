/**
 * Email Dispatcher Service
 * 
 * This service handles dispatching emails through various providers,
 * processing email queue, and managing email sequences.
 */

import { EmailMessage, processTemplate } from './emailTemplates';
import { storage } from '../storage';
import { sendWithSendGrid, validateApiKey as validateSendGridApiKey } from './emailProviders/sendgrid';
import { sendWithMailerLite, validateApiKey as validateMailerLiteApiKey } from './emailProviders/mailerlite';
import { sendWithBrevo, validateApiKey as validateBrevoApiKey } from './emailProviders/brevo';
import { EmailSubscriber, EmailTemplate, EmailQueue, InsertEmailQueue } from '@shared/schema';

/**
 * Provider configuration
 */
export interface EmailProviderConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
}

/**
 * Result of sending an email
 */
export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Initialize email provider configuration from system settings
 */
export async function getProviderConfig(): Promise<EmailProviderConfig> {
  // Get system settings
  const emailServiceSetting = await storage.getSettingByKey('EMAIL_SERVICE');
  const fromEmailSetting = await storage.getSettingByKey('EMAIL_FROM');
  const fromNameSetting = await storage.getSettingByKey('EMAIL_FROM_NAME');
  const replyToSetting = await storage.getSettingByKey('EMAIL_REPLY_TO');
  
  // Get the correct API key based on selected service
  const service = emailServiceSetting?.settingValue || 'sendgrid';
  let apiKeySetting;
  
  // First try to get the API key from the database (most up-to-date)
  if (service === 'mailerlite') {
    apiKeySetting = await storage.getSettingByKey('MAILERLITE_API_KEY');
    // If empty in database but exists in env, update the database
    if ((!apiKeySetting || !apiKeySetting.settingValue) && process.env.MAILERLITE_API_KEY) {
      await storage.saveSetting({
        settingKey: 'MAILERLITE_API_KEY',
        settingValue: process.env.MAILERLITE_API_KEY,
        settingType: 'string',
        description: 'MailerLite API Key'
      });
      apiKeySetting = { settingValue: process.env.MAILERLITE_API_KEY };
    }
  } else if (service === 'brevo') {
    apiKeySetting = await storage.getSettingByKey('BREVO_API_KEY');
    // If empty in database but exists in env, update the database
    if ((!apiKeySetting || !apiKeySetting.settingValue) && process.env.BREVO_API_KEY) {
      await storage.saveSetting({
        settingKey: 'BREVO_API_KEY',
        settingValue: process.env.BREVO_API_KEY,
        settingType: 'string',
        description: 'Brevo API Key'
      });
      apiKeySetting = { settingValue: process.env.BREVO_API_KEY };
    }
  } else {
    // Default to SendGrid
    apiKeySetting = await storage.getSettingByKey('SENDGRID_API_KEY');
    // If empty in database but exists in env, update the database
    if ((!apiKeySetting || !apiKeySetting.settingValue) && process.env.SENDGRID_API_KEY) {
      await storage.saveSetting({
        settingKey: 'SENDGRID_API_KEY',
        settingValue: process.env.SENDGRID_API_KEY,
        settingType: 'string',
        description: 'SendGrid API Key'
      });
      apiKeySetting = { settingValue: process.env.SENDGRID_API_KEY };
    }
  }
  
  // Now ensure environment variables are also updated with database values
  if (apiKeySetting?.settingValue) {
    if (service === 'mailerlite' && process.env.MAILERLITE_API_KEY !== apiKeySetting.settingValue) {
      process.env.MAILERLITE_API_KEY = apiKeySetting.settingValue;
      console.log('Updated MailerLite API key in environment from database');
    } else if (service === 'brevo' && process.env.BREVO_API_KEY !== apiKeySetting.settingValue) {
      process.env.BREVO_API_KEY = apiKeySetting.settingValue;
      console.log('Updated Brevo API key in environment from database');
    } else if (service === 'sendgrid' && process.env.SENDGRID_API_KEY !== apiKeySetting.settingValue) {
      process.env.SENDGRID_API_KEY = apiKeySetting.settingValue;
      console.log('Updated SendGrid API key in environment from database');
    }
  }
  
  return {
    apiKey: apiKeySetting?.settingValue || '',
    fromEmail: fromEmailSetting?.settingValue || 'info@obsessiontrigger.com',
    fromName: fromNameSetting?.settingValue || 'Obsession Trigger Team',
    replyToEmail: replyToSetting?.settingValue || ''
  };
}

/**
 * Send subscriber data to the active email service provider
 * This function is called when a user submits their information through any form
 * (quiz, lead magnet, blog sidebar, etc.)
 */
export async function sendSubscriberToEmailService({
  name, 
  email, 
  source
}: {
  name: string;
  email: string;
  source?: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    // Get provider configuration
    const providerConfig = await getProviderConfig();
    
    // Determine which service to use
    const emailServiceSetting = await storage.getSettingByKey('EMAIL_SERVICE');
    const service = emailServiceSetting?.settingValue || 'sendgrid';
    
    // Check if we have a valid API key
    if (!providerConfig.apiKey) {
      console.error(`No API key configured for ${service}`);
      return {
        success: false,
        error: `No API key configured for ${service}`
      };
    }
    
    // Store subscriber in database first 
    let existingSubscriber = await storage.getSubscriberByEmail(email);
    
    if (!existingSubscriber) {
      // Create new subscriber record
      existingSubscriber = await storage.saveSubscriber({
        email,
        firstName: name,
        lastName: null,
        source: source || 'website',
        unsubscribeToken: generateUnsubscribeToken(email),
        isSubscribed: true
      });
      
      console.log(`New subscriber added to database: ${name} (${email}) from ${source || 'website'}`);
    } else {
      console.log(`Existing subscriber found: ${existingSubscriber.firstName} (${email})`);
    }
    
    // Send to appropriate email provider
    switch (service) {
      case 'mailerlite': {
        try {
          // Dynamically import to avoid circular dependencies
          const { sendToMailerLite } = await import('./emailProviders/mailerlite');
          const result = await sendToMailerLite(email, name, source, providerConfig.apiKey);
          
          if (result.success) {
            return {
              success: true,
              message: `Subscriber successfully sent to MailerLite: ${name} (${email})`
            };
          } else {
            return {
              success: false,
              error: result.error || 'Unknown error sending to MailerLite'
            };
          }
        } catch (error) {
          console.error('Error sending to MailerLite:', error);
          return {
            success: false,
            error: `MailerLite error: ${error.message}`
          };
        }
      }
        
      case 'brevo': {
        try {
          // Dynamically import to avoid circular dependencies
          const { sendToBrevo } = await import('./emailProviders/brevo');
          const result = await sendToBrevo(email, name, source, providerConfig.apiKey);
          
          if (result.success) {
            return {
              success: true,
              message: `Subscriber successfully sent to Brevo: ${name} (${email})`
            };
          } else {
            return {
              success: false,
              error: result.error || 'Unknown error sending to Brevo'
            };
          }
        } catch (error) {
          console.error('Error sending to Brevo:', error);
          return {
            success: false,
            error: `Brevo error: ${error.message}`
          };
        }
      }
        
      case 'sendgrid':
      default: {
        try {
          // Dynamically import to avoid circular dependencies
          const { sendToSendGrid } = await import('./emailProviders/sendgrid');
          const result = await sendToSendGrid(email, name, source, providerConfig.apiKey);
          
          if (result.success) {
            return {
              success: true,
              message: `Subscriber successfully sent to SendGrid: ${name} (${email})`
            };
          } else {
            return {
              success: false,
              error: result.error || 'Unknown error sending to SendGrid'
            };
          }
        } catch (error) {
          console.error('Error sending to SendGrid:', error);
          return {
            success: false,
            error: `SendGrid error: ${error.message}`
          };
        }
      }
    }
  } catch (error) {
    console.error('Error in sendSubscriberToEmailService:', error);
    return {
      success: false,
      error: `Failed to send subscriber to email service: ${error.message}`
    };
  }
}

/**
 * Generate a unique unsubscribe token for new subscribers
 */
function generateUnsubscribeToken(email: string): string {
  const timestamp = Date.now().toString();
  const randomPart = Math.random().toString(36).substring(2, 10);
  return Buffer.from(`${email}:${timestamp}:${randomPart}`).toString('base64');
}

/**
 * Send an email using the configured provider
 */
export async function sendEmail(
  message: EmailMessage,
  config?: EmailProviderConfig
): Promise<SendResult> {
  // Get config if not provided
  const providerConfig = config || await getProviderConfig();
  
  // Determine which service to use
  const emailServiceSetting = await storage.getSettingByKey('EMAIL_SERVICE');
  const service = emailServiceSetting?.settingValue || 'sendgrid';
  
  // Update from field with the configured values if needed
  if (!message.from.includes('<')) {
    message.from = `${providerConfig.fromName} <${providerConfig.fromEmail}>`;
  }
  
  // Send using the appropriate provider
  try {
    let result: SendResult;
    
    switch (service) {
      case 'mailerlite':
        result = await sendWithMailerLite(message, providerConfig.apiKey);
        break;
      case 'brevo':
        result = await sendWithBrevo(message, providerConfig.apiKey);
        break;
      case 'sendgrid':
      default:
        result = await sendWithSendGrid(message, providerConfig.apiKey);
        break;
    }
    
    // Log outcome
    if (result.success) {
      console.log(`Email sent successfully to ${message.to} using ${service}`);
    } else {
      console.error(`Failed to send email to ${message.to} using ${service}: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error in sendEmail: ${error.message}`);
    return {
      success: false,
      error: `Email dispatch error: ${error.message}`
    };
  }
}

/**
 * Send a specific email template to a subscriber
 */
export async function sendTemplateToSubscriber(
  template: EmailTemplate,
  subscriber: EmailSubscriber
): Promise<SendResult> {
  try {
    // Import sanitizeHtml function dynamically to avoid circular dependency
    const { sanitizeHtml } = await import('./emailTemplates');
    
    // Create a sanitized copy of the template
    const sanitizedTemplate = {
      ...template,
      content: sanitizeHtml(template.content)
    };
    
    // Process template with sanitized content
    const emailMessage = await processTemplate(sanitizedTemplate, subscriber);
    
    // Send the email
    const result = await sendEmail(emailMessage);
    
    // Record the email in history if successful
    if (result.success) {
      await storage.recordEmailSent({
        subscriberId: subscriber.id,
        templateId: template.id,
        status: 'delivered',
        sentAt: new Date(),
        provider: (await storage.getSettingByKey('EMAIL_SERVICE'))?.settingValue || 'sendgrid',
        metadata: {
          messageId: result.messageId,
          subject: emailMessage.subject
        }
      });
      
      // Update subscriber's last email sent date
      await storage.updateSubscriber(subscriber.id, {
        lastEmailSent: new Date()
      });
    }
    
    return result;
  } catch (error) {
    console.error(`Error sending template to subscriber: ${error.message}`);
    return {
      success: false,
      error: `Template processing error: ${error.message}`
    };
  }
}

/**
 * Ensure HTML content is sanitized before processing to avoid JSON issues
 */ 
const ensureSanitizedTemplate = async (template: EmailTemplate): Promise<EmailTemplate> => {
  // Dynamically import the sanitizeHtml function to avoid circular dependencies
  const { sanitizeHtml } = await import('./emailTemplates');
  
  if (template && template.content) {
    return {
      ...template,
      content: sanitizeHtml(template.content)
    };
  }
  
  return template;
};

/**
 * Process the email queue, sending any due emails
 */
export async function processEmailQueue(): Promise<void> {
  try {
    // Get emails that are due to be sent
    const dueEmails = await storage.getDueQueuedEmails();
    
    if (dueEmails.length === 0) {
      return;
    }
    
    console.log(`Processing ${dueEmails.length} emails in queue`);
    
    // Process each email
    for (const queuedEmail of dueEmails) {
      try {
        // Update status to processing
        await storage.updateQueuedEmailStatus(queuedEmail.id, 'processing');
        
        // Get the subscriber and template
        const subscriber = await storage.getSubscriberById(queuedEmail.subscriberId);
        let template = await storage.getEmailTemplateById(queuedEmail.templateId);
        
        if (!subscriber) {
          await storage.updateQueuedEmailStatus(
            queuedEmail.id, 
            'failed', 
            'Subscriber not found'
          );
          continue;
        }
        
        if (!template) {
          await storage.updateQueuedEmailStatus(
            queuedEmail.id, 
            'failed', 
            'Template not found'
          );
          continue;
        }
        
        // Check if subscriber is still subscribed
        if (!subscriber.isSubscribed) {
          await storage.updateQueuedEmailStatus(
            queuedEmail.id, 
            'cancelled', 
            'Subscriber is unsubscribed'
          );
          continue;
        }
        
        // Sanitize template content to ensure HTML is safe for processing
        template = await ensureSanitizedTemplate(template);
        
        // Send the email
        const result = await sendTemplateToSubscriber(template, subscriber);
        
        if (result.success) {
          await storage.updateQueuedEmailStatus(
            queuedEmail.id, 
            'sent', 
            result.messageId
          );
          
          // Check for sequence and queue next email if needed
          if (template.sequenceId) {
            await queueNextSequenceEmail(subscriber.id, template.sequenceId, template.id);
          }
        } else {
          await storage.updateQueuedEmailStatus(
            queuedEmail.id, 
            'failed', 
            result.error
          );
        }
      } catch (error) {
        console.error(`Error processing queued email ${queuedEmail.id}:`, error);
        await storage.updateQueuedEmailStatus(
          queuedEmail.id, 
          'failed', 
          `Processing error: ${error.message}`
        );
      }
    }
  } catch (error) {
    console.error('Error processing email queue:', error);
    throw new Error(`Failed to process email queue: ${error.message}`);
  }
}

/**
 * Subscribe a user to an email sequence
 */
export async function subscribeToSequence(
  subscriberId: number,
  sequenceId: number,
  startImmediately = false
): Promise<boolean> {
  try {
    const subscriber = await storage.getSubscriberById(subscriberId);
    const sequence = await storage.getEmailSequenceById(sequenceId);
    
    if (!subscriber || !sequence) {
      return false;
    }
    
    // Find the first email in the sequence (welcome email)
    const templates = await storage.getEmailTemplatesBySequenceId(sequenceId);
    const welcomeEmail = templates.find(t => 
      t.emailType === 'welcome' && t.isActive
    );
    
    if (!welcomeEmail) {
      console.error(`No welcome email found for sequence ${sequenceId}`);
      return false;
    }
    
    // Queue the welcome email
    const scheduleDate = startImmediately ? new Date() : 
      new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now if not immediate
    
    const queuedEmail: InsertEmailQueue = {
      subscriberId,
      templateId: welcomeEmail.id,
      scheduledFor: scheduleDate,
      status: 'pending',
      metadata: {
        sequenceId,
        isFirst: true
      }
    };
    
    await storage.queueEmail(queuedEmail);
    return true;
  } catch (error) {
    console.error(`Error subscribing to sequence: ${error.message}`);
    return false;
  }
}

/**
 * Queue the next email in a sequence
 */
async function queueNextSequenceEmail(
  subscriberId: number,
  sequenceId: number,
  currentTemplateId: number
): Promise<boolean> {
  try {
    // Get all templates in the sequence
    const templates = await storage.getEmailTemplatesBySequenceId(sequenceId);
    const currentTemplate = templates.find(t => t.id === currentTemplateId);
    
    if (!currentTemplate) {
      return false;
    }
    
    // Find templates with a higher delay
    const nextTemplates = templates
      .filter(t => t.isActive && t.delayDays > currentTemplate.delayDays)
      .sort((a, b) => a.delayDays - b.delayDays);
    
    if (nextTemplates.length === 0) {
      // End of sequence
      return false;
    }
    
    // Get the next template (with the lowest delay higher than current)
    const nextTemplate = nextTemplates[0];
    
    // Calculate delay
    const delayDays = nextTemplate.delayDays - currentTemplate.delayDays;
    const scheduleDate = new Date();
    scheduleDate.setDate(scheduleDate.getDate() + delayDays);
    
    // Queue the next email
    const queuedEmail: InsertEmailQueue = {
      subscriberId,
      templateId: nextTemplate.id,
      scheduledFor: scheduleDate,
      status: 'pending',
      metadata: {
        sequenceId,
        previousTemplateId: currentTemplateId
      }
    };
    
    await storage.queueEmail(queuedEmail);
    return true;
  } catch (error) {
    console.error(`Error queuing next sequence email: ${error.message}`);
    return false;
  }
}

/**
 * Test connection with the configured email provider
 */
export async function testEmailProviderConnection(
  provider: string,
  apiKey: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    switch (provider) {
      case 'mailerlite':
        if (!validateMailerLiteApiKey(apiKey)) {
          return {
            success: false,
            error: 'Invalid MailerLite API key format'
          };
        }
        return await import('./emailProviders/mailerlite').then(module => 
          module.testConnection(apiKey)
        );
        
      case 'brevo':
        if (!validateBrevoApiKey(apiKey)) {
          return {
            success: false,
            error: 'Invalid Brevo API key format'
          };
        }
        return await import('./emailProviders/brevo').then(module => 
          module.testConnection(apiKey)
        );
        
      case 'sendgrid':
      default:
        if (!validateSendGridApiKey(apiKey)) {
          return {
            success: false,
            error: 'Invalid SendGrid API key format'
          };
        }
        return await import('./emailProviders/sendgrid').then(module => 
          module.testConnection(apiKey)
        );
    }
  } catch (error) {
    console.error(`Error testing email provider connection: ${error.message}`);
    return {
      success: false,
      error: `Connection test error: ${error.message}`
    };
  }
}

/**
 * Send a test email
 */
export async function sendTestEmail(
  email: string,
  provider?: string,
  apiKey?: string
): Promise<SendResult> {
  try {
    // Import sanitizeHtml function dynamically to avoid circular dependency
    const { sanitizeHtml } = await import('./emailTemplates');
    
    // Create test subscriber data
    const testSubscriber: EmailSubscriber = {
      id: 0,
      firstName: 'Test',
      lastName: 'User',
      email,
      source: 'test',
      createdAt: new Date(),
      isSubscribed: true,
      unsubscribeToken: 'test-token',
      lastEmailSent: null
    };
    
    // Create test template with sanitized content
    const basicContent = `
      <h1>This is a test email</h1>
      <p>Hello {{firstName}},</p>
      <p>This is a test email from Obsession Trigger.</p>
      <p>If you're receiving this, the email system is working correctly!</p>
      <p>Sent at: ${new Date().toISOString()}</p>
    `;
    
    const testTemplate: EmailTemplate = {
      id: 0,
      name: 'Test Email',
      subject: 'Test Email from Obsession Trigger',
      content: sanitizeHtml(basicContent),
      sequenceId: 0,
      emailType: 'test',
      delayDays: 0,
      createdAt: new Date(),
      updatedAt: null,
      isActive: true,
      attachLeadMagnet: false,
      leadMagnetPath: null
    };
    
    // Process template (this will apply additional sanitization)
    const emailMessage = await processTemplate(testTemplate, testSubscriber);
    
    // Use custom provider if specified
    let config: EmailProviderConfig | undefined;
    
    if (provider && apiKey) {
      const fromEmailSetting = await storage.getSettingByKey('EMAIL_FROM');
      const fromNameSetting = await storage.getSettingByKey('EMAIL_FROM_NAME');
      
      config = {
        apiKey,
        fromEmail: fromEmailSetting?.settingValue || 'info@obsessiontrigger.com',
        fromName: fromNameSetting?.settingValue || 'Obsession Trigger Team',
        replyToEmail: fromEmailSetting?.settingValue || 'info@obsessiontrigger.com'
      };
    }
    
    // Send the email
    let result: SendResult;
    
    if (provider && config) {
      // Use specified provider
      switch (provider) {
        case 'mailerlite':
          result = await sendWithMailerLite(emailMessage, config.apiKey);
          break;
        case 'brevo':
          result = await sendWithBrevo(emailMessage, config.apiKey);
          break;
        case 'sendgrid':
        default:
          result = await sendWithSendGrid(emailMessage, config.apiKey);
          break;
      }
    } else {
      // Use default provider
      result = await sendEmail(emailMessage);
    }
    
    return result;
  } catch (error) {
    console.error(`Error sending test email: ${error.message}`);
    return {
      success: false,
      error: `Test email error: ${error.message}`
    };
  }
}