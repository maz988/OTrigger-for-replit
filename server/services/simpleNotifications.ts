/**
 * Simple Notifications Service
 * 
 * A streamlined, reliable notification system that replaces the complex email system.
 * This service handles:
 * - Sending basic text-only notifications
 * - Managing subscriber communications
 * - Tracking notification delivery
 */

import { EmailSubscriber } from '@shared/schema';
import { storage } from '../storage';

// Types of notifications that can be sent
export type NotificationType = 'welcome' | 'lead_magnet' | 'content_update' | 'custom';

// Simple message format without complex HTML
export interface SimpleMessage {
  to: string;
  subject: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Send a simple notification to a subscriber
 */
export async function sendNotification(
  subscriber: EmailSubscriber, 
  type: NotificationType, 
  options: {
    subject?: string;
    message?: string;
    attachmentPath?: string;
  } = {}
): Promise<boolean> {
  try {
    // Get system settings
    const fromNameSetting = await storage.getSettingByKey('EMAIL_FROM_NAME');
    const fromEmailSetting = await storage.getSettingByKey('EMAIL_FROM');
    
    const fromName = fromNameSetting?.settingValue || 'Obsession Trigger Team';
    const fromEmail = fromEmailSetting?.settingValue || 'info@obsessiontrigger.com';
    
    // Create basic message with fallbacks for each notification type
    let subject = options.subject || '';
    let message = options.message || '';
    
    if (!subject || !message) {
      const defaults = getDefaultContentByType(type, subscriber);
      subject = subject || defaults.subject;
      message = message || defaults.message;
    }
    
    // Get active email provider
    const activeProviderSetting = await storage.getSettingByKey('EMAIL_PROVIDER');
    const activeProvider = activeProviderSetting?.settingValue || 'mailerlite';
    
    // Construct simple message
    const simpleMessage: SimpleMessage = {
      to: subscriber.email,
      subject,
      message,
      metadata: {
        subscriberId: subscriber.id,
        notificationType: type
      }
    };
    
    // Send using the active provider
    const result = await sendWithProvider(activeProvider, simpleMessage, options.attachmentPath);
    
    // Log the notification
    await logNotification(subscriber.id, type, result);
    
    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

/**
 * Send a batch of notifications to multiple subscribers
 */
export async function sendBatchNotifications(
  subscribers: EmailSubscriber[],
  type: NotificationType,
  options: {
    subject?: string;
    message?: string;
    attachmentPath?: string;
  } = {}
): Promise<{
  success: number;
  failed: number;
}> {
  let success = 0;
  let failed = 0;
  
  for (const subscriber of subscribers) {
    const result = await sendNotification(subscriber, type, options);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }
  
  return { success, failed };
}

/**
 * Get default content templates for each notification type
 */
function getDefaultContentByType(type: NotificationType, subscriber: EmailSubscriber) {
  const firstName = subscriber.firstName || 'there';
  
  switch (type) {
    case 'welcome':
      return {
        subject: 'Welcome to Obsession Trigger!',
        message: `Dear ${firstName},

Welcome to Obsession Trigger! We're excited to have you join our community.

Over the next few days, you'll receive valuable relationship advice and insights that can help transform your love life.

If you have any questions, feel free to reply to this email.

Warm regards,
The Obsession Trigger Team`
      };
      
    case 'lead_magnet':
      return {
        subject: 'Your Relationship Guide is Here!',
        message: `Dear ${firstName},

Thank you for your interest in our relationship resources. Your requested guide is attached to this email.

We hope you find it valuable and insightful!

Warm regards,
The Obsession Trigger Team`
      };
      
    case 'content_update':
      return {
        subject: 'New Content: Enhancing Your Relationship',
        message: `Dear ${firstName},

We've just published new content that we think you'll find valuable for your relationship journey.

Visit our blog to check it out: https://obsessiontrigger.com/blog

Warm regards,
The Obsession Trigger Team`
      };
      
    case 'custom':
    default:
      return {
        subject: 'Update from Obsession Trigger',
        message: `Dear ${firstName},

We have an important update to share with you.

Warm regards,
The Obsession Trigger Team`
      };
  }
}

/**
 * Send message using the configured provider
 */
async function sendWithProvider(
  provider: string, 
  message: SimpleMessage,
  attachmentPath?: string
): Promise<boolean> {
  try {
    // Get provider settings
    const apiKeySetting = await storage.getSettingByKey(`${provider.toUpperCase()}_API_KEY`);
    if (!apiKeySetting?.settingValue) {
      console.error(`API key for ${provider} not found`);
      return false;
    }
    
    // Use the appropriate provider logic (simplified for reliability)
    switch (provider.toLowerCase()) {
      case 'mailerlite': 
        return await sendWithMailerLite(apiKeySetting.settingValue, message, attachmentPath);
      case 'sendgrid':
        return await sendWithSendGrid(apiKeySetting.settingValue, message, attachmentPath);
      case 'brevo':
        return await sendWithBrevo(apiKeySetting.settingValue, message, attachmentPath);
      default:
        console.error(`Provider ${provider} not supported`);
        return false;
    }
  } catch (error) {
    console.error('Error sending with provider:', error);
    return false;
  }
}

/**
 * Send with MailerLite - simplified implementation
 */
async function sendWithMailerLite(
  apiKey: string, 
  message: SimpleMessage,
  attachmentPath?: string
): Promise<boolean> {
  try {
    const response = await fetch('https://api.mailerlite.com/api/v2/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MailerLite-ApiKey': apiKey
      },
      body: JSON.stringify({
        subject: message.subject,
        from: 'info@obsessiontrigger.com',
        to: [{ email: message.to }],
        text: message.message,
        // Simple text-to-HTML conversion for clients that require HTML
        html: message.message.replace(/\n/g, '<br>')
      })
    });
    
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error('MailerLite error:', error);
    return false;
  }
}

/**
 * Send with SendGrid - simplified implementation
 */
async function sendWithSendGrid(
  apiKey: string, 
  message: SimpleMessage,
  attachmentPath?: string
): Promise<boolean> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: message.to }] }],
        from: { email: 'info@obsessiontrigger.com' },
        subject: message.subject,
        content: [
          { type: 'text/plain', value: message.message },
          { type: 'text/html', value: message.message.replace(/\n/g, '<br>') }
        ]
      })
    });
    
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error('SendGrid error:', error);
    return false;
  }
}

/**
 * Send with Brevo - simplified implementation
 */
async function sendWithBrevo(
  apiKey: string, 
  message: SimpleMessage,
  attachmentPath?: string
): Promise<boolean> {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        to: [{ email: message.to }],
        sender: { email: 'info@obsessiontrigger.com' },
        subject: message.subject,
        textContent: message.message,
        htmlContent: message.message.replace(/\n/g, '<br>')
      })
    });
    
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error('Brevo error:', error);
    return false;
  }
}

/**
 * Log notification delivery
 */
async function logNotification(
  subscriberId: number, 
  type: NotificationType, 
  success: boolean
): Promise<void> {
  try {
    await storage.logNotification({
      subscriberId,
      notificationType: type,
      status: success ? 'sent' : 'failed',
      sentAt: new Date()
    });
  } catch (error) {
    console.error('Error logging notification:', error);
  }
}

/**
 * Initialize default notification templates
 */
export async function initializeDefaultNotificationTemplates(): Promise<void> {
  try {
    // Check if the notification settings exist
    const welcomeTemplate = await storage.getNotificationTemplate('welcome');
    
    if (!welcomeTemplate) {
      // Create default welcome template
      await storage.saveNotificationTemplate({
        type: 'welcome',
        subject: 'Welcome to Obsession Trigger!',
        message: `Dear {{firstName}},

Welcome to Obsession Trigger! We're excited to have you join our community.

Over the next few days, you'll receive valuable relationship advice and insights that can help transform your love life.

If you have any questions, feel free to reply to this email.

Warm regards,
The Obsession Trigger Team`
      });
      
      // Create lead magnet template
      await storage.saveNotificationTemplate({
        type: 'lead_magnet',
        subject: 'Your Relationship Guide is Here!',
        message: `Dear {{firstName}},

Thank you for your interest in our relationship resources. Your requested guide is attached to this email.

We hope you find it valuable and insightful!

Warm regards,
The Obsession Trigger Team`
      });
      
      console.log('Default notification templates created successfully');
    }
  } catch (error) {
    console.error('Error initializing default notification templates:', error);
  }
}