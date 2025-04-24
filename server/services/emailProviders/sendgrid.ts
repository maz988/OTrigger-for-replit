/**
 * SendGrid Email Provider
 * 
 * This service handles email sending through SendGrid API
 */

import { EmailMessage } from '../emailTemplates';

/**
 * Sanitize SendGrid API key for logging (to avoid exposing the full key in logs)
 * @param apiKey SendGrid API key
 * @returns Safely redacted API key for logging
 */
export function sanitizeApiKey(apiKey: string): string {
  if (!apiKey) return '';
  if (apiKey.length <= 8) return '***';
  return apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
}

/**
 * Validate SendGrid API key format (minimal validation)
 * @param apiKey The API key to validate
 * @returns True if the key appears to be valid
 */
export function validateApiKey(apiKey: string): boolean {
  return /^SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}$/.test(apiKey);
}

/**
 * Send email using SendGrid
 * @param message Email message to send
 * @param apiKey SendGrid API key
 * @returns Success response with message ID or error
 */
export async function sendWithSendGrid(
  message: EmailMessage,
  apiKey: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Configure request to SendGrid API
    const body = {
      personalizations: [
        {
          to: [{ email: message.to }],
          subject: message.subject,
        },
      ],
      from: { email: message.from.match(/<(.+)>$/)?.[1] || message.from },
      content: [
        {
          type: 'text/plain',
          value: message.text,
        },
        {
          type: 'text/html',
          value: message.html,
        },
      ],
    };

    // Add attachments if present
    if (message.attachments && message.attachments.length > 0) {
      body['attachments'] = message.attachments.map(attachment => ({
        content: Buffer.from(attachment.path).toString('base64'),
        filename: attachment.filename,
        type: attachment.contentType,
        disposition: 'attachment'
      }));
    }

    // Add custom arguments for tracking if metadata is present
    if (message.metadata) {
      body['custom_args'] = message.metadata;
    }

    // Setup tracking settings 
    body['tracking_settings'] = {
      click_tracking: { enable: true },
      open_tracking: { enable: true }
    };

    // Send request to SendGrid API
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      console.log(`SendGrid email sent successfully to ${message.to}`);
      return {
        success: true,
        messageId: response.headers.get('X-Message-Id') || undefined,
      };
    } else {
      const errorData = await response.json();
      console.error('SendGrid API error:', errorData);
      return {
        success: false,
        error: `SendGrid error: ${response.status} - ${
          errorData.errors?.[0]?.message || response.statusText
        }`,
      };
    }
  } catch (error) {
    console.error('Error sending email with SendGrid:', error);
    return {
      success: false,
      error: `SendGrid exception: ${error.message}`,
    };
  }
}

/**
 * Test SendGrid connection with API key
 * @param apiKey The API key to test
 * @returns Success response or error
 */
export async function testConnection(apiKey: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // API key format validation
    if (!validateApiKey(apiKey)) {
      return {
        success: false,
        error: 'Invalid SendGrid API key format. It should start with "SG." followed by alphanumeric characters.'
      };
    }

    // Test API key by making a request to the SendGrid API
    // Get the first 10 emails to verify API access
    const response = await fetch('https://api.sendgrid.com/v3/stats/global?limit=1', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Successfully connected to SendGrid API!'
      };
    } else {
      const errorData = await response.json();
      console.error('SendGrid API test error:', errorData);
      return {
        success: false,
        error: `SendGrid API error: ${response.status} - ${
          errorData.errors?.[0]?.message || response.statusText
        }`
      };
    }
  } catch (error) {
    console.error('Error testing SendGrid connection:', error);
    return {
      success: false,
      error: `SendGrid connection error: ${error.message}`
    };
  }
}