import { 
  BaseEmailServiceProvider, 
  EmailProviderConfig, 
  EmailSubscriber, 
  SubscriberResponse, 
  ListResponse, 
  EmailResponse 
} from '../interfaces';

/**
 * SendPulse Email Service Provider Implementation
 */
export class SendPulseProvider extends BaseEmailServiceProvider {
  readonly name = 'sendpulse';
  readonly displayName = 'SendPulse';
  readonly description = 'SendPulse email marketing platform';
  readonly iconUrl = '/images/providers/sendpulse-logo.svg';
  readonly configFields = [
    {
      name: 'userId',
      displayName: 'User ID',
      type: 'string' as const,
      required: true,
      description: 'SendPulse User ID / Client ID'
    },
    {
      name: 'apiKey',
      displayName: 'Secret Key',
      type: 'string' as const,
      required: true,
      secret: true,
      description: 'SendPulse Secret Key / Client Secret'
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
      name: 'defaultAddressBookId',
      displayName: 'Default Address Book ID',
      type: 'string' as const,
      required: false,
      description: 'Default address book ID to add subscribers to if none specified'
    }
  ];

  private accessToken: string = '';
  private tokenExpiry: number = 0;

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
    return typeof this.config.userId === 'string' && 
           typeof this.config.apiKey === 'string' && 
           this.config.userId.length > 0 && 
           this.config.apiKey.length > 0;
  }

  /**
   * Get authentication token for SendPulse API
   * @returns Access token
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token already
    const now = Date.now();
    if (this.accessToken && this.tokenExpiry > now) {
      return this.accessToken;
    }
    
    try {
      const response = await fetch('https://api.sendpulse.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: this.config.userId,
          client_secret: this.config.apiKey
        })
      });
      
      if (!response.ok) {
        throw new Error(`SendPulse authentication failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.access_token) {
        throw new Error('SendPulse authentication failed: No access token received');
      }
      
      this.accessToken = data.access_token;
      this.tokenExpiry = now + (data.expires_in * 1000 || 3600 * 1000); // Default to 1 hour if not specified
      
      return this.accessToken;
    } catch (error: any) {
      console.error('Error getting SendPulse access token:', error);
      throw error;
    }
  }

  /**
   * Test connection to SendPulse API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Validate config
      if (!this.validateConfig()) {
        return {
          success: false,
          message: 'Invalid SendPulse configuration. Both User ID and Secret Key are required.'
        };
      }

      // Test authentication by getting an access token
      const token = await this.getAccessToken();
      
      // If we got here, authentication succeeded
      return {
        success: true,
        message: `Successfully connected to SendPulse API!`
      };
    } catch (error: any) {
      console.error('Error testing SendPulse connection:', error);
      return {
        success: false,
        message: `SendPulse connection error: ${error.message}`
      };
    }
  }

  /**
   * Add a subscriber to SendPulse
   * @param subscriber The subscriber info to add
   * @param listId Optional address book ID to add the subscriber to
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
          message: 'Invalid SendPulse configuration',
          error: 'Invalid configuration'
        };
      }
      
      // Get access token
      const token = await this.getAccessToken();
      
      // Use provided address book ID or default from config
      const targetBookId = listId || this.config.defaultAddressBookId;
      
      if (!targetBookId) {
        return {
          success: false,
          message: 'No address book ID provided and no default address book ID configured',
          error: 'Missing address book ID'
        };
      }
      
      // Prepare subscriber data
      const subscriberData: any = {
        email: subscriber.email,
        variables: []
      };
      
      // Add name if available
      if (subscriber.name) {
        subscriberData.variables.push({ name: 'Name', value: subscriber.name });
      }
      
      // Add first and last name if available
      if (subscriber.firstName) {
        subscriberData.variables.push({ name: 'First Name', value: subscriber.firstName });
      }
      
      if (subscriber.lastName) {
        subscriberData.variables.push({ name: 'Last Name', value: subscriber.lastName });
      }
      
      // Add source if available
      if (subscriber.source) {
        subscriberData.variables.push({ name: 'Source', value: subscriber.source });
      }
      
      // Add custom fields
      if (subscriber.customFields) {
        Object.entries(subscriber.customFields).forEach(([key, value]) => {
          subscriberData.variables.push({ name: key, value: String(value) });
        });
      }
      
      // Add the subscriber to the address book
      const response = await fetch(`https://api.sendpulse.com/addressbooks/${targetBookId}/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          emails: [subscriberData]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.result) {
          return {
            success: true,
            message: `Subscriber successfully added to SendPulse: ${subscriber.email}`
          };
        } else {
          return {
            success: false,
            message: `Failed to add subscriber to SendPulse`,
            error: data.message || 'Unknown error'
          };
        }
      } else {
        let errorMessage = `SendPulse error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `SendPulse error: ${response.status} - ${
            errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        console.error('SendPulse API error:', errorMessage);
        return {
          success: false,
          message: `Failed to add subscriber to SendPulse`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Error adding subscriber to SendPulse:', error);
      return {
        success: false,
        message: `Failed to add subscriber to SendPulse`,
        error: `SendPulse exception: ${error.message}`
      };
    }
  }

  /**
   * Remove a subscriber from SendPulse
   * @param email The email of the subscriber to remove
   * @param listId Optional address book ID to remove from
   */
  async removeSubscriber(
    email: string,
    listId?: string
  ): Promise<SubscriberResponse> {
    try {
      // Get access token
      const token = await this.getAccessToken();
      
      // Use provided address book ID or default from config
      const targetBookId = listId || this.config.defaultAddressBookId;
      
      if (!targetBookId) {
        return {
          success: false,
          message: 'No address book ID provided and no default address book ID configured',
          error: 'Missing address book ID'
        };
      }
      
      // Remove the subscriber from the address book
      const response = await fetch(`https://api.sendpulse.com/addressbooks/${targetBookId}/emails`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          emails: [email]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.result) {
          return {
            success: true,
            message: `Subscriber successfully removed from SendPulse: ${email}`
          };
        } else {
          return {
            success: false,
            message: `Failed to remove subscriber from SendPulse`,
            error: data.message || 'Unknown error'
          };
        }
      } else {
        let errorMessage = `SendPulse error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `SendPulse error: ${response.status} - ${
            errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to remove subscriber from SendPulse`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to remove subscriber from SendPulse`,
        error: `SendPulse exception: ${error.message}`
      };
    }
  }

  /**
   * Update a subscriber in SendPulse
   * @param subscriber The updated subscriber info
   * @param listId Optional address book ID
   */
  async updateSubscriber(
    subscriber: EmailSubscriber,
    listId?: string
  ): Promise<SubscriberResponse> {
    try {
      // SendPulse's API doesn't have a specific update method for subscribers
      // The recommended approach is to remove and then add the subscriber again
      
      // First try to remove the subscriber
      await this.removeSubscriber(subscriber.email, listId).catch(() => {
        // Ignore errors during removal, as the subscriber might not exist
      });
      
      // Then add the subscriber again with updated information
      return this.addSubscriber(subscriber, listId);
    } catch (error: any) {
      console.error('Error updating subscriber in SendPulse:', error);
      return {
        success: false,
        message: `Failed to update subscriber in SendPulse`,
        error: `SendPulse exception: ${error.message}`
      };
    }
  }

  /**
   * Get all address books from SendPulse
   */
  async getLists(): Promise<ListResponse> {
    try {
      // Get access token
      const token = await this.getAccessToken();
      
      const response = await fetch('https://api.sendpulse.com/addressbooks', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          return {
            success: true,
            message: `Retrieved ${data.length} address books from SendPulse`,
            listInfo: data
          };
        } else {
          return {
            success: false,
            message: `Failed to retrieve address books from SendPulse`,
            error: 'Invalid response format'
          };
        }
      } else {
        let errorMessage = `SendPulse error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `SendPulse error: ${response.status} - ${
            errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to retrieve address books from SendPulse`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to retrieve address books from SendPulse`,
        error: `SendPulse exception: ${error.message}`
      };
    }
  }

  /**
   * Get a specific address book from SendPulse
   * @param listId The ID of the address book to retrieve
   */
  async getList(listId: string): Promise<ListResponse> {
    try {
      // Get access token
      const token = await this.getAccessToken();
      
      const response = await fetch(`https://api.sendpulse.com/addressbooks/${listId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        return {
          success: true,
          message: `Retrieved address book ${listId} from SendPulse`,
          listId: listId,
          listInfo: data
        };
      } else {
        let errorMessage = `SendPulse error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `SendPulse error: ${response.status} - ${
            errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to retrieve address book ${listId} from SendPulse`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to retrieve address book ${listId} from SendPulse`,
        error: `SendPulse exception: ${error.message}`
      };
    }
  }

  /**
   * Create a new address book in SendPulse
   * @param name The name of the address book to create
   */
  async createList(name: string): Promise<ListResponse> {
    try {
      // Get access token
      const token = await this.getAccessToken();
      
      const response = await fetch('https://api.sendpulse.com/addressbooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookName: name
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.id) {
          return {
            success: true,
            message: `Created address book "${name}" in SendPulse`,
            listId: data.id.toString(),
            listInfo: data
          };
        } else {
          return {
            success: false,
            message: `Failed to create address book "${name}" in SendPulse`,
            error: 'Invalid response format'
          };
        }
      } else {
        let errorMessage = `SendPulse error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `SendPulse error: ${response.status} - ${
            errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to create address book "${name}" in SendPulse`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to create address book "${name}" in SendPulse`,
        error: `SendPulse exception: ${error.message}`
      };
    }
  }

  /**
   * Send an email through SendPulse
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
      // Get access token
      const token = await this.getAccessToken();
      
      // Default sender details from config
      const defaultSenderEmail = this.config.defaultSenderEmail || 'noreply@example.com';
      const defaultSenderName = this.config.defaultSenderName || 'Obsession Trigger';
      
      // Format recipients
      const recipients = Array.isArray(to) ? to : [to];
      
      // Prepare email data
      const emailData: any = {
        subject: subject,
        html: htmlContent,
        text: textContent || '',
        from: {
          name: options?.from?.name || defaultSenderName,
          email: options?.from?.email || defaultSenderEmail
        },
        to: recipients.map(email => ({ email }))
      };
      
      // Add reply-to if specified
      if (options?.replyTo) {
        emailData.reply_to = options.replyTo.email;
      }
      
      // Add attachments if provided
      if (options?.attachments && options.attachments.length > 0) {
        emailData.attachments = options.attachments.map(attachment => ({
          name: attachment.filename,
          content: typeof attachment.content === 'string' 
            ? attachment.content 
            : attachment.content.toString('base64'),
          content_type: attachment.contentType || 'application/octet-stream'
        }));
      }
      
      // Send the email
      const response = await fetch('https://api.sendpulse.com/smtp/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(emailData)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.result) {
          return {
            success: true,
            message: `Email sent successfully to ${recipients.length} recipient(s)`,
            emailId: data.id
          };
        } else {
          return {
            success: false,
            message: `Failed to send email`,
            error: data.message || 'Unknown error'
          };
        }
      } else {
        let errorMessage = `SendPulse error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `SendPulse error: ${response.status} - ${
            errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to send email`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to send email`,
        error: `SendPulse exception: ${error.message}`
      };
    }
  }
}