import { 
  BaseEmailServiceProvider, 
  EmailProviderConfig, 
  EmailSubscriber, 
  SubscriberResponse, 
  ListResponse, 
  EmailResponse 
} from '../interfaces';

/**
 * AWeber Email Service Provider Implementation
 */
export class AWeberProvider extends BaseEmailServiceProvider {
  readonly name = 'aweber';
  readonly displayName = 'AWeber';
  readonly description = 'AWeber email marketing service';
  readonly iconUrl = '/images/providers/aweber-logo.svg';
  readonly configFields = [
    {
      name: 'accessToken',
      displayName: 'Access Token',
      type: 'string' as const,
      required: true,
      secret: true,
      description: 'AWeber OAuth access token'
    },
    {
      name: 'accountId',
      displayName: 'Account ID',
      type: 'string' as const,
      required: true,
      description: 'AWeber account ID'
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
      name: 'defaultListId',
      displayName: 'Default List ID',
      type: 'string' as const,
      required: false,
      description: 'Default list ID to add subscribers to if none specified'
    }
  ];

  constructor(config?: EmailProviderConfig) {
    super();
    if (config) {
      this.setConfig(config);
    }
  }

  /**
   * Validate configuration (minimal validation)
   * @returns True if the configuration appears to be valid
   */
  private validateConfig(): boolean {
    return typeof this.config.accessToken === 'string' && 
           typeof this.config.accountId === 'string' && 
           this.config.accessToken.length > 0 && 
           this.config.accountId.length > 0;
  }

  /**
   * Get base API URL for AWeber
   * @returns Base API URL
   */
  private getBaseUrl(): string {
    return `https://api.aweber.com/1.0/accounts/${this.config.accountId}`;
  }

  /**
   * Test connection to AWeber API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Check if config is valid
      if (!this.validateConfig()) {
        return {
          success: false,
          message: 'Invalid AWeber configuration. Both Access Token and Account ID are required.'
        };
      }

      // Test connection by getting account info
      const response = await fetch(`https://api.aweber.com/1.0/accounts/${this.config.accountId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Successfully connected to AWeber API for account: ${data.company_name || this.config.accountId}`
        };
      } else {
        let errorMessage = `AWeber error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `AWeber error: ${response.status} - ${
            errorData.error?.message || errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        console.error('AWeber API test error:', errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Error testing AWeber connection:', error);
      return {
        success: false,
        message: `AWeber connection error: ${error.message}`
      };
    }
  }

  /**
   * Add a subscriber to AWeber
   * @param subscriber The subscriber info to add
   * @param listId Optional list ID to add the subscriber to
   */
  async addSubscriber(
    subscriber: EmailSubscriber,
    listId?: string
  ): Promise<SubscriberResponse> {
    try {
      // Validate config
      if (!this.validateConfig()) {
        return {
          success: false,
          message: 'Invalid AWeber configuration',
          error: 'Invalid configuration'
        };
      }
      
      // Get target list ID
      const targetListId = listId || this.config.defaultListId;
      
      if (!targetListId) {
        return {
          success: false,
          message: 'No list ID provided and no default list ID configured',
          error: 'Missing list ID'
        };
      }
      
      // Create subscriber data
      const subscriberData: any = {
        email: subscriber.email,
        name: subscriber.name || '',
        tags: subscriber.tags || [],
        custom_fields: {}
      };
      
      // Set first and last name if available
      if (subscriber.firstName || subscriber.lastName) {
        subscriberData.name = `${subscriber.firstName || ''} ${subscriber.lastName || ''}`.trim();
      }
      
      // Add source as tag if available
      if (subscriber.source) {
        subscriberData.tags.push(subscriber.source);
      }
      
      // Add custom fields
      if (subscriber.customFields) {
        subscriberData.custom_fields = {
          ...subscriber.customFields
        };
      }
      
      // Add the subscriber to the list
      const response = await fetch(`${this.getBaseUrl()}/lists/${targetListId}/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`
        },
        body: JSON.stringify(subscriberData)
      });
      
      if (response.status === 201) {
        // Success - 201 Created
        const data = await response.json();
        
        return {
          success: true,
          message: `Subscriber successfully added to AWeber: ${subscriber.email}`,
          subscriberId: data.id?.toString()
        };
      } else if (response.status === 400) {
        // Check for duplicate subscriber error
        const errorData = await response.json();
        
        if (errorData.error?.message?.includes('already subscribed')) {
          // Subscriber already exists, try to update instead
          return this.updateSubscriber(subscriber, targetListId);
        } else {
          console.error('AWeber API error:', errorData);
          return {
            success: false,
            message: `Failed to add subscriber to AWeber`,
            error: errorData.error?.message || errorData.message || 'Unknown error'
          };
        }
      } else {
        let errorMessage = `AWeber error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `AWeber error: ${response.status} - ${
            errorData.error?.message || errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        console.error('AWeber API error:', errorMessage);
        return {
          success: false,
          message: `Failed to add subscriber to AWeber`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Error adding subscriber to AWeber:', error);
      return {
        success: false,
        message: `Failed to add subscriber to AWeber`,
        error: `AWeber exception: ${error.message}`
      };
    }
  }

  /**
   * Find a subscriber in AWeber by email
   * @param email Email to search for
   * @param listId List ID to search in
   * @returns Subscriber ID if found, null otherwise
   */
  private async findSubscriber(email: string, listId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/lists/${listId}/subscribers?ws.op=find&email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.entries && data.entries.length > 0) {
          // Return ID of the first matching subscriber
          return data.entries[0].id;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding subscriber in AWeber:', error);
      return null;
    }
  }

  /**
   * Remove a subscriber from AWeber
   * @param email The email of the subscriber to remove
   * @param listId Optional list ID to remove from
   */
  async removeSubscriber(
    email: string,
    listId?: string
  ): Promise<SubscriberResponse> {
    try {
      // Validate config
      if (!this.validateConfig()) {
        return {
          success: false,
          message: 'Invalid AWeber configuration',
          error: 'Invalid configuration'
        };
      }
      
      // Get target list ID
      const targetListId = listId || this.config.defaultListId;
      
      if (!targetListId) {
        return {
          success: false,
          message: 'No list ID provided and no default list ID configured',
          error: 'Missing list ID'
        };
      }
      
      // Find the subscriber by email
      const subscriberId = await this.findSubscriber(email, targetListId);
      
      if (!subscriberId) {
        // Subscriber not found - consider it a success for idempotence
        return {
          success: true,
          message: `Subscriber not found in AWeber: ${email}`
        };
      }
      
      // Delete the subscriber
      const response = await fetch(`${this.getBaseUrl()}/lists/${targetListId}/subscribers/${subscriberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });
      
      if (response.status === 204) {
        // Success - 204 No Content
        return {
          success: true,
          message: `Subscriber successfully removed from AWeber: ${email}`
        };
      } else {
        let errorMessage = `AWeber error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `AWeber error: ${response.status} - ${
            errorData.error?.message || errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to remove subscriber from AWeber`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to remove subscriber from AWeber`,
        error: `AWeber exception: ${error.message}`
      };
    }
  }

  /**
   * Update a subscriber in AWeber
   * @param subscriber The updated subscriber info
   * @param listId Optional list ID
   */
  async updateSubscriber(
    subscriber: EmailSubscriber,
    listId?: string
  ): Promise<SubscriberResponse> {
    try {
      // Validate config
      if (!this.validateConfig()) {
        return {
          success: false,
          message: 'Invalid AWeber configuration',
          error: 'Invalid configuration'
        };
      }
      
      // Get target list ID
      const targetListId = listId || this.config.defaultListId;
      
      if (!targetListId) {
        return {
          success: false,
          message: 'No list ID provided and no default list ID configured',
          error: 'Missing list ID'
        };
      }
      
      // Find the subscriber by email
      const subscriberId = await this.findSubscriber(subscriber.email, targetListId);
      
      if (!subscriberId) {
        // Subscriber not found, create a new one
        return this.addSubscriber(subscriber, targetListId);
      }
      
      // Create update data
      const updateData: any = {
        name: subscriber.name || '',
        custom_fields: {}
      };
      
      // Set first and last name if available
      if (subscriber.firstName || subscriber.lastName) {
        updateData.name = `${subscriber.firstName || ''} ${subscriber.lastName || ''}`.trim();
      }
      
      // Add custom fields
      if (subscriber.customFields) {
        updateData.custom_fields = {
          ...subscriber.customFields
        };
      }
      
      // Update tags if available
      if (subscriber.tags && subscriber.tags.length > 0) {
        // AWeber requires a separate call to update tags
        await this.updateSubscriberTags(subscriberId, targetListId, subscriber.tags);
      }
      
      // Update the subscriber
      const response = await fetch(`${this.getBaseUrl()}/lists/${targetListId}/subscribers/${subscriberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        return {
          success: true,
          message: `Subscriber successfully updated in AWeber: ${subscriber.email}`,
          subscriberId: data.id?.toString()
        };
      } else {
        let errorMessage = `AWeber error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `AWeber error: ${response.status} - ${
            errorData.error?.message || errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        console.error('AWeber API error:', errorMessage);
        return {
          success: false,
          message: `Failed to update subscriber in AWeber`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Error updating subscriber in AWeber:', error);
      return {
        success: false,
        message: `Failed to update subscriber in AWeber`,
        error: `AWeber exception: ${error.message}`
      };
    }
  }

  /**
   * Update tags for a subscriber
   * @param subscriberId Subscriber ID
   * @param listId List ID
   * @param tags Tags to apply
   */
  private async updateSubscriberTags(subscriberId: string, listId: string, tags: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/lists/${listId}/subscribers/${subscriberId}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`
        },
        body: JSON.stringify({
          tags: tags.map(tag => ({ name: tag }))
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error updating subscriber tags in AWeber:', error);
      return false;
    }
  }

  /**
   * Get all lists from AWeber
   */
  async getLists(): Promise<ListResponse> {
    try {
      // Validate config
      if (!this.validateConfig()) {
        return {
          success: false,
          message: 'Invalid AWeber configuration',
          error: 'Invalid configuration'
        };
      }
      
      const response = await fetch(`${this.getBaseUrl()}/lists`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        return {
          success: true,
          message: `Retrieved ${data.entries?.length || 0} lists from AWeber`,
          listInfo: data.entries
        };
      } else {
        let errorMessage = `AWeber error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `AWeber error: ${response.status} - ${
            errorData.error?.message || errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to retrieve lists from AWeber`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to retrieve lists from AWeber`,
        error: `AWeber exception: ${error.message}`
      };
    }
  }

  /**
   * Get a specific list from AWeber
   * @param listId The ID of the list to retrieve
   */
  async getList(listId: string): Promise<ListResponse> {
    try {
      // Validate config
      if (!this.validateConfig()) {
        return {
          success: false,
          message: 'Invalid AWeber configuration',
          error: 'Invalid configuration'
        };
      }
      
      const response = await fetch(`${this.getBaseUrl()}/lists/${listId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        return {
          success: true,
          message: `Retrieved list ${listId} from AWeber`,
          listId: listId,
          listInfo: data
        };
      } else {
        let errorMessage = `AWeber error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `AWeber error: ${response.status} - ${
            errorData.error?.message || errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to retrieve list ${listId} from AWeber`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to retrieve list ${listId} from AWeber`,
        error: `AWeber exception: ${error.message}`
      };
    }
  }

  /**
   * Create a new list in AWeber
   * @param name The name of the list to create
   */
  async createList(name: string): Promise<ListResponse> {
    try {
      // Validate config
      if (!this.validateConfig()) {
        return {
          success: false,
          message: 'Invalid AWeber configuration',
          error: 'Invalid configuration'
        };
      }
      
      const response = await fetch(`${this.getBaseUrl()}/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`
        },
        body: JSON.stringify({
          name: name
        })
      });
      
      if (response.status === 201) {
        const data = await response.json();
        
        return {
          success: true,
          message: `Created list "${name}" in AWeber`,
          listId: data.id?.toString(),
          listInfo: data
        };
      } else {
        let errorMessage = `AWeber error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `AWeber error: ${response.status} - ${
            errorData.error?.message || errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to create list "${name}" in AWeber`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to create list "${name}" in AWeber`,
        error: `AWeber exception: ${error.message}`
      };
    }
  }

  /**
   * Send an email through AWeber
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
      // AWeber doesn't really have a direct transactional email API
      // They focus on campaigns and broadcasts rather than direct emails
      // For individual emails, most users would use a dedicated transactional email service like SendGrid

      // For this implementation, we'll return an error message explaining the limitation
      return {
        success: false,
        message: 'Direct email sending is not supported through AWeber API',
        error: 'AWeber does not provide a transactional email API. Consider using a broadcast or campaign for sending to your list.'
      };
      
      // In a real implementation, you might use AWeber's broadcast API, which requires:
      // 1. Creating a broadcast
      // 2. Setting its content
      // 3. Scheduling it
      // 4. But note that broadcasts are sent to entire segments/lists, not individual recipients
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to send email`,
        error: `AWeber exception: ${error.message}`
      };
    }
  }
}