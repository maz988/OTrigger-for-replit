import fetch from 'node-fetch';
import { EmailMessage } from '../emailDispatcher';

// MailerLite API URLs
const API_BASE_URL = 'https://api.mailerlite.com/api/v2';
const SUBSCRIBERS_URL = `${API_BASE_URL}/subscribers`;
const CAMPAIGNS_URL = `${API_BASE_URL}/campaigns`;

/**
 * Send email using MailerLite
 */
export async function sendWithMailerLite(
  message: EmailMessage,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, check if subscriber exists, or create one
    const subscriber = await getOrCreateSubscriber(
      message.to,
      message.personalizations?.firstName || '',
      message.personalizations?.lastName || '',
      apiKey
    );
    
    if (!subscriber.success) {
      return { success: false, error: subscriber.error };
    }
    
    // Create a campaign to send the email
    const campaign = await createCampaign(
      message.subject,
      message.from,
      message.html,
      apiKey
    );
    
    if (!campaign.success) {
      return { success: false, error: campaign.error };
    }
    
    // Send the campaign to the specific subscriber
    const result = await sendCampaign(
      campaign.campaignId,
      [message.to],
      apiKey
    );
    
    return result;
  } catch (error) {
    console.error('MailerLite error:', error);
    return { success: false, error: error.message || 'Failed to send email with MailerLite' };
  }
}

/**
 * Get or create subscriber in MailerLite
 */
async function getOrCreateSubscriber(
  email: string,
  firstName: string,
  lastName: string,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(SUBSCRIBERS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MailerLite-ApiKey': apiKey
      },
      body: JSON.stringify({
        email,
        name: firstName,
        fields: {
          last_name: lastName
        },
        resubscribe: true
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create subscriber' };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a campaign in MailerLite
 */
async function createCampaign(
  subject: string,
  from: string,
  html: string,
  apiKey: string
): Promise<{ success: boolean; campaignId?: number; error?: string }> {
  try {
    const response = await fetch(CAMPAIGNS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MailerLite-ApiKey': apiKey
      },
      body: JSON.stringify({
        subject,
        from: from,
        type: 'regular',
        html
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create campaign' };
    }
    
    return { success: true, campaignId: data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send a campaign to specific subscribers
 */
async function sendCampaign(
  campaignId: number,
  emails: string[],
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${CAMPAIGNS_URL}/${campaignId}/actions/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MailerLite-ApiKey': apiKey
      },
      body: JSON.stringify({
        filter: {
          type: 'email',
          emails
        }
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to send campaign' };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Validate MailerLite API key format
 */
export function validateApiKey(apiKey: string): boolean {
  // MailerLite API keys are alphanumeric and have a specific length
  const apiKeyRegex = /^[a-zA-Z0-9]{32}$/;
  return apiKeyRegex.test(apiKey);
}

/**
 * Test MailerLite connection with API key
 */
export async function testConnection(apiKey: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Check API key format
    if (!validateApiKey(apiKey)) {
      return { 
        success: false, 
        error: 'Invalid MailerLite API key format. It should be a 32-character alphanumeric string.' 
      };
    }
    
    // Test with a simple API call to get account info
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      headers: {
        'X-MailerLite-ApiKey': apiKey
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        return { 
          success: false, 
          error: 'Invalid MailerLite API key. Please check your credentials.' 
        };
      } else {
        return { 
          success: false, 
          error: data.error || 'Failed to connect to MailerLite API' 
        };
      }
    }
    
    return { 
      success: true, 
      message: `MailerLite API key is valid. Connected to account: ${data.account.company || 'Unknown'}` 
    };
  } catch (error) {
    console.error('MailerLite test connection error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to connect to MailerLite API' 
    };
  }
}