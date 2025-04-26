import { 
  BaseEmailServiceProvider, 
  EmailProviderConfig, 
  EmailSubscriber, 
  SubscriberResponse, 
  ListResponse, 
  EmailResponse 
} from '../interfaces';

/**
 * MailerLite Email Service Provider Implementation
 */
export class MailerLiteProvider extends BaseEmailServiceProvider {
  readonly name = 'mailerlite';
  readonly displayName = 'MailerLite';
  readonly description = 'MailerLite email marketing service';
  readonly iconUrl = '/images/providers/mailerlite-logo.svg';
  readonly configFields = [
    {
      name: 'apiKey',
      displayName: 'API Key',
      type: 'string' as const,
      required: true,
      secret: true,
      description: 'MailerLite API key from your MailerLite account'
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
      name: 'defaultGroupId',
      displayName: 'Default Group ID',
      type: 'string' as const,
      required: false,
      description: 'Default group ID to add subscribers to if none specified (note: MailerLite calls lists "groups")'
    }
  ];

  constructor(config?: EmailProviderConfig) {
    super();
    if (config) {
      this.setConfig(config);
    }
  }

  /**
   * Validate MailerLite API key format (minimal validation)
   * @param apiKey The API key to validate
   * @returns True if the key appears to be valid
   */
  private validateApiKey(apiKey: string): boolean {
    // MailerLite API keys are typically JWT tokens
    return typeof apiKey === 'string' && apiKey.length >= 50;
  }

  /**
   * Test connection to MailerLite API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const apiKey = this.config.apiKey;
      
      // API key format validation
      if (!this.validateApiKey(apiKey)) {
        return {
          success: false,
          message: 'Invalid MailerLite API key format. It should be at least 50 characters long.'
        };
      }

      // Test API key by making a request to the MailerLite API
      const response = await fetch('https://api.mailerlite.com/api/v2/groups', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-MailerLite-ApiKey': apiKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        const groupCount = Array.isArray(data) ? data.length : 0;
        
        return {
          success: true,
          message: `Successfully connected to MailerLite API! Found ${groupCount} subscriber groups.`
        };
      } else {
        let errorMessage = `MailerLite error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `MailerLite error: ${response.status} - ${
            errorData.error?.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        console.error('MailerLite API test error:', errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Error testing MailerLite connection:', error);
      return {
        success: false,
        message: `MailerLite connection error: ${error.message}`
      };
    }
  }

  /**
   * Add a subscriber to MailerLite
   * @param subscriber The subscriber info to add
   * @param listId Optional group ID to add the subscriber to
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
          message: 'Invalid MailerLite API key format',
          error: 'Invalid API key'
        };
      }
      
      // Determine first and last name
      let firstName = subscriber.firstName || '';
      let lastName = subscriber.lastName || '';
      
      // If first/last aren't provided but name is, split it
      if (!firstName && !lastName && subscriber.name) {
        const nameParts = subscriber.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      }
      
      // Create subscriber in MailerLite
      const contactData = {
        email: subscriber.email,
        name: firstName,
        fields: {
          last_name: lastName,
          source: subscriber.source || 'api'
        },
        resubscribe: true
      };
      
      // Add any custom fields
      if (subscriber.customFields) {
        Object.entries(subscriber.customFields).forEach(([key, value]) => {
          contactData.fields[key] = value;
        });
      }
      
      // Use group ID from param, or default from config
      const targetGroupId = listId || this.config.defaultGroupId;
      
      // Log debug information
      if (targetGroupId) {
        console.log(`DEBUG: Adding subscriber to MailerLite group ID: ${targetGroupId}`);
      } else {
        console.log('DEBUG: No group ID provided for MailerLite. Contact will be added but not assigned to a group.');
      }
      
      console.log(`DEBUG: Full subscriber data:`, {
        email: subscriber.email,
        name: subscriber.name,
        source: subscriber.source,
        groupId: targetGroupId
      });
      
      let response;
      
      // If group ID provided, add directly to that group
      if (targetGroupId) {
        response = await fetch(`https://api.mailerlite.com/api/v2/groups/${targetGroupId}/subscribers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-MailerLite-ApiKey': apiKey
          },
          body: JSON.stringify(contactData)
        });
      } else {
        // Otherwise, just add the subscriber
        response = await fetch('https://api.mailerlite.com/api/v2/subscribers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-MailerLite-ApiKey': apiKey
          },
          body: JSON.stringify(contactData)
        });
      }
      
      // Handle response
      if (response.ok) {
        const data = await response.json();
        console.log(`MailerLite contact added/updated successfully: ${subscriber.email}`, data);
        
        return {
          success: true,
          message: `Subscriber successfully ${targetGroupId ? 'added to MailerLite group' : 'created in MailerLite'}: ${subscriber.name || subscriber.email}`
        };
      } else {
        let errorMessage = `MailerLite error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `MailerLite error: ${response.status} - ${
            errorData.error?.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        console.error('MailerLite API error:', errorMessage);
        return {
          success: false,
          message: `Failed to add subscriber to MailerLite`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Error adding subscriber to MailerLite:', error);
      return {
        success: false,
        message: `Failed to add subscriber to MailerLite`,
        error: `MailerLite exception: ${error.message}`
      };
    }
  }

  /**
   * Remove a subscriber from MailerLite
   * @param email The email of the subscriber to remove
   * @param listId Optional group ID to remove from
   */
  async removeSubscriber(
    email: string,
    listId?: string
  ): Promise<SubscriberResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      // If group ID is provided, unsubscribe from that group
      if (listId) {
        const response = await fetch(`https://api.mailerlite.com/api/v2/groups/${listId}/subscribers/${encodeURIComponent(email)}/unsubscribe`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'X-MailerLite-ApiKey': apiKey
          }
        });
        
        if (response.ok) {
          return {
            success: true,
            message: `Subscriber removed from MailerLite group ${listId}`
          };
        } else {
          let errorMessage = `MailerLite error: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = `MailerLite error: ${response.status} - ${
              errorData.error?.message || response.statusText
            }`;
          } catch (jsonError) {}
          
          return {
            success: false,
            message: `Failed to remove subscriber from MailerLite group`,
            error: errorMessage
          };
        }
      } else {
        // Without a group ID, unsubscribe the contact from all groups
        const response = await fetch(`https://api.mailerlite.com/api/v2/subscribers/${encodeURIComponent(email)}/unsubscribe`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'X-MailerLite-ApiKey': apiKey
          }
        });
        
        if (response.ok) {
          return {
            success: true,
            message: `Subscriber unsubscribed from all MailerLite groups`
          };
        } else {
          let errorMessage = `MailerLite error: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = `MailerLite error: ${response.status} - ${
              errorData.error?.message || response.statusText
            }`;
          } catch (jsonError) {}
          
          return {
            success: false,
            message: `Failed to unsubscribe subscriber from MailerLite`,
            error: errorMessage
          };
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to remove subscriber from MailerLite`,
        error: `MailerLite exception: ${error.message}`
      };
    }
  }

  /**
   * Update a subscriber in MailerLite
   * @param subscriber The updated subscriber info
   * @param listId Optional group ID
   */
  async updateSubscriber(
    subscriber: EmailSubscriber,
    listId?: string
  ): Promise<SubscriberResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      // Determine first and last name
      let firstName = subscriber.firstName || '';
      let lastName = subscriber.lastName || '';
      
      // If first/last aren't provided but name is, split it
      if (!firstName && !lastName && subscriber.name) {
        const nameParts = subscriber.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      }
      
      // Update subscriber in MailerLite
      const contactData = {
        name: firstName,
        fields: {
          last_name: lastName,
          source: subscriber.source || 'api'
        }
      };
      
      // Add any custom fields
      if (subscriber.customFields) {
        Object.entries(subscriber.customFields).forEach(([key, value]) => {
          contactData.fields[key] = value;
        });
      }
      
      // Update the subscriber
      const response = await fetch(`https://api.mailerlite.com/api/v2/subscribers/${encodeURIComponent(subscriber.email)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-MailerLite-ApiKey': apiKey
        },
        body: JSON.stringify(contactData)
      });
      
      // Handle response
      if (response.ok) {
        const data = await response.json();
        console.log(`MailerLite contact updated successfully: ${subscriber.email}`, data);
        
        // If group ID is provided and the subscriber is updated successfully, add to that group
        if (listId) {
          return this.addSubscriber(subscriber, listId);
        }
        
        return {
          success: true,
          message: `Subscriber successfully updated in MailerLite: ${subscriber.name || subscriber.email}`
        };
      } else {
        let errorMessage = `MailerLite error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `MailerLite error: ${response.status} - ${
            errorData.error?.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        console.error('MailerLite API error:', errorMessage);
        return {
          success: false,
          message: `Failed to update subscriber in MailerLite`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Error updating subscriber in MailerLite:', error);
      return {
        success: false,
        message: `Failed to update subscriber in MailerLite`,
        error: `MailerLite exception: ${error.message}`
      };
    }
  }

  /**
   * Get all groups from MailerLite
   */
  async getLists(): Promise<ListResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      const response = await fetch('https://api.mailerlite.com/api/v2/groups', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-MailerLite-ApiKey': apiKey
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Retrieved ${Array.isArray(data) ? data.length : 0} groups from MailerLite`,
          listInfo: data
        };
      } else {
        let errorMessage = `MailerLite error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `MailerLite error: ${response.status} - ${
            errorData.error?.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to retrieve groups from MailerLite`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to retrieve groups from MailerLite`,
        error: `MailerLite exception: ${error.message}`
      };
    }
  }

  /**
   * Get a specific group from MailerLite
   * @param listId The ID of the group to retrieve
   */
  async getList(listId: string): Promise<ListResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      const response = await fetch(`https://api.mailerlite.com/api/v2/groups/${listId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-MailerLite-ApiKey': apiKey
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Retrieved group ${listId} from MailerLite`,
          listId: listId,
          listInfo: data
        };
      } else {
        let errorMessage = `MailerLite error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `MailerLite error: ${response.status} - ${
            errorData.error?.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to retrieve group ${listId} from MailerLite`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to retrieve group ${listId} from MailerLite`,
        error: `MailerLite exception: ${error.message}`
      };
    }
  }

  /**
   * Create a new group in MailerLite
   * @param name The name of the group to create
   */
  async createList(name: string): Promise<ListResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      const response = await fetch('https://api.mailerlite.com/api/v2/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-MailerLite-ApiKey': apiKey
        },
        body: JSON.stringify({
          name: name
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Created group "${name}" in MailerLite`,
          listId: data.id?.toString(),
          listInfo: data
        };
      } else {
        let errorMessage = `MailerLite error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `MailerLite error: ${response.status} - ${
            errorData.error?.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to create group "${name}" in MailerLite`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to create group "${name}" in MailerLite`,
        error: `MailerLite exception: ${error.message}`
      };
    }
  }

  /**
   * Send an email through MailerLite
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
      
      // Format recipients - MailerLite API requires a single recipient for direct sending
      // For multiple recipients, you'd need to use campaigns, which is more complex
      const recipient = Array.isArray(to) ? to[0] : to;
      
      // Build MailerLite email request
      const emailData: any = {
        subject,
        from: options?.from?.email || defaultSenderEmail,
        from_name: options?.from?.name || defaultSenderName,
        to: [
          {
            email: recipient
          }
        ],
        html: htmlContent
      };
      
      // Add plain text content if provided
      if (textContent) {
        emailData.text = textContent;
      }
      
      // Add reply-to if specified
      if (options?.replyTo) {
        emailData.reply_to = options.replyTo.email;
      }
      
      // MailerLite does not directly support attachments through the simple mail API
      // For attachments, you would need to use the campaigns API
      if (options?.attachments && options.attachments.length > 0) {
        console.warn('MailerLite adapter does not support attachments through direct email sending');
      }
      
      // Send request to MailerLite API
      const response = await fetch('https://api.mailerlite.com/api/v2/campaigns/types/regular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-MailerLite-ApiKey': apiKey
        },
        body: JSON.stringify({
          subject: emailData.subject,
          from: emailData.from,
          from_name: emailData.from_name,
          reply_to: emailData.reply_to,
          html: emailData.html,
          plain: emailData.text,
          groups: [], // Empty array means sent to specified subscribers only
          subscribers: emailData.to.map(r => r.email),
          auto_trigger: true, // Send immediately
          type: "regular"
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Email sent successfully to ${recipient}`,
          emailId: data.id?.toString()
        };
      } else {
        let errorMessage = `MailerLite error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `MailerLite error: ${response.status} - ${
            errorData.error?.message || response.statusText
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
        error: `MailerLite exception: ${error.message}`
      };
    }
  }
}