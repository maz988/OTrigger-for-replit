import { 
  BaseEmailServiceProvider, 
  EmailProviderConfig, 
  EmailSubscriber, 
  SubscriberResponse, 
  ListResponse, 
  EmailResponse 
} from '../interfaces';

/**
 * ConvertKit Email Service Provider Implementation
 */
export class ConvertKitProvider extends BaseEmailServiceProvider {
  readonly name = 'convertkit';
  readonly displayName = 'ConvertKit';
  readonly description = 'ConvertKit email marketing platform for creators';
  readonly iconUrl = '/images/providers/convertkit-logo.svg';
  readonly configFields = [
    {
      name: 'apiKey',
      displayName: 'API Key',
      type: 'string' as const,
      required: true,
      secret: true,
      description: 'ConvertKit API key from your account settings'
    },
    {
      name: 'apiSecret',
      displayName: 'API Secret',
      type: 'string' as const,
      required: true,
      secret: true,
      description: 'ConvertKit API secret for sending emails and accessing private data'
    },
    {
      name: 'defaultSenderEmail',
      displayName: 'Default Sender Email',
      type: 'string' as const,
      required: false,
      description: 'Default email address to use as the sender'
    },
    {
      name: 'defaultSenderName',
      displayName: 'Default Sender Name',
      type: 'string' as const,
      required: false,
      description: 'Default name to use as the sender'
    },
    {
      name: 'defaultFormId',
      displayName: 'Default Form ID',
      type: 'string' as const,
      required: false,
      description: 'Default form ID to add subscribers to if none specified'
    },
    {
      name: 'defaultTagId',
      displayName: 'Default Tag ID',
      type: 'string' as const,
      required: false,
      description: 'Default tag ID to add to subscribers if none specified'
    }
  ];

  constructor(config?: EmailProviderConfig) {
    super();
    if (config) {
      this.setConfig(config);
    }
  }

  /**
   * Validate API key format (minimal validation)
   * @param apiKey The API key to validate
   * @returns True if the key appears to be valid
   */
  private validateApiKey(apiKey: string): boolean {
    return typeof apiKey === 'string' && apiKey.length > 5;
  }

  /**
   * Test connection to ConvertKit API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const apiKey = this.config.apiKey;
      
      // API key format validation
      if (!this.validateApiKey(apiKey)) {
        return {
          success: false,
          message: 'Invalid ConvertKit API key format.'
        };
      }

      // Test API key by making a request to the ConvertKit API
      const response = await fetch(`https://api.convertkit.com/v3/account?api_key=${apiKey}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Successfully connected to ConvertKit API for ${data.name || 'your account'}!`
        };
      } else {
        let errorMessage = `ConvertKit error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `ConvertKit error: ${response.status} - ${
            errorData.error || errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        console.error('ConvertKit API test error:', errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Error testing ConvertKit connection:', error);
      return {
        success: false,
        message: `ConvertKit connection error: ${error.message}`
      };
    }
  }

  /**
   * Add a subscriber to ConvertKit
   * @param subscriber The subscriber info to add
   * @param listId Optional form ID to add the subscriber to
   */
  async addSubscriber(
    subscriber: EmailSubscriber,
    listId?: string
  ): Promise<SubscriberResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      // Validate API key
      if (!this.validateApiKey(apiKey)) {
        return {
          success: false,
          message: 'Invalid ConvertKit API key format',
          error: 'Invalid API key'
        };
      }
      
      // Get target form ID (ConvertKit uses forms instead of lists)
      const targetFormId = listId || this.config.defaultFormId;
      
      if (!targetFormId) {
        return {
          success: false,
          message: 'No form ID provided and no default form ID configured',
          error: 'Missing form ID'
        };
      }
      
      // Create subscriber data
      const subscriberData: any = {
        email: subscriber.email,
        first_name: subscriber.firstName || '',
        fields: {}
      };
      
      // If first name isn't provided but name is, split it
      if (!subscriberData.first_name && subscriber.name) {
        const nameParts = subscriber.name.split(' ');
        subscriberData.first_name = nameParts[0] || '';
        
        // Set last name if available
        if (nameParts.length > 1) {
          subscriberData.fields.last_name = nameParts.slice(1).join(' ');
        }
      } else if (subscriber.lastName) {
        // Set last name if provided
        subscriberData.fields.last_name = subscriber.lastName;
      }
      
      // Add source if available
      if (subscriber.source) {
        subscriberData.fields.source = subscriber.source;
      }
      
      // Add custom fields
      if (subscriber.customFields) {
        Object.entries(subscriber.customFields).forEach(([key, value]) => {
          subscriberData.fields[key] = value;
        });
      }
      
      // Add the subscriber to the form
      const response = await fetch(`https://api.convertkit.com/v3/forms/${targetFormId}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          ...subscriberData
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`ConvertKit contact added successfully: ${subscriber.email}`, data);
        
        // If tags are provided, add them
        if (subscriber.tags && subscriber.tags.length > 0) {
          await this.addTagsToSubscriber(data.subscription.subscriber.id, subscriber.tags);
        } else if (this.config.defaultTagId) {
          // Add default tag if configured
          await this.addTagsToSubscriber(data.subscription.subscriber.id, [this.config.defaultTagId]);
        }
        
        return {
          success: true,
          message: `Subscriber successfully added to ConvertKit: ${subscriber.email}`,
          subscriberId: data.subscription.subscriber.id?.toString()
        };
      } else {
        let errorMessage = `ConvertKit error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `ConvertKit error: ${response.status} - ${
            errorData.error || errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        console.error('ConvertKit API error:', errorMessage);
        return {
          success: false,
          message: `Failed to add subscriber to ConvertKit`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Error adding subscriber to ConvertKit:', error);
      return {
        success: false,
        message: `Failed to add subscriber to ConvertKit`,
        error: `ConvertKit exception: ${error.message}`
      };
    }
  }

  /**
   * Add tags to a subscriber
   * @param subscriberId Subscriber ID
   * @param tags Array of tag IDs to add
   */
  private async addTagsToSubscriber(subscriberId: string, tags: string[]): Promise<boolean> {
    try {
      const apiKey = this.config.apiKey;
      
      // Process each tag
      for (const tag of tags) {
        const response = await fetch(`https://api.convertkit.com/v3/tags/${tag}/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            api_key: apiKey,
            subscriber_id: subscriberId
          })
        });
        
        if (!response.ok) {
          console.warn(`Failed to add tag ${tag} to subscriber ${subscriberId}:`, await response.text());
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error adding tags to subscriber:', error);
      return false;
    }
  }

  /**
   * Find a subscriber in ConvertKit by email
   * @param email Email to search for
   * @returns Subscriber data if found, null otherwise
   */
  private async findSubscriber(email: string): Promise<any | null> {
    try {
      const apiSecret = this.config.apiSecret;
      
      // ConvertKit requires API secret to search for subscribers
      if (!apiSecret) {
        console.error('API secret is required to search for subscribers in ConvertKit');
        return null;
      }
      
      const response = await fetch(`https://api.convertkit.com/v3/subscribers?api_secret=${apiSecret}&email_address=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.subscribers && data.subscribers.length > 0) {
          // Return first matching subscriber
          return data.subscribers[0];
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding subscriber in ConvertKit:', error);
      return null;
    }
  }

  /**
   * Remove a subscriber from ConvertKit
   * @param email The email of the subscriber to remove
   * @param listId Optional list ID (unused in ConvertKit - we unsubscribe from all)
   */
  async removeSubscriber(
    email: string,
    listId?: string
  ): Promise<SubscriberResponse> {
    try {
      const apiSecret = this.config.apiSecret;
      
      // ConvertKit requires API secret to unsubscribe
      if (!apiSecret) {
        return {
          success: false,
          message: 'API secret is required to unsubscribe from ConvertKit',
          error: 'Missing API secret'
        };
      }
      
      // Find the subscriber by email
      const subscriber = await this.findSubscriber(email);
      
      if (!subscriber) {
        // Subscriber not found - consider it a success for idempotence
        return {
          success: true,
          message: `Subscriber not found in ConvertKit: ${email}`
        };
      }
      
      // Unsubscribe the subscriber
      const response = await fetch(`https://api.convertkit.com/v3/unsubscribe`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          api_secret: apiSecret,
          email: email
        })
      });
      
      if (response.ok) {
        return {
          success: true,
          message: `Subscriber successfully unsubscribed from ConvertKit: ${email}`
        };
      } else {
        let errorMessage = `ConvertKit error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `ConvertKit error: ${response.status} - ${
            errorData.error || errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to unsubscribe from ConvertKit`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to remove subscriber from ConvertKit`,
        error: `ConvertKit exception: ${error.message}`
      };
    }
  }

  /**
   * Update a subscriber in ConvertKit
   * @param subscriber The updated subscriber info
   * @param listId Optional list ID (unused in ConvertKit updates)
   */
  async updateSubscriber(
    subscriber: EmailSubscriber,
    listId?: string
  ): Promise<SubscriberResponse> {
    try {
      const apiSecret = this.config.apiSecret;
      
      // ConvertKit requires API secret to update subscribers
      if (!apiSecret) {
        return {
          success: false,
          message: 'API secret is required to update subscribers in ConvertKit',
          error: 'Missing API secret'
        };
      }
      
      // Find the subscriber by email
      const existingSubscriber = await this.findSubscriber(subscriber.email);
      
      if (!existingSubscriber) {
        // Subscriber not found, create a new one
        return this.addSubscriber(subscriber, listId);
      }
      
      // Create update data
      const updateData: any = {
        email_address: subscriber.email,
        first_name: subscriber.firstName || '',
        fields: {}
      };
      
      // If first name isn't provided but name is, split it
      if (!updateData.first_name && subscriber.name) {
        const nameParts = subscriber.name.split(' ');
        updateData.first_name = nameParts[0] || '';
        
        // Set last name if available
        if (nameParts.length > 1) {
          updateData.fields.last_name = nameParts.slice(1).join(' ');
        }
      } else if (subscriber.lastName) {
        // Set last name if provided
        updateData.fields.last_name = subscriber.lastName;
      }
      
      // Add custom fields
      if (subscriber.customFields) {
        Object.entries(subscriber.customFields).forEach(([key, value]) => {
          updateData.fields[key] = value;
        });
      }
      
      // Update the subscriber
      const response = await fetch(`https://api.convertkit.com/v3/subscribers/${existingSubscriber.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          api_secret: apiSecret,
          ...updateData
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // If tags are provided, add them
        if (subscriber.tags && subscriber.tags.length > 0) {
          await this.addTagsToSubscriber(existingSubscriber.id, subscriber.tags);
        }
        
        return {
          success: true,
          message: `Subscriber successfully updated in ConvertKit: ${subscriber.email}`,
          subscriberId: existingSubscriber.id?.toString()
        };
      } else {
        let errorMessage = `ConvertKit error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `ConvertKit error: ${response.status} - ${
            errorData.error || errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        console.error('ConvertKit API error:', errorMessage);
        return {
          success: false,
          message: `Failed to update subscriber in ConvertKit`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Error updating subscriber in ConvertKit:', error);
      return {
        success: false,
        message: `Failed to update subscriber in ConvertKit`,
        error: `ConvertKit exception: ${error.message}`
      };
    }
  }

  /**
   * Get all forms from ConvertKit
   * In ConvertKit, forms are similar to lists in other providers
   */
  async getLists(): Promise<ListResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      const response = await fetch(`https://api.convertkit.com/v3/forms?api_key=${apiKey}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        return {
          success: true,
          message: `Retrieved ${data.forms?.length || 0} forms from ConvertKit`,
          listInfo: data.forms
        };
      } else {
        let errorMessage = `ConvertKit error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `ConvertKit error: ${response.status} - ${
            errorData.error || errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to retrieve forms from ConvertKit`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to retrieve forms from ConvertKit`,
        error: `ConvertKit exception: ${error.message}`
      };
    }
  }

  /**
   * Get a specific form from ConvertKit
   * @param listId The ID of the form to retrieve
   */
  async getList(listId: string): Promise<ListResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      const response = await fetch(`https://api.convertkit.com/v3/forms/${listId}?api_key=${apiKey}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        return {
          success: true,
          message: `Retrieved form ${listId} from ConvertKit`,
          listId: listId,
          listInfo: data.form
        };
      } else {
        let errorMessage = `ConvertKit error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `ConvertKit error: ${response.status} - ${
            errorData.error || errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to retrieve form ${listId} from ConvertKit`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to retrieve form ${listId} from ConvertKit`,
        error: `ConvertKit exception: ${error.message}`
      };
    }
  }

  /**
   * Create a new form in ConvertKit
   * Note: ConvertKit API v3 doesn't support creating forms via API
   * This method always returns an error
   * @param name The name of the form to create
   */
  async createList(name: string): Promise<ListResponse> {
    return {
      success: false,
      message: `ConvertKit API does not support creating forms via API`,
      error: 'Forms must be created in the ConvertKit web interface'
    };
  }

  /**
   * Send an email through ConvertKit
   * @param to Recipient(s)
   * @param subject Email subject
   * @param htmlContent HTML content
   * @param textContent Plain text content
   * @param options Additional options
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    htmlContent: string,
    textContent?: string,
    options?: {
      from?: { email: string; name?: string };
      replyTo?: { email: string; name?: string };
      attachments?: Array<{ filename: string; content: string | Buffer; contentType?: string }>;
      customVars?: Record<string, any>;
    }
  ): Promise<EmailResponse> {
    try {
      const apiSecret = this.config.apiSecret;
      
      // ConvertKit requires API secret to send broadcasts
      if (!apiSecret) {
        return {
          success: false,
          message: 'API secret is required to send emails via ConvertKit',
          error: 'Missing API secret'
        };
      }
      
      // Default sender details from config
      const defaultSenderEmail = this.config.defaultSenderEmail;
      const defaultSenderName = this.config.defaultSenderName || 'Obsession Trigger';
      
      // Format recipients - ConvertKit only supports sending to subscribers
      // For this example, we'll try to find the subscribers by email
      const recipients = Array.isArray(to) ? to : [to];
      const subscriberIds: string[] = [];
      
      // Find subscriber IDs for each recipient
      for (const email of recipients) {
        const subscriber = await this.findSubscriber(email);
        if (subscriber) {
          subscriberIds.push(subscriber.id);
        }
      }
      
      if (subscriberIds.length === 0) {
        return {
          success: false,
          message: 'No matching subscribers found in ConvertKit',
          error: 'Recipients must be subscribers in your ConvertKit account'
        };
      }
      
      // ConvertKit doesn't have a direct API for sending one-off emails to specific subscribers
      // They focus on broadcasts to segments/sequences
      // This is a theoretical implementation and may not work
      
      return {
        success: false,
        message: 'Direct email sending is not supported by ConvertKit API',
        error: 'ConvertKit does not provide a way to send emails to specific subscribers via API. Consider using a broadcast or sequence instead.'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to send email`,
        error: `ConvertKit exception: ${error.message}`
      };
    }
  }
}