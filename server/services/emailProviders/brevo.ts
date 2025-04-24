import fetch from 'node-fetch';
import { EmailMessage } from '../emailDispatcher';

// Brevo API URLs
const API_BASE_URL = 'https://api.brevo.com/v3';
const SEND_EMAIL_URL = `${API_BASE_URL}/smtp/email`;
const GET_ACCOUNT_URL = `${API_BASE_URL}/account`;

/**
 * Send email using Brevo
 */
export async function sendWithBrevo(
  message: EmailMessage,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Format message for Brevo API
    const brevoMessage = {
      sender: {
        name: message.from.split('@')[0], // Extract name from email
        email: message.from
      },
      to: [{
        email: message.to,
        name: message.personalizations?.firstName
          ? `${message.personalizations.firstName} ${message.personalizations.lastName || ''}`
          : message.to.split('@')[0]
      }],
      subject: message.subject,
      htmlContent: message.html,
      textContent: message.text
    };
    
    // Add attachments if present
    if (message.attachments && message.attachments.length > 0) {
      brevoMessage.attachment = message.attachments.map(attachment => ({
        name: attachment.filename,
        url: attachment.path,
        content: null // Will be handled by url
      }));
    }
    
    // Add contact attributes for personalization
    if (message.personalizations) {
      brevoMessage.params = {
        ...message.personalizations,
        UNSUBSCRIBE: message.unsubscribeUrl
      };
    }
    
    // Send email via Brevo API
    const response = await fetch(SEND_EMAIL_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(brevoMessage)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { 
        success: false, 
        error: data.message || `Failed to send email (${response.status})` 
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Brevo error:', error);
    return { success: false, error: error.message || 'Failed to send email with Brevo' };
  }
}

/**
 * Validate Brevo API key format
 */
export function validateApiKey(apiKey: string): boolean {
  // Brevo API keys start with xkeysib- and are followed by alphanumeric chars
  return apiKey.startsWith('xkeysib-') && apiKey.length > 20;
}

/**
 * Test Brevo connection with API key
 */
export async function testConnection(apiKey: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Check API key format
    if (!validateApiKey(apiKey)) {
      return { 
        success: false, 
        error: 'Invalid Brevo API key format. It should start with "xkeysib-".' 
      };
    }
    
    // Test with a simple API call to get account info
    const response = await fetch(GET_ACCOUNT_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'api-key': apiKey
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        return { 
          success: false, 
          error: 'Invalid Brevo API key. Please check your credentials.' 
        };
      } else {
        return { 
          success: false, 
          error: data.message || 'Failed to connect to Brevo API' 
        };
      }
    }
    
    return { 
      success: true, 
      message: `Brevo API key is valid. Connected to account: ${data.firstName || ''} ${data.lastName || ''} (${data.email || 'Unknown'})` 
    };
  } catch (error) {
    console.error('Brevo test connection error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to connect to Brevo API' 
    };
  }
}