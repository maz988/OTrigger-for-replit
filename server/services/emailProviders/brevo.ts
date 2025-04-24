/**
 * Brevo (formerly Sendinblue) Email Provider
 * 
 * This service handles email sending through Brevo API
 */

import { EmailMessage } from '../emailTemplates';

/**
 * Sanitize Brevo API key for logging (to avoid exposing the full key in logs)
 * @param apiKey Brevo API key
 * @returns Safely redacted API key for logging
 */
export function sanitizeApiKey(apiKey: string): string {
  if (!apiKey) return '';
  if (apiKey.length <= 8) return '***';
  return apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
}

/**
 * Validate Brevo API key format (minimal validation)
 * @param apiKey The API key to validate
 * @returns True if the key appears to be valid
 */
export function validateApiKey(apiKey: string): boolean {
  // Brevo API keys are alphanumeric, 64 characters
  // xkeysib-... format is common but not enforced by us
  return apiKey.length >= 20;
}

/**
 * Send email using Brevo
 * @param message Email message to send
 * @param apiKey Brevo API key
 * @returns Success response with message ID or error
 */
export async function sendWithBrevo(
  message: EmailMessage,
  apiKey: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Parse sender name and email from the from field
    let senderName = 'Obsession Trigger';
    let senderEmail = message.from;
    
    const fromMatch = message.from.match(/(.+?)\s*<(.+?)>/);
    if (fromMatch) {
      senderName = fromMatch[1].trim();
      senderEmail = fromMatch[2];
    }
    
    // Build Brevo email request
    const body = {
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: message.to,
          name: message.to
        }
      ],
      subject: message.subject,
      htmlContent: message.html,
      textContent: message.text
    };
    
    // Add attachments if present
    if (message.attachments && message.attachments.length > 0) {
      body['attachment'] = message.attachments.map(attachment => ({
        url: attachment.path,
        name: attachment.filename
      }));
    }
    
    // Add custom parameters for tracking if metadata is present
    if (message.metadata) {
      body['params'] = message.metadata;
    }
    
    // Send request to Brevo API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(body)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Brevo email sent successfully to ${message.to}`);
      return {
        success: true,
        messageId: data.messageId
      };
    } else {
      const errorData = await response.json();
      console.error('Brevo API error:', errorData);
      return {
        success: false,
        error: `Brevo error: ${response.status} - ${
          errorData.message || response.statusText
        }`
      };
    }
  } catch (error) {
    console.error('Error sending email with Brevo:', error);
    return {
      success: false,
      error: `Brevo exception: ${error.message}`
    };
  }
}

/**
 * Test Brevo connection with API key
 * @param apiKey The API key to test
 * @returns Success response or error
 */
export async function testConnection(apiKey: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // API key format validation
    if (!validateApiKey(apiKey)) {
      return {
        success: false,
        error: 'Invalid Brevo API key format. It should be at least 20 characters long.'
      };
    }

    // Test API key by making a request to the Brevo API
    // Get account information
    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'api-key': apiKey
      }
    });

    if (response.ok) {
      const data = await response.json();
      const accountInfo = data.plan?.[0]?.type || 'Unknown';
      const credits = data.plan?.[0]?.credits || 0;
      
      return {
        success: true,
        message: `Successfully connected to Brevo API! Account type: ${accountInfo}, Credits: ${credits}`
      };
    } else {
      const errorData = await response.json();
      console.error('Brevo API test error:', errorData);
      return {
        success: false,
        error: `Brevo API error: ${response.status} - ${
          errorData.message || response.statusText
        }`
      };
    }
  } catch (error) {
    console.error('Error testing Brevo connection:', error);
    return {
      success: false,
      error: `Brevo connection error: ${error.message}`
    };
  }
}