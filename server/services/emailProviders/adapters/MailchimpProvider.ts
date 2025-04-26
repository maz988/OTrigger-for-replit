import { 
  BaseEmailServiceProvider, 
  EmailProviderConfig, 
  EmailSubscriber, 
  SubscriberResponse, 
  ListResponse, 
  EmailResponse 
} from '../interfaces';

/**
 * Mailchimp Email Service Provider Implementation
 */
export class MailchimpProvider extends BaseEmailServiceProvider {
  readonly name = 'mailchimp';
  readonly displayName = 'Mailchimp';
  readonly description = 'Mailchimp email marketing platform';
  readonly iconUrl = '/images/providers/mailchimp-logo.svg';
  readonly configFields = [
    {
      name: 'apiKey',
      displayName: 'API Key',
      type: 'string' as const,
      required: true,
      secret: true,
      description: 'Mailchimp API key from your account'
    },
    {
      name: 'serverPrefix',
      displayName: 'Server Prefix',
      type: 'string' as const,
      required: true,
      description: 'Mailchimp server prefix (e.g., "us1" from "us1.api.mailchimp.com")'
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
      displayName: 'Default List/Audience ID',
      type: 'string' as const,
      required: false,
      description: 'Default list/audience ID to add subscribers to if none specified'
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
    // Mailchimp API keys are hyphen-separated with the server prefix at the end
    return typeof apiKey === 'string' && apiKey.includes('-') && apiKey.length > 10;
  }

  /**
   * Get API hostname based on server prefix
   * @returns API hostname
   */
  private getApiHost(): string {
    const serverPrefix = this.config.serverPrefix || this.extractServerPrefix(this.config.apiKey);
    return `https://${serverPrefix}.api.mailchimp.com/3.0`;
  }

  /**
   * Extract server prefix from API key if not provided
   * @param apiKey Mailchimp API key
   * @returns Server prefix
   */
  private extractServerPrefix(apiKey: string): string {
    if (!apiKey || !apiKey.includes('-')) {
      return 'us1'; // Default fallback
    }
    
    const parts = apiKey.split('-');
    return parts[parts.length - 1];
  }

  /**
   * Create authorization header for Mailchimp API
   * @returns Authorization header value
   */
  private getAuthHeader(): string {
    return `Basic ${Buffer.from(`anystring:${this.config.apiKey}`).toString('base64')}`;
  }

  /**
   * Test connection to Mailchimp API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const apiKey = this.config.apiKey;
      
      // API key format validation
      if (!this.validateApiKey(apiKey)) {
        return {
          success: false,
          message: 'Invalid Mailchimp API key format. It should include a hyphen.'
        };
      }

      // Test API key by making a request to the Mailchimp API
      const response = await fetch(`${this.getApiHost()}/ping`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': this.getAuthHeader()
        }
      });

      if (response.ok) {
        return {
          success: true,
          message: `Successfully connected to Mailchimp API!`
        };
      } else {
        let errorMessage = `Mailchimp error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `Mailchimp error: ${response.status} - ${
            errorData.detail || errorData.title || response.statusText
          }`;
        } catch (jsonError) {}
        
        console.error('Mailchimp API test error:', errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Error testing Mailchimp connection:', error);
      return {
        success: false,
        message: `Mailchimp connection error: ${error.message}`
      };
    }
  }

  /**
   * Create MD5 hash of email for Mailchimp API
   * @param email Email address
   * @returns MD5 hash string
   */
  private getMd5Hash(email: string): string {
    try {
      const crypto = require('crypto');
      return crypto
        .createHash('md5')
        .update(email.toLowerCase())
        .digest('hex');
    } catch (error) {
      console.error('Error creating MD5 hash:', error);
      // Fallback to a dummy hash if crypto fails
      return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    }
  }

  /**
   * Add a subscriber to Mailchimp
   * @param subscriber The subscriber info to add
   * @param listId Optional list ID to add the subscriber to
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
          message: 'Invalid Mailchimp API key format',
          error: 'Invalid API key'
        };
      }
      
      // Use provided list ID or default from config
      const targetListId = listId || this.config.defaultListId;
      
      if (!targetListId) {
        return {
          success: false,
          message: 'No list ID provided and no default list ID configured',
          error: 'Missing list ID'
        };
      }
      
      // Determine merge fields for first/last name
      const mergeFields: any = {};
      
      if (subscriber.firstName) {
        mergeFields.FNAME = subscriber.firstName;
      }
      
      if (subscriber.lastName) {
        mergeFields.LNAME = subscriber.lastName;
      }
      
      // If first/last aren't provided but name is, split it
      if (!mergeFields.FNAME && !mergeFields.LNAME && subscriber.name) {
        const nameParts = subscriber.name.split(' ');
        mergeFields.FNAME = nameParts[0] || '';
        mergeFields.LNAME = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      }
      
      // Add any custom fields
      if (subscriber.customFields) {
        Object.entries(subscriber.customFields).forEach(([key, value]) => {
          // Mailchimp merge fields are typically uppercase
          mergeFields[key.toUpperCase()] = value;
        });
      }
      
      // Create subscriber data for Mailchimp
      const memberData = {
        email_address: subscriber.email,
        status: 'subscribed',
        merge_fields: mergeFields,
        tags: subscriber.tags || []
      };
      
      // Add source as a tag if available
      if (subscriber.source) {
        memberData.tags.push(subscriber.source);
      }
      
      // Add the subscriber to the list
      const response = await fetch(`${this.getApiHost()}/lists/${targetListId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify(memberData)
      });
      
      if (response.status === 200 || response.status === 201) {
        const data = await response.json();
        console.log(`Mailchimp contact added successfully: ${subscriber.email}`, data);
        
        return {
          success: true,
          message: `Subscriber successfully added to Mailchimp: ${subscriber.email}`,
          subscriberId: data.id
        };
      } else if (response.status === 400) {
        // Check if it's a duplicate email error (already exists)
        const errorData = await response.json();
        
        if (errorData.title === 'Member Exists') {
          // Member already exists, try to update
          return this.updateSubscriber(subscriber, targetListId);
        } else {
          console.error('Mailchimp API error:', errorData);
          return {
            success: false,
            message: `Failed to add subscriber to Mailchimp`,
            error: errorData.detail || errorData.title
          };
        }
      } else {
        let errorMessage = `Mailchimp error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `Mailchimp error: ${response.status} - ${
            errorData.detail || errorData.title || response.statusText
          }`;
        } catch (jsonError) {}
        
        console.error('Mailchimp API error:', errorMessage);
        return {
          success: false,
          message: `Failed to add subscriber to Mailchimp`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Error adding subscriber to Mailchimp:', error);
      return {
        success: false,
        message: `Failed to add subscriber to Mailchimp`,
        error: `Mailchimp exception: ${error.message}`
      };
    }
  }

  /**
   * Remove a subscriber from Mailchimp
   * @param email The email of the subscriber to remove
   * @param listId Optional list ID to remove from
   */
  async removeSubscriber(
    email: string,
    listId?: string
  ): Promise<SubscriberResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      // Use provided list ID or default from config
      const targetListId = listId || this.config.defaultListId;
      
      if (!targetListId) {
        return {
          success: false,
          message: 'No list ID provided and no default list ID configured',
          error: 'Missing list ID'
        };
      }
      
      // Generate MD5 hash of email for Mailchimp API
      const subscriberHash = this.getMd5Hash(email);
      
      // Archive the member (Mailchimp's preferred approach vs delete)
      const response = await fetch(`${this.getApiHost()}/lists/${targetListId}/members/${subscriberHash}`, {
        method: 'DELETE',
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });
      
      if (response.status === 204) {
        // Success - 204 No Content
        return {
          success: true,
          message: `Subscriber successfully removed from Mailchimp: ${email}`
        };
      } else if (response.status === 404) {
        // Member not found - consider a success for idempotence
        return {
          success: true,
          message: `Subscriber not found in Mailchimp: ${email}`
        };
      } else {
        let errorMessage = `Mailchimp error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `Mailchimp error: ${response.status} - ${
            errorData.detail || errorData.title || response.statusText
          }`;
        } catch (jsonError) {}
        
        console.error('Mailchimp API error:', errorMessage);
        return {
          success: false,
          message: `Failed to remove subscriber from Mailchimp`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Error removing subscriber from Mailchimp:', error);
      return {
        success: false,
        message: `Failed to remove subscriber from Mailchimp`,
        error: `Mailchimp exception: ${error.message}`
      };
    }
  }

  /**
   * Update a subscriber in Mailchimp
   * @param subscriber The updated subscriber info
   * @param listId Optional list ID
   */
  async updateSubscriber(
    subscriber: EmailSubscriber,
    listId?: string
  ): Promise<SubscriberResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      // Use provided list ID or default from config
      const targetListId = listId || this.config.defaultListId;
      
      if (!targetListId) {
        return {
          success: false,
          message: 'No list ID provided and no default list ID configured',
          error: 'Missing list ID'
        };
      }
      
      // Generate MD5 hash of email for Mailchimp API
      const subscriberHash = this.getMd5Hash(subscriber.email);
      
      // Determine merge fields for first/last name
      const mergeFields: any = {};
      
      if (subscriber.firstName) {
        mergeFields.FNAME = subscriber.firstName;
      }
      
      if (subscriber.lastName) {
        mergeFields.LNAME = subscriber.lastName;
      }
      
      // If first/last aren't provided but name is, split it
      if (!mergeFields.FNAME && !mergeFields.LNAME && subscriber.name) {
        const nameParts = subscriber.name.split(' ');
        mergeFields.FNAME = nameParts[0] || '';
        mergeFields.LNAME = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      }
      
      // Add any custom fields
      if (subscriber.customFields) {
        Object.entries(subscriber.customFields).forEach(([key, value]) => {
          // Mailchimp merge fields are typically uppercase
          mergeFields[key.toUpperCase()] = value;
        });
      }
      
      // Create update data for Mailchimp
      const memberData: any = {
        merge_fields: mergeFields
      };
      
      // Add tags if available
      if (subscriber.tags && subscriber.tags.length > 0) {
        memberData.tags = subscriber.tags.map(tag => ({ name: tag, status: 'active' }));
      }
      
      // Add source as a tag if available
      if (subscriber.source) {
        memberData.tags = memberData.tags || [];
        memberData.tags.push({ name: subscriber.source, status: 'active' });
      }
      
      // Update the subscriber
      const response = await fetch(`${this.getApiHost()}/lists/${targetListId}/members/${subscriberHash}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify(memberData)
      });
      
      if (response.status === 200) {
        const data = await response.json();
        console.log(`Mailchimp contact updated successfully: ${subscriber.email}`, data);
        
        return {
          success: true,
          message: `Subscriber successfully updated in Mailchimp: ${subscriber.email}`,
          subscriberId: data.id
        };
      } else if (response.status === 404) {
        // Member not found, create them
        return this.addSubscriber(subscriber, targetListId);
      } else {
        let errorMessage = `Mailchimp error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `Mailchimp error: ${response.status} - ${
            errorData.detail || errorData.title || response.statusText
          }`;
        } catch (jsonError) {}
        
        console.error('Mailchimp API error:', errorMessage);
        return {
          success: false,
          message: `Failed to update subscriber in Mailchimp`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Error updating subscriber in Mailchimp:', error);
      return {
        success: false,
        message: `Failed to update subscriber in Mailchimp`,
        error: `Mailchimp exception: ${error.message}`
      };
    }
  }

  /**
   * Get all lists from Mailchimp
   */
  async getLists(): Promise<ListResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      const response = await fetch(`${this.getApiHost()}/lists?count=100`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': this.getAuthHeader()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Retrieved ${data.lists?.length || 0} lists from Mailchimp`,
          listInfo: data.lists
        };
      } else {
        let errorMessage = `Mailchimp error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `Mailchimp error: ${response.status} - ${
            errorData.detail || errorData.title || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to retrieve lists from Mailchimp`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to retrieve lists from Mailchimp`,
        error: `Mailchimp exception: ${error.message}`
      };
    }
  }

  /**
   * Get a specific list from Mailchimp
   * @param listId The ID of the list to retrieve
   */
  async getList(listId: string): Promise<ListResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      const response = await fetch(`${this.getApiHost()}/lists/${listId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': this.getAuthHeader()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Retrieved list ${listId} from Mailchimp`,
          listId: listId,
          listInfo: data
        };
      } else {
        let errorMessage = `Mailchimp error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `Mailchimp error: ${response.status} - ${
            errorData.detail || errorData.title || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to retrieve list ${listId} from Mailchimp`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to retrieve list ${listId} from Mailchimp`,
        error: `Mailchimp exception: ${error.message}`
      };
    }
  }

  /**
   * Create a new list in Mailchimp
   * @param name The name of the list to create
   */
  async createList(name: string): Promise<ListResponse> {
    try {
      const apiKey = this.config.apiKey;
      const defaultSenderEmail = this.config.defaultSenderEmail;
      const defaultSenderName = this.config.defaultSenderName;
      
      if (!defaultSenderEmail) {
        return {
          success: false,
          message: 'Default sender email is required to create a list',
          error: 'Missing sender email'
        };
      }
      
      const response = await fetch(`${this.getApiHost()}/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify({
          name: name,
          contact: {
            company: defaultSenderName || 'Obsession Trigger',
            address1: 'Required by Mailchimp',
            city: 'Required by Mailchimp',
            state: 'Required by Mailchimp',
            zip: 'Required by Mailchimp',
            country: 'US'
          },
          permission_reminder: 'You are receiving this email because you opted in via our website.',
          campaign_defaults: {
            from_name: defaultSenderName || 'Obsession Trigger',
            from_email: defaultSenderEmail,
            subject: '',
            language: 'en'
          },
          email_type_option: true
        })
      });
      
      if (response.status === 200 || response.status === 201) {
        const data = await response.json();
        return {
          success: true,
          message: `Created list "${name}" in Mailchimp`,
          listId: data.id,
          listInfo: data
        };
      } else {
        let errorMessage = `Mailchimp error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `Mailchimp error: ${response.status} - ${
            errorData.detail || errorData.title || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to create list "${name}" in Mailchimp`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to create list "${name}" in Mailchimp`,
        error: `Mailchimp exception: ${error.message}`
      };
    }
  }

  /**
   * Send an email through Mailchimp
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
      const apiKey = this.config.apiKey;
      
      // Default sender details from config
      const defaultSenderEmail = this.config.defaultSenderEmail || 'noreply@example.com';
      const defaultSenderName = this.config.defaultSenderName || 'Obsession Trigger';
      
      // Format recipients
      const recipients = Array.isArray(to) ? to : [to];
      
      // Notes on Mailchimp's API:
      // For transactional emails, Mailchimp uses Mandrill API
      // In a full implementation, you would need to use the Mandrill API key
      // For this example, we'll assume a direct Mailchimp API endpoint
      
      // Email content
      const email = {
        recipients: recipients.map(email => ({ email })),
        content: {
          subject: subject,
          html: htmlContent,
          text: textContent || ''
        },
        from_email: options?.from?.email || defaultSenderEmail,
        from_name: options?.from?.name || defaultSenderName,
        reply_to: options?.replyTo?.email
      };
      
      // This is a theoretical endpoint; in practice you'd use Mandrill API
      const response = await fetch(`${this.getApiHost()}/transactional/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify(email)
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Email sent successfully to ${recipients.length} recipient(s)`,
          emailId: data.id
        };
      } else {
        let errorMessage = `Mailchimp error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `Mailchimp error: ${response.status} - ${
            errorData.detail || errorData.title || response.statusText
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
        error: `Mailchimp exception: ${error.message}`
      };
    }
  }
}