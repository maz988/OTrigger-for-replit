import { LeadMagnetFormData } from '@/components/LeadMagnetForm';

// Email Service Provider options
export type EmailProvider = 'mailerlite' | 'brevo' | 'convertkit' | 'local';

// Configuration for email services
interface EmailServiceConfig {
  provider: EmailProvider;
  apiKey?: string;
  listId?: string;
  formId?: string;
  endpoint?: string;
}

// Result object returned from signup
interface SignupResult {
  success: boolean;
  downloadLink?: string;
  error?: string;
}

// Full subscriber data with source tracking
export interface SubscriberData extends LeadMagnetFormData {
  source: string;
  leadMagnetName: string;
  timestamp: string;
  tags?: string[];
}

// Default configuration - can be updated with user's actual API keys
let emailServiceConfig: EmailServiceConfig = {
  provider: 'local', // Default to local storage if no API key is provided
};

/**
 * Configure the email service provider
 */
export function configureEmailService(config: EmailServiceConfig) {
  emailServiceConfig = {
    ...emailServiceConfig,
    ...config,
  };
}

/**
 * Sign up a subscriber to the newsletter
 */
export async function signupForNewsletter(
  data: SubscriberData
): Promise<SignupResult> {
  try {
    // First save locally for backup
    saveSubscriberLocally(data);
    
    // If no provider or local only, return success
    if (!emailServiceConfig.apiKey || emailServiceConfig.provider === 'local') {
      console.log('Using local storage only for subscriber:', data.email);
      return {
        success: true,
        downloadLink: getLeadMagnetLink(data.leadMagnetName),
      };
    }
    
    // Otherwise, attempt to submit to the configured provider
    switch (emailServiceConfig.provider) {
      case 'mailerlite':
        return await submitToMailerLite(data);
      case 'brevo':
        return await submitToBrevo(data);
      case 'convertkit':
        return await submitToConvertKit(data);
      default:
        return {
          success: true,
          downloadLink: getLeadMagnetLink(data.leadMagnetName),
        };
    }
  } catch (error) {
    console.error('Newsletter signup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

/**
 * Save subscriber data to local storage as backup
 */
function saveSubscriberLocally(data: SubscriberData): void {
  try {
    // Get existing subscribers or initialize empty array
    const existingData = localStorage.getItem('subscribers');
    const subscribers = existingData ? JSON.parse(existingData) : [];
    
    // Add new subscriber
    subscribers.push({
      ...data,
      storedAt: new Date().toISOString(),
    });
    
    // Save back to localStorage
    localStorage.setItem('subscribers', JSON.stringify(subscribers));
  } catch (error) {
    console.error('Error saving subscriber locally:', error);
  }
}

/**
 * Get the lead magnet download link based on name
 */
function getLeadMagnetLink(leadMagnetName: string): string {
  // Map of lead magnet names to their file paths
  const leadMagnetMap: Record<string, string> = {
    'Ultimate Relationship Guide': '/leadmagnets/relationship-guide.pdf',
    'Hero Instinct Secrets': '/leadmagnets/hero-instinct-secrets.pdf',
    'Communication Cheat Sheet': '/leadmagnets/communication-cheatsheet.pdf',
    'Attraction Triggers': '/leadmagnets/attraction-triggers.pdf',
    'Emotional Intimacy Guide': '/leadmagnets/emotional-intimacy.pdf',
  };
  
  // Return the mapped path or a default
  return leadMagnetMap[leadMagnetName] || '/leadmagnets/relationship-guide.pdf';
}

/**
 * Submit subscriber to MailerLite
 */
async function submitToMailerLite(data: SubscriberData): Promise<SignupResult> {
  try {
    if (!emailServiceConfig.apiKey || !emailServiceConfig.listId) {
      throw new Error('MailerLite API key or list ID not configured');
    }
    
    const endpoint = 'https://connect.mailerlite.com/api/subscribers';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${emailServiceConfig.apiKey}`,
      },
      body: JSON.stringify({
        email: data.email,
        fields: {
          name: data.firstName,
          signup_source: data.source,
          lead_magnet: data.leadMagnetName,
        },
        groups: [emailServiceConfig.listId],
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to subscribe to MailerLite');
    }
    
    return {
      success: true,
      downloadLink: getLeadMagnetLink(data.leadMagnetName),
    };
  } catch (error) {
    console.error('MailerLite API error:', error);
    throw error;
  }
}

/**
 * Submit subscriber to Brevo (formerly Sendinblue)
 */
async function submitToBrevo(data: SubscriberData): Promise<SignupResult> {
  try {
    if (!emailServiceConfig.apiKey || !emailServiceConfig.listId) {
      throw new Error('Brevo API key or list ID not configured');
    }
    
    const endpoint = 'https://api.brevo.com/v3/contacts';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': emailServiceConfig.apiKey,
      },
      body: JSON.stringify({
        email: data.email,
        attributes: {
          FIRSTNAME: data.firstName,
          SIGNUP_SOURCE: data.source,
          LEAD_MAGNET: data.leadMagnetName,
        },
        listIds: [Number(emailServiceConfig.listId)],
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to subscribe to Brevo');
    }
    
    return {
      success: true,
      downloadLink: getLeadMagnetLink(data.leadMagnetName),
    };
  } catch (error) {
    console.error('Brevo API error:', error);
    throw error;
  }
}

/**
 * Submit subscriber to ConvertKit
 */
async function submitToConvertKit(data: SubscriberData): Promise<SignupResult> {
  try {
    if (!emailServiceConfig.apiKey || !emailServiceConfig.formId) {
      throw new Error('ConvertKit API key or form ID not configured');
    }
    
    const endpoint = `https://api.convertkit.com/v3/forms/${emailServiceConfig.formId}/subscribe`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: emailServiceConfig.apiKey,
        email: data.email,
        first_name: data.firstName,
        fields: {
          signup_source: data.source,
          lead_magnet: data.leadMagnetName,
        },
        tags: data.tags || [],
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to subscribe to ConvertKit');
    }
    
    return {
      success: true,
      downloadLink: getLeadMagnetLink(data.leadMagnetName),
    };
  } catch (error) {
    console.error('ConvertKit API error:', error);
    throw error;
  }
}

/**
 * Export a CSV of all locally stored subscribers
 */
export function exportSubscribers(): string {
  try {
    const subscribers = localStorage.getItem('subscribers');
    if (!subscribers) {
      return '';
    }
    
    const data = JSON.parse(subscribers) as SubscriberData[];
    if (!data.length) {
      return '';
    }
    
    // Create CSV header
    const headers = ['First Name', 'Email', 'Source', 'Lead Magnet', 'Timestamp'];
    
    // Create CSV rows
    const rows = data.map(sub => [
      sub.firstName,
      sub.email,
      sub.source,
      sub.leadMagnetName,
      sub.timestamp
    ]);
    
    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  } catch (error) {
    console.error('Error exporting subscribers:', error);
    return '';
  }
}