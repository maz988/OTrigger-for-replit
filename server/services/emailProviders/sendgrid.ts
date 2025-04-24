import sgMail from '@sendgrid/mail';
import { EmailMessage } from '../emailDispatcher';

/**
 * Create SendGrid transporter with API key
 */
export function createTransporter(apiKey: string) {
  sgMail.setApiKey(apiKey);
  return sgMail;
}

/**
 * Send email using SendGrid
 */
export async function sendWithSendGrid(
  message: EmailMessage, 
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Set API key
    sgMail.setApiKey(apiKey);
    
    // Format message for SendGrid
    const sgMessage = {
      to: message.to,
      from: message.from,
      subject: message.subject,
      text: message.text,
      html: message.html,
    };
    
    // Add attachments if present
    if (message.attachments && message.attachments.length > 0) {
      sgMessage.attachments = message.attachments.map(attachment => ({
        filename: attachment.filename,
        content: attachment.path, // SendGrid can handle file paths
        contentType: attachment.contentType,
        disposition: 'attachment'
      }));
    }
    
    // Add custom arguments for tracking
    if (message.personalizations) {
      sgMessage.customArgs = {
        ...message.personalizations
      };
    }
    
    // Add unsubscribe link in tracking settings
    if (message.unsubscribeUrl) {
      sgMessage.trackingSettings = {
        subscription_tracking: {
          enable: true,
          substitution_tag: "{{unsubscribeUrl}}",
          url: message.unsubscribeUrl
        }
      };
    }
    
    // Send email
    await sgMail.send(sgMessage);
    
    return { success: true };
  } catch (error) {
    console.error('SendGrid error:', error);
    return { success: false, error: error.message || 'Failed to send email with SendGrid' };
  }
}

/**
 * Validate SendGrid API key format
 */
export function validateApiKey(apiKey: string): boolean {
  // SendGrid API keys start with SG. and have a specific length
  return apiKey.startsWith('SG.') && apiKey.length > 40;
}

/**
 * Test SendGrid connection with API key
 */
export async function testConnection(apiKey: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Check API key format
    if (!validateApiKey(apiKey)) {
      return { 
        success: false, 
        error: 'Invalid SendGrid API key format. It should start with "SG."' 
      };
    }
    
    // Set API key
    sgMail.setApiKey(apiKey);
    
    // Test with a simple operation that doesn't send an email
    // We'll validate the API key by checking scopes (requires API key)
    // This is a workaround since SendGrid doesn't have a simple validation endpoint
    
    // Create a test message (but don't send it)
    const testMessage = {
      to: 'test@example.com',
      from: 'test@example.com',
      subject: 'SendGrid API Test',
      text: 'Testing SendGrid API key validation',
      mail_settings: {
        sandbox_mode: {
          enable: true // This prevents the email from actually being sent
        }
      }
    };
    
    // Attempt to validate the message (will throw if API key is invalid)
    await sgMail.send(testMessage as any);
    
    return { 
      success: true, 
      message: 'SendGrid API key is valid.' 
    };
  } catch (error) {
    // Check for specific error codes
    if (error.code === 401) {
      return { 
        success: false, 
        error: 'Invalid SendGrid API key. Please check your credentials.' 
      };
    } else if (error.code === 403) {
      return { 
        success: false, 
        error: 'SendGrid API key does not have permission to send emails.' 
      };
    }
    
    console.error('SendGrid test connection error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to connect to SendGrid API' 
    };
  }
}