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

/**
 * Add a new subscriber to Brevo
 * @param email Subscriber email
 * @param name Subscriber name
 * @param source Source of subscription (e.g., 'quiz', 'blog')
 * @param apiKey Brevo API key
 * @returns Success response or error
 */
export async function sendToBrevo(
  email: string,
  name: string,
  source?: string,
  apiKey?: string,
  listId?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Validate API key if provided
    if (!apiKey) {
      return {
        success: false,
        error: 'Brevo API key is required'
      };
    }
    
    if (!validateApiKey(apiKey)) {
      return {
        success: false,
        error: 'Invalid Brevo API key format'
      };
    }
    
    // Split name into first and last name if possible
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    
    // Create subscriber attributes
    const attributes: Record<string, any> = {
      FIRSTNAME: firstName,
      LASTNAME: lastName
    };
    
    // Add source as a custom attribute if provided
    if (source) {
      attributes.SOURCE = source;
    }
    
    // Create subscriber in Brevo
    const contactData = {
      email,
      attributes,
      updateEnabled: true // Update if contact already exists
    };
    
    // Log if a list ID is provided
    if (listId) {
      console.log(`Adding subscriber to Brevo list ID: ${listId}`);
    } else {
      console.log('No list ID provided for Brevo. Contact will be added but not assigned to a list.');
    }
    
    // Use Brevo Contacts API to add or update contact
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(contactData)
    });
    
    if (response.ok) {
      console.log(`Brevo contact added/updated successfully: ${email}`);
      
      // If listId is provided, add the contact to the specified list
      if (listId) {
        try {
          console.log(`Adding contact ${email} to Brevo list ID ${listId}`);
          
          // Add contact to list
          const listResponse = await fetch(`https://api.brevo.com/v3/contacts/lists/${listId}/contacts/add`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'api-key': apiKey
            },
            body: JSON.stringify({
              emails: [email]
            })
          });
          
          if (listResponse.ok) {
            console.log(`Successfully added ${email} to Brevo list ID ${listId}`);
          } else {
            const listError = await listResponse.json();
            console.error(`Error adding contact to Brevo list: ${listError.message || listResponse.statusText}`);
          }
        } catch (listError) {
          console.error(`Exception adding contact to Brevo list: ${listError.message}`);
        }
      }
      
      return {
        success: true,
        message: `Subscriber successfully added to Brevo: ${name} (${email})`
      };
    } else {
      const errorData = await response.json();
      
      // Special case: If the contact already exists, this is not an error for us
      if (response.status === 400 && errorData?.message?.includes('Contact already exist')) {
        console.log(`Contact already exists in Brevo: ${email}. This is not an error.`);
        
        // If listId is provided, add the existing contact to the specified list
        if (listId) {
          try {
            console.log(`Adding existing contact ${email} to Brevo list ID ${listId}`);
            
            // Add contact to list
            const listResponse = await fetch(`https://api.brevo.com/v3/contacts/lists/${listId}/contacts/add`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'api-key': apiKey
              },
              body: JSON.stringify({
                emails: [email]
              })
            });
            
            if (listResponse.ok) {
              console.log(`Successfully added existing contact ${email} to Brevo list ID ${listId}`);
            } else {
              const listError = await listResponse.json();
              console.error(`Error adding existing contact to Brevo list: ${listError.message || listResponse.statusText}`);
            }
          } catch (listError) {
            console.error(`Exception adding existing contact to Brevo list: ${listError.message}`);
          }
        }
        
        return {
          success: true,
          message: `Subscriber already exists in Brevo: ${name} (${email})`
        };
      }
      
      console.error('Brevo API error:', errorData);
      return {
        success: false,
        error: `Brevo error: ${response.status} - ${
          errorData.message || response.statusText
        }`
      };
    }
  } catch (error) {
    console.error('Error adding subscriber to Brevo:', error);
    return {
      success: false,
      error: `Brevo exception: ${error.message}`
    };
  }
}