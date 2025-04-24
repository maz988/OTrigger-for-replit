import { storage } from '../storage';
import * as emailTemplates from './emailTemplates';
import { EmailTemplate, EmailSubscriber } from '@shared/schema';
import { createTransporter } from './emailProviders/sendgrid';
import { sendWithMailerLite } from './emailProviders/mailerlite';
import { sendWithBrevo } from './emailProviders/brevo';

/**
 * Email Service Configuration
 * This interface defines the structure for email service configuration
 */
export interface EmailServiceConfig {
  activeService: 'sendgrid' | 'mailerlite' | 'brevo' | 'none';
  senderEmail: string;
  sendgridApiKey?: string;
  mailerliteApiKey?: string;
  brevoApiKey?: string;
  autoEmailDelivery: boolean;
}

/**
 * Email Message Structure
 * Standardized format for sending emails across different providers
 */
export interface EmailMessage {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  templateId?: string;
  personalizations?: {
    firstName?: string;
    lastName?: string;
    [key: string]: any;
  };
  attachments?: {
    filename: string;
    path: string;
    contentType: string;
  }[];
  unsubscribeUrl?: string;
}

/**
 * Get current email configuration from settings
 */
export async function getEmailConfig(): Promise<EmailServiceConfig> {
  const activeServiceSetting = await storage.getSettingByKey('activeEmailService');
  const senderEmailSetting = await storage.getSettingByKey('senderEmail');
  const sendgridApiKeySetting = await storage.getSettingByKey('sendgridApiKey');
  const mailerliteApiKeySetting = await storage.getSettingByKey('mailerliteApiKey');
  const brevoApiKeySetting = await storage.getSettingByKey('brevoApiKey');
  const autoEmailDeliverySetting = await storage.getSettingByKey('autoEmailDelivery');
  
  return {
    activeService: (activeServiceSetting?.value as 'sendgrid' | 'mailerlite' | 'brevo' | 'none') || 'none',
    senderEmail: senderEmailSetting?.value || 'noreply@example.com',
    sendgridApiKey: sendgridApiKeySetting?.value,
    mailerliteApiKey: mailerliteApiKeySetting?.value,
    brevoApiKey: brevoApiKeySetting?.value,
    autoEmailDelivery: autoEmailDeliverySetting?.value === 'true'
  };
}

/**
 * Prepare and send email using the active email provider
 */
export async function sendEmail(
  subscriber: EmailSubscriber,
  template: EmailTemplate,
  config?: EmailServiceConfig
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Get email configuration if not provided
    const emailConfig = config || await getEmailConfig();
    
    // Check if email delivery is enabled
    if (!emailConfig.autoEmailDelivery) {
      console.log('Automatic email delivery is disabled. Email not sent.');
      return { success: false, message: 'Automatic email delivery is disabled' };
    }
    
    // Check if an active service is selected
    if (emailConfig.activeService === 'none') {
      console.log('No active email service selected. Email not sent.');
      return { success: false, message: 'No active email service selected' };
    }
    
    // Prepare the email content
    const htmlContent = await emailTemplates.prepareEmailContent(template, {
      firstName: subscriber.firstName,
      lastName: subscriber.lastName,
      email: subscriber.email,
      unsubscribeUrl: `${process.env.PUBLIC_URL || 'http://localhost:5000'}/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${subscriber.unsubscribeToken}`
    });
    
    // Prepare the standard email message format
    const message: EmailMessage = {
      to: subscriber.email,
      from: emailConfig.senderEmail,
      subject: template.subject,
      text: emailTemplates.stripHtml(htmlContent), // Plain text version
      html: htmlContent,
      personalizations: {
        firstName: subscriber.firstName,
        lastName: subscriber.lastName || '',
        email: subscriber.email
      },
      unsubscribeUrl: `${process.env.PUBLIC_URL || 'http://localhost:5000'}/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${subscriber.unsubscribeToken}`
    };
    
    // Add lead magnet attachment if specified
    if (template.attachLeadMagnet && template.leadMagnetPath) {
      message.attachments = [{
        filename: template.leadMagnetPath.split('/').pop() || 'download.pdf',
        path: template.leadMagnetPath,
        contentType: 'application/pdf'
      }];
    }
    
    let result;
    
    // Send email with the selected provider
    switch (emailConfig.activeService) {
      case 'sendgrid':
        if (!emailConfig.sendgridApiKey) {
          return { success: false, error: 'SendGrid API key is not configured' };
        }
        result = await sendWithSendGrid(message, emailConfig.sendgridApiKey);
        break;
        
      case 'mailerlite':
        if (!emailConfig.mailerliteApiKey) {
          return { success: false, error: 'MailerLite API key is not configured' };
        }
        result = await sendWithMailerLite(message, emailConfig.mailerliteApiKey);
        break;
        
      case 'brevo':
        if (!emailConfig.brevoApiKey) {
          return { success: false, error: 'Brevo API key is not configured' };
        }
        result = await sendWithBrevo(message, emailConfig.brevoApiKey);
        break;
        
      default:
        return { success: false, error: 'Invalid email service selected' };
    }
    
    // Record email sent in database
    if (result.success) {
      await recordEmailSent(subscriber.id, template.id, emailConfig.activeService);
      return { success: true, message: 'Email sent successfully' };
    } else {
      return { success: false, error: result.error || 'Failed to send email' };
    }
    
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email using SendGrid
 */
async function sendWithSendGrid(
  message: EmailMessage,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get SendGrid transporter
    const transporter = createTransporter(apiKey);
    
    // Prepare message format for SendGrid
    const sendgridMessage = {
      to: message.to,
      from: message.from,
      subject: message.subject,
      text: message.text,
      html: message.html,
      attachments: message.attachments,
      customArgs: {
        unsubscribeUrl: message.unsubscribeUrl
      }
    };
    
    // Send email
    await transporter.send(sendgridMessage);
    return { success: true };
  } catch (error: any) {
    console.error('SendGrid error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Record email sent in the database
 */
async function recordEmailSent(
  subscriberId: number,
  templateId: number,
  provider: string
): Promise<void> {
  try {
    await storage.recordEmailSent({
      subscriberId,
      templateId,
      sentAt: new Date().toISOString(),
      provider,
      status: 'sent'
    });
  } catch (error) {
    console.error('Error recording email sent:', error);
  }
}

/**
 * Send test email to verify service configuration
 */
export async function sendTestEmail(
  emailAddress: string,
  service: 'sendgrid' | 'mailerlite' | 'brevo',
  apiKey: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Get email configuration
    const emailConfig = await getEmailConfig();
    
    // Prepare test email message
    const message: EmailMessage = {
      to: emailAddress,
      from: emailConfig.senderEmail || 'test@example.com',
      subject: 'Test Email from Obsession Trigger AI',
      text: 'This is a test email to verify your email service configuration.',
      html: '<h1>Email Service Test</h1><p>This is a test email to verify your email service configuration.</p>'
    };
    
    let result;
    
    // Send email with the specified provider
    switch (service) {
      case 'sendgrid':
        result = await sendWithSendGrid(message, apiKey);
        break;
        
      case 'mailerlite':
        result = await sendWithMailerLite(message, apiKey);
        break;
        
      case 'brevo':
        result = await sendWithBrevo(message, apiKey);
        break;
        
      default:
        return { success: false, error: 'Invalid email service specified' };
    }
    
    if (result.success) {
      return { success: true, message: `Test email sent successfully with ${service}` };
    } else {
      return { success: false, error: result.error || `Failed to send test email with ${service}` };
    }
    
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Queue an email sequence for a subscriber
 */
export async function queueEmailSequence(
  subscriberId: number,
  sequenceId?: number
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Get the subscriber
    const subscriber = await storage.getSubscriberById(subscriberId);
    if (!subscriber) {
      return { success: false, error: 'Subscriber not found' };
    }
    
    // Get the sequence (default to sequence 1 if not specified)
    const sequence = sequenceId 
      ? await storage.getEmailSequenceById(sequenceId)
      : await storage.getDefaultEmailSequence();
    
    if (!sequence) {
      return { success: false, error: 'Email sequence not found' };
    }
    
    // Get the templates in the sequence
    const templates = await storage.getEmailTemplatesBySequenceId(sequence.id);
    if (!templates || templates.length === 0) {
      return { success: false, error: 'No email templates found in sequence' };
    }
    
    // Create scheduled emails for each template
    const now = new Date();
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      
      // Calculate send date based on delay
      const sendDate = new Date(now.getTime() + (template.delayDays * 24 * 60 * 60 * 1000));
      
      // Queue the email
      await storage.queueEmail({
        subscriberId: subscriber.id,
        templateId: template.id,
        scheduledFor: sendDate.toISOString(),
        status: 'queued'
      });
    }
    
    return { success: true, message: `Successfully queued ${templates.length} emails for subscriber` };
    
  } catch (error: any) {
    console.error('Error queueing email sequence:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process queued emails that are due to be sent
 */
export async function processQueuedEmails(): Promise<{ 
  success: boolean; 
  sent: number; 
  failed: number; 
  message?: string; 
  error?: string 
}> {
  try {
    // Get email configuration
    const emailConfig = await getEmailConfig();
    
    // Skip if auto email delivery is disabled
    if (!emailConfig.autoEmailDelivery) {
      return { success: true, sent: 0, failed: 0, message: 'Automatic email delivery is disabled' };
    }
    
    // Get due emails
    const dueEmails = await storage.getDueQueuedEmails();
    if (!dueEmails || dueEmails.length === 0) {
      return { success: true, sent: 0, failed: 0, message: 'No emails due for sending' };
    }
    
    let sent = 0;
    let failed = 0;
    
    // Process each due email
    for (const queuedEmail of dueEmails) {
      try {
        // Get subscriber and template
        const subscriber = await storage.getSubscriberById(queuedEmail.subscriberId);
        const template = await storage.getEmailTemplateById(queuedEmail.templateId);
        
        if (!subscriber || !template) {
          await storage.updateQueuedEmailStatus(queuedEmail.id, 'error', 'Subscriber or template not found');
          failed++;
          continue;
        }
        
        // Skip if subscriber is unsubscribed
        if (!subscriber.isSubscribed) {
          await storage.updateQueuedEmailStatus(queuedEmail.id, 'skipped', 'Subscriber is unsubscribed');
          continue;
        }
        
        // Send the email
        const result = await sendEmail(subscriber, template, emailConfig);
        
        if (result.success) {
          await storage.updateQueuedEmailStatus(queuedEmail.id, 'sent');
          sent++;
        } else {
          await storage.updateQueuedEmailStatus(queuedEmail.id, 'failed', result.error);
          failed++;
        }
      } catch (emailError: any) {
        console.error('Error processing queued email:', emailError);
        await storage.updateQueuedEmailStatus(queuedEmail.id, 'error', emailError.message);
        failed++;
      }
    }
    
    return { 
      success: true, 
      sent, 
      failed, 
      message: `Processed ${dueEmails.length} emails: ${sent} sent, ${failed} failed` 
    };
    
  } catch (error: any) {
    console.error('Error processing queued emails:', error);
    return { success: false, sent: 0, failed: 0, error: error.message };
  }
}