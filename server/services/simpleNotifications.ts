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

// Optional custom settings that can override template defaults
export interface NotificationCustomization {
  subject?: string;
  message?: string;
  metadata?: Record<string, any>;
}

/**
 * Processes template variables in a string
 * Much simpler than the complex HTML processing in the old system
 */
function processTemplateVariables(text: string, subscriber: EmailSubscriber): string {
  return text
    .replace(/{{firstName}}/g, subscriber.firstName || '')
    .replace(/{{lastName}}/g, subscriber.lastName || '')
    .replace(/{{email}}/g, subscriber.email || '')
    .replace(/{{unsubscribeToken}}/g, subscriber.unsubscribeToken || '');
}

/**
 * Main function to send a notification to a subscriber
 */
export async function sendNotification(
  subscriber: EmailSubscriber,
  type: NotificationType,
  customization: NotificationCustomization = {}
): Promise<boolean> {
  try {
    // Find the template for this notification type
    const template = await storage.getNotificationTemplateByType(type);
    
    if (!template || !template.isActive) {
      console.error(`No active template found for notification type: ${type}`);
      return false;
    }
    
    // Prepare notification content, with custom overrides if provided
    const subject = customization.subject || template.subject;
    const message = customization.message || template.message;
    const metadata = customization.metadata || {};
    
    // Process template variables
    const processedSubject = processTemplateVariables(subject, subscriber);
    const processedMessage = processTemplateVariables(message, subscriber);
    
    // Prepare the simple message
    const simpleMessage: SimpleMessage = {
      to: subscriber.email,
      subject: processedSubject,
      message: processedMessage,
      metadata
    };
    
    // Send the notification (in a production system, this would connect to an email API)
    const success = await deliverNotification(simpleMessage);
    
    // Log the notification
    await storage.logNotification({
      subscriberId: subscriber.id,
      notificationType: type,
      status: success ? 'sent' : 'failed',
      sentAt: new Date(),
      metadata
    });
    
    return success;
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // Log the failure
    try {
      await storage.logNotification({
        subscriberId: subscriber.id,
        notificationType: type,
        status: 'failed',
        sentAt: new Date(),
        metadata: { error: (error as Error).message }
      });
    } catch (logError) {
      console.error('Failed to log notification failure:', logError);
    }
    
    return false;
  }
}

/**
 * Simple delivery function (to be enhanced with actual email sending)
 * In a real system, this would connect to a proper email delivery service
 */
async function deliverNotification(message: SimpleMessage): Promise<boolean> {
  try {
    // In a production system, we'd connect to an email delivery API here
    // For now, we just simulate successful delivery
    
    // For testing/development logging
    console.log('=== NOTIFICATION DELIVERED ===');
    console.log(`To: ${message.to}`);
    console.log(`Subject: ${message.subject}`);
    console.log(`Message: ${message.message}`);
    console.log('============================');
    
    // In a production app, we'd return the result from the actual email API
    return true;
  } catch (error) {
    console.error('Error delivering notification:', error);
    return false;
  }
}

/**
 * Helper function to send a welcome notification
 */
export async function sendWelcomeNotification(subscriber: EmailSubscriber): Promise<boolean> {
  return sendNotification(subscriber, 'welcome');
}

/**
 * Helper function to send a lead magnet notification
 */
export async function sendLeadMagnetNotification(
  subscriber: EmailSubscriber, 
  leadMagnetInfo: { title: string; downloadUrl: string }
): Promise<boolean> {
  return sendNotification(subscriber, 'lead_magnet', {
    metadata: leadMagnetInfo
  });
}

/**
 * Helper function to send a content update notification
 */
export async function sendContentUpdateNotification(
  subscriber: EmailSubscriber,
  contentInfo: { title: string; url: string }
): Promise<boolean> {
  return sendNotification(subscriber, 'content_update', {
    metadata: contentInfo
  });
}

/**
 * Send a custom notification
 */
export async function sendCustomNotification(
  subscriber: EmailSubscriber,
  subject: string,
  message: string
): Promise<boolean> {
  return sendNotification(subscriber, 'custom', {
    subject,
    message
  });
}

/**
 * Bulk send a notification to multiple subscribers
 * Returns array of results: [subscriberId, success]
 */
export async function bulkSendNotification(
  subscriberIds: number[],
  type: NotificationType,
  customization: NotificationCustomization = {}
): Promise<Array<[number, boolean]>> {
  const results: Array<[number, boolean]> = [];
  
  for (const id of subscriberIds) {
    const subscriber = await storage.getSubscriberById(id);
    
    if (!subscriber) {
      results.push([id, false]);
      continue;
    }
    
    const success = await sendNotification(subscriber, type, customization);
    results.push([id, success]);
  }
  
  return results;
}