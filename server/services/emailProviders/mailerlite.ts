/**
 * MailerLite Email Provider
 * 
 * This service handles email sending through MailerLite API
 */

import { EmailMessage } from '../emailTemplates';

/**
 * Sanitize MailerLite API key for logging (to avoid exposing the full key in logs)
 * @param apiKey MailerLite API key
 * @returns Safely redacted API key for logging
 */
export function sanitizeApiKey(apiKey: string): string {
  if (!apiKey) return '';
  if (apiKey.length <= 8) return '***';
  return apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
}

/**
 * Validate MailerLite API key format (minimal validation)
 * @param apiKey The API key to validate
 * @returns True if the key appears to be valid
 */
export function validateApiKey(apiKey: string): boolean {
  // MailerLite API keys are 64 character alphanumeric strings
  return /^[a-zA-Z0-9]{64}$/.test(apiKey);
}

/**
 * Send email using MailerLite
 * @param message Email message to send
 * @param apiKey MailerLite API key
 * @returns Success response with message ID or error
 */
export async function sendWithMailerLite(
  message: EmailMessage,
  apiKey: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // First, get or create the subscriber
    const subscriberResult = await getOrCreateSubscriber(message.to, apiKey);
    
    if (!subscriberResult.success) {
      return subscriberResult;
    }
    
    // Now create a campaign for this specific email
    const subscriberId = subscriberResult.subscriberId;
    if (!subscriberId) {
      return {
        success: false,
        error: 'Failed to get subscriber ID from MailerLite'
      };
    }
    
    // Create a campaign
    const campaignResult = await createCampaign(message, apiKey);
    
    if (!campaignResult.success) {
      return campaignResult;
    }
    
    // Send the campaign
    const campaignId = campaignResult.campaignId;
    const sendResult = await sendCampaign(campaignId, [subscriberId], apiKey);
    
    return sendResult;
  } catch (error) {
    console.error('Error sending email with MailerLite:', error);
    return {
      success: false,
      error: `MailerLite exception: ${error.message}`
    };
  }
}

/**
 * Get or create subscriber in MailerLite
 */
async function getOrCreateSubscriber(
  email: string, 
  apiKey: string
): Promise<{ 
  success: boolean; 
  subscriberId?: string; 
  error?: string 
}> {
  try {
    // First, try to find the subscriber
    const searchResponse = await fetch(
      `https://connect.mailerlite.com/api/subscribers?filter[email]=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    if (searchResponse.ok) {
      const data = await searchResponse.json();
      
      if (data.data && data.data.length > 0) {
        // Subscriber exists
        return {
          success: true,
          subscriberId: data.data[0].id
        };
      }
      
      // Subscriber doesn't exist, create one
      const createResponse = await fetch(
        'https://connect.mailerlite.com/api/subscribers',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            email,
            status: 'active'
          })
        }
      );
      
      if (createResponse.ok) {
        const data = await createResponse.json();
        return {
          success: true,
          subscriberId: data.data.id
        };
      } else {
        const errorData = await createResponse.json();
        return {
          success: false,
          error: `MailerLite API error: ${createResponse.status} - ${JSON.stringify(errorData)}`
        };
      }
    } else {
      const errorData = await searchResponse.json();
      return {
        success: false,
        error: `MailerLite API error: ${searchResponse.status} - ${JSON.stringify(errorData)}`
      };
    }
  } catch (error) {
    console.error('Error getting or creating subscriber in MailerLite:', error);
    return {
      success: false,
      error: `MailerLite exception: ${error.message}`
    };
  }
}

/**
 * Create a campaign in MailerLite
 */
async function createCampaign(
  message: EmailMessage,
  apiKey: string
): Promise<{ 
  success: boolean; 
  campaignId?: string; 
  error?: string 
}> {
  try {
    // Parse from name and email from the from field
    let fromName = 'Obsession Trigger';
    let fromEmail = message.from;
    
    const fromMatch = message.from.match(/(.+?)\s*<(.+?)>/);
    if (fromMatch) {
      fromName = fromMatch[1].trim();
      fromEmail = fromMatch[2];
    }
    
    const campaignResponse = await fetch(
      'https://connect.mailerlite.com/api/campaigns',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          name: `${message.subject} (${new Date().toISOString()})`,
          type: 'regular',
          emails: [
            {
              subject: message.subject,
              from_name: fromName,
              from_email: fromEmail,
              content: {
                html: message.html
              }
            }
          ]
        })
      }
    );
    
    if (campaignResponse.ok) {
      const data = await campaignResponse.json();
      return {
        success: true,
        campaignId: data.data.id
      };
    } else {
      const errorData = await campaignResponse.json();
      return {
        success: false,
        error: `MailerLite API error: ${campaignResponse.status} - ${JSON.stringify(errorData)}`
      };
    }
  } catch (error) {
    console.error('Error creating campaign in MailerLite:', error);
    return {
      success: false,
      error: `MailerLite exception: ${error.message}`
    };
  }
}

/**
 * Send a campaign to specific subscribers
 */
async function sendCampaign(
  campaignId: string,
  subscriberIds: string[],
  apiKey: string
): Promise<{ 
  success: boolean; 
  messageId?: string; 
  error?: string 
}> {
  try {
    const sendResponse = await fetch(
      `https://connect.mailerlite.com/api/campaigns/${campaignId}/schedule`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          delivery: 'instant',
          subscriber_ids: subscriberIds
        })
      }
    );
    
    if (sendResponse.ok) {
      const data = await sendResponse.json();
      console.log(`MailerLite campaign ${campaignId} scheduled successfully`);
      return {
        success: true,
        messageId: data.data.id
      };
    } else {
      const errorData = await sendResponse.json();
      return {
        success: false,
        error: `MailerLite API error: ${sendResponse.status} - ${JSON.stringify(errorData)}`
      };
    }
  } catch (error) {
    console.error('Error sending campaign in MailerLite:', error);
    return {
      success: false,
      error: `MailerLite exception: ${error.message}`
    };
  }
}

/**
 * Test MailerLite connection with API key
 * @param apiKey The API key to test
 * @returns Success response or error
 */
export async function testConnection(apiKey: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // API key format validation
    if (!validateApiKey(apiKey)) {
      return {
        success: false,
        error: 'Invalid MailerLite API key format. It should be a 64 character alphanumeric string.'
      };
    }

    // Test API key by making a request to the MailerLite API
    const response = await fetch('https://connect.mailerlite.com/api/subscribers?limit=1', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: `Successfully connected to MailerLite API! Found ${data.meta?.total || 0} subscribers.`
      };
    } else {
      const errorData = await response.json();
      console.error('MailerLite API test error:', errorData);
      return {
        success: false,
        error: `MailerLite API error: ${response.status} - ${JSON.stringify(errorData)}`
      };
    }
  } catch (error) {
    console.error('Error testing MailerLite connection:', error);
    return {
      success: false,
      error: `MailerLite connection error: ${error.message}`
    };
  }
}