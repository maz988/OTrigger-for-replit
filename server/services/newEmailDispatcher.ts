/**
 * Email Dispatcher Service (New Version with Provider System)
 * 
 * This service handles dispatching emails through the provider system,
 * providing a flexible way to send emails through multiple providers.
 * 
 * It leverages the new provider registry system and adapters.
 */

import { EmailMessage, processTemplate } from './emailTemplates';
import { storage } from '../storage';
import { EmailSubscriber, EmailTemplate, EmailQueue, InsertEmailQueue } from '@shared/schema';
import { 
  IEmailServiceProvider, 
  getActiveProvider, 
  getActiveProviderName,
  getProvider,
  configureProvider,
  setActiveProvider
} from './emailProviders';

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
 * This configures the email provider system based on stored settings
 */
export async function initializeEmailProviders(): Promise<boolean> {
  try {
    // Get system settings
    const emailServiceSetting = await storage.getSettingByKey('EMAIL_SERVICE');
    const fromEmailSetting = await storage.getSettingByKey('EMAIL_FROM');
    const fromNameSetting = await storage.getSettingByKey('EMAIL_FROM_NAME');
    const replyToSetting = await storage.getSettingByKey('EMAIL_REPLY_TO');
    
    // Normalize the service name to lowercase to prevent case sensitivity issues
    const serviceName = (emailServiceSetting?.settingValue || 'brevo').toLowerCase();
    console.log(`Initializing email provider system with service: ${serviceName}`);
    
    // Get the service provider instance
    const provider = getProvider(serviceName);
    if (!provider) {
      console.error(`Email provider '${serviceName}' not found`);
      return false;
    }
    
    // Get the API key for this service
    let apiKey = '';
    
    switch (serviceName) {
      case 'mailerlite':
        const mailerliteKeySetting = await storage.getSettingByKey('MAILERLITE_API_KEY');
        apiKey = mailerliteKeySetting?.settingValue || process.env.MAILERLITE_API_KEY || '';
        break;
      case 'brevo':
        const brevoKeySetting = await storage.getSettingByKey('BREVO_API_KEY');
        apiKey = brevoKeySetting?.settingValue || process.env.BREVO_API_KEY || '';
        break;
      case 'sendgrid':
        const sendgridKeySetting = await storage.getSettingByKey('SENDGRID_API_KEY');
        apiKey = sendgridKeySetting?.settingValue || process.env.SENDGRID_API_KEY || '';
        break;
      default:
        // Look for a custom provider key
        const customKeySetting = await storage.getSettingByKey(`${serviceName.toUpperCase()}_API_KEY`);
        apiKey = customKeySetting?.settingValue || '';
    }
    
    if (!apiKey) {
      console.error(`No API key found for email provider '${serviceName}'`);
      return false;
    }
    
    // Configure the provider
    configureProvider(serviceName, {
      apiKey,
      defaultSenderEmail: fromEmailSetting?.settingValue || 'noreply@example.com',
      defaultSenderName: fromNameSetting?.settingValue || 'Obsession Trigger',
      ...(replyToSetting?.settingValue ? { replyTo: replyToSetting.settingValue } : {})
    });
    
    // Set this as the active provider
    setActiveProvider(serviceName);
    
    console.log(`Email provider '${serviceName}' successfully configured and set as active`);
    return true;
  } catch (error: any) {
    console.error(`Error initializing email providers: ${error.message}`);
    return false;
  }
}

/**
 * Convert a subscriber to our new provider system's format
 */
function convertToProviderSubscriber(subscriber: EmailSubscriber): any {
  return {
    email: subscriber.email,
    name: `${subscriber.firstName} ${subscriber.lastName || ''}`.trim(),
    firstName: subscriber.firstName,
    lastName: subscriber.lastName || '',
    source: subscriber.source,
    customFields: { 
      unsubscribeToken: subscriber.unsubscribeToken 
    }
  };
}

/**
 * Add a subscriber to the active email provider
 * @param subscriber The subscriber to add
 * @param listId Optional list ID to add to
 */
export async function sendSubscriberToEmailService({
  email,
  name,
  source,
  listId
}: {
  email: string;
  name: string;
  source?: string;
  listId?: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    // Make sure the provider system is initialized
    await initializeEmailProviders();
    
    // Get the active provider
    const provider = getActiveProvider();
    if (!provider) {
      return {
        success: false,
        error: 'No active email provider configured'
      };
    }
    
    // Split name into first and last (if provided)
    let firstName = name;
    let lastName = '';
    
    if (name && name.includes(' ')) {
      const nameParts = name.split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }
    
    // Debug log the details
    console.log(`DEBUG: emailDispatcher preparing to call ${provider.name} with:`);
    console.log(`DEBUG: - Email: ${email}`);
    console.log(`DEBUG: - Name: ${name}`);
    console.log(`DEBUG: - Source: ${source || 'not specified'}`);
    console.log(`DEBUG: - API Key: Present (not shown)`);
    console.log(`DEBUG: - List ID: ${listId || 'not specified'}`);
    
    // Add the subscriber using the provider system
    const result = await provider.addSubscriber({
      email,
      name,
      firstName,
      lastName,
      source,
      tags: source ? [source] : undefined
    }, listId);
    
    // Log the result for debugging
    console.log(`DEBUG: ${provider.name} integration result:`, result);
    
    // Return the result
    return {
      success: result.success,
      message: result.message,
      error: result.error
    };
  } catch (error: any) {
    console.error(`Error sending subscriber to email service: ${error.message}`);
    return {
      success: false,
      error: `Email service error: ${error.message}`
    };
  }
}

/**
 * Send an email to a recipient
 * @param message The email message to send
 */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  try {
    // Make sure the provider system is initialized
    await initializeEmailProviders();
    
    // Get the active provider
    const provider = getActiveProvider();
    if (!provider) {
      return {
        success: false,
        error: 'No active email provider configured'
      };
    }
    
    // Parse sender name and email
    let senderName = provider.getConfig().defaultSenderName || 'Obsession Trigger';
    let senderEmail = provider.getConfig().defaultSenderEmail || 'noreply@example.com';
    
    // Override with message from if specified
    if (message.from && message.from.includes('<')) {
      const fromMatch = message.from.match(/(.+?)\s*<(.+?)>/);
      if (fromMatch) {
        senderName = fromMatch[1].trim();
        senderEmail = fromMatch[2];
      }
    }
    
    // Send the email using the provider system
    const result = await provider.sendEmail(
      message.to,
      message.subject,
      message.html,
      message.text,
      {
        from: {
          name: senderName,
          email: senderEmail
        },
        attachments: message.attachments,
        customVars: message.metadata
      }
    );
    
    // Return the result
    return {
      success: result.success,
      messageId: result.emailId,
      error: result.error
    };
  } catch (error: any) {
    console.error(`Error sending email: ${error.message}`);
    return {
      success: false,
      error: `Email sending error: ${error.message}`
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
        provider: getActiveProviderName() || 'unknown',
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
  } catch (error: any) {
    console.error(`Error sending template to subscriber: ${error.message}`);
    return {
      success: false,
      error: `Template processing error: ${error.message}`
    };
  }
}

/**
 * Test connection with an email provider
 */
export async function testEmailProviderConnection(
  provider: string,
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get the provider instance
    const providerInstance = getProvider(provider.toLowerCase());
    if (!providerInstance) {
      return {
        success: false,
        message: `Email provider '${provider}' not found`
      };
    }
    
    // Configure with the test API key
    providerInstance.setConfig({ apiKey });
    
    // Test the connection
    return await providerInstance.testConnection();
  } catch (error: any) {
    console.error(`Error testing email provider connection: ${error.message}`);
    return {
      success: false,
      message: `Connection test error: ${error.message}`
    };
  }
}

/**
 * Send a test email
 */
export async function sendTestEmail(
  email: string,
  providerName?: string,
  apiKey?: string
): Promise<SendResult> {
  try {
    // Import sanitizeHtml function dynamically to avoid circular dependency
    const { sanitizeHtml } = await import('./emailTemplates');
    
    let provider: IEmailServiceProvider | null = null;
    let originalProvider: IEmailServiceProvider | null = null;
    let shouldRestore = false;
    
    // If provider name and API key are specified, use that provider temporarily
    if (providerName && apiKey) {
      provider = getProvider(providerName.toLowerCase());
      if (!provider) {
        return {
          success: false,
          error: `Email provider '${providerName}' not found`
        };
      }
      
      // Save the original provider to restore later
      originalProvider = getActiveProvider();
      shouldRestore = true;
      
      // Configure and set as active temporarily
      provider.setConfig({ apiKey });
      setActiveProvider(providerName);
    } else {
      // Otherwise, make sure the default provider is initialized
      await initializeEmailProviders();
      provider = getActiveProvider();
    }
    
    if (!provider) {
      return {
        success: false,
        error: 'No active email provider configured'
      };
    }
    
    // Create test email content
    const basicContent = `
      <h1>This is a test email</h1>
      <p>Hello Test User,</p>
      <p>This is a test email from Obsession Trigger.</p>
      <p>If you're receiving this, the email system is working correctly!</p>
      <p>Email provider: ${provider.displayName}</p>
      <p>Sent at: ${new Date().toISOString()}</p>
    `;
    
    // Send the test email
    const result = await provider.sendEmail(
      email,
      `Test Email from Obsession Trigger (${provider.displayName})`,
      sanitizeHtml(basicContent),
      `This is a test email from Obsession Trigger. If you're receiving this, the email system is working correctly!
      
Email provider: ${provider.displayName}
Sent at: ${new Date().toISOString()}`
    );
    
    // Restore the original provider if needed
    if (shouldRestore && originalProvider) {
      setActiveProvider(originalProvider.name);
    }
    
    // Return the result
    return {
      success: result.success,
      messageId: result.emailId,
      error: result.error
    };
  } catch (error: any) {
    console.error(`Error sending test email: ${error.message}`);
    return {
      success: false,
      error: `Test email error: ${error.message}`
    };
  }
}

/**
 * Process the email queue, sending pending emails
 */
export async function processEmailQueue(): Promise<{
  total: number;
  sent: number;
  failed: number;
}> {
  try {
    // Initialize providers
    await initializeEmailProviders();
    
    // Get pending emails from the queue
    const pendingEmails = await storage.getQueuedEmails('pending');
    
    if (pendingEmails.length === 0) {
      return { total: 0, sent: 0, failed: 0 };
    }
    
    console.log(`Processing ${pendingEmails.length} pending emails in queue`);
    
    let sent = 0;
    let failed = 0;
    
    // Process each email
    for (const queuedEmail of pendingEmails) {
      try {
        // Mark as processing
        await storage.updateQueuedEmailStatus(queuedEmail.id, 'processing');
        
        // Get the subscriber and template
        const subscriber = await storage.getSubscriber(queuedEmail.subscriberId);
        const template = await storage.getEmailTemplate(queuedEmail.templateId);
        
        if (!subscriber || !template) {
          console.error(`Missing subscriber or template for queue ID ${queuedEmail.id}`);
          await storage.updateQueuedEmailStatus(queuedEmail.id, 'failed', 'Missing subscriber or template');
          failed++;
          continue;
        }
        
        // Send the email
        const result = await sendTemplateToSubscriber(template, subscriber);
        
        if (result.success) {
          await storage.updateQueuedEmailStatus(queuedEmail.id, 'completed');
          sent++;
        } else {
          await storage.updateQueuedEmailStatus(queuedEmail.id, 'failed', result.error);
          failed++;
        }
      } catch (queueError: any) {
        console.error(`Error processing queued email ${queuedEmail.id}: ${queueError.message}`);
        await storage.updateQueuedEmailStatus(queuedEmail.id, 'failed', queueError.message);
        failed++;
      }
    }
    
    return { total: pendingEmails.length, sent, failed };
  } catch (error: any) {
    console.error(`Error processing email queue: ${error.message}`);
    return { total: 0, sent: 0, failed: 0 };
  }
}