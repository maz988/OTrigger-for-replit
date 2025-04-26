import { 
  BaseEmailServiceProvider, 
  EmailProviderConfig, 
  EmailSubscriber, 
  SubscriberResponse, 
  ListResponse, 
  EmailResponse 
} from '../interfaces';

/**
 * Brevo Email Service Provider Implementation
 */
export class BrevoProvider extends BaseEmailServiceProvider {
  readonly name = 'brevo';
  readonly displayName = 'Brevo';
  readonly description = 'Brevo (formerly Sendinblue) email marketing service';
  readonly iconUrl = '/images/providers/brevo-logo.svg';
  readonly configFields = [
    {
      name: 'apiKey',
      displayName: 'API Key',
      type: 'string' as const,
      required: true,
      secret: true,
      description: 'Brevo API key. Can be found in your Brevo dashboard.'
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
   * Sanitize Brevo API key for logging (to avoid exposing the full key in logs)
   * @param apiKey Brevo API key
   * @returns Safely redacted API key for logging
   */
  private sanitizeApiKey(apiKey: string): string {
    if (!apiKey) return '';
    if (apiKey.length <= 8) return '***';
    return apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
  }

  /**
   * Validate Brevo API key format (minimal validation)
   * @param apiKey The API key to validate
   * @returns True if the key appears to be valid
   */
  private validateApiKey(apiKey: string): boolean {
    // Brevo API keys are alphanumeric, 64 characters
    // xkeysib-... format is common but not enforced by us
    return typeof apiKey === 'string' && apiKey.length >= 20;
  }

  /**
   * Test connection to Brevo API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const apiKey = this.config.apiKey;
      
      // API key format validation
      if (!this.validateApiKey(apiKey)) {
        return {
          success: false,
          message: 'Invalid Brevo API key format. It should be at least 20 characters long.'
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
          message: `Brevo API error: ${response.status} - ${
            errorData.message || response.statusText
          }`
        };
      }
    } catch (error: any) {
      console.error('Error testing Brevo connection:', error);
      return {
        success: false,
        message: `Brevo connection error: ${error.message}`
      };
    }
  }

  /**
   * Add a subscriber to Brevo
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
          message: 'Invalid Brevo API key format',
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
      
      // Create subscriber attributes
      const attributes: Record<string, any> = {
        FIRSTNAME: firstName,
        LASTNAME: lastName
      };
      
      // Add source as a custom attribute if provided
      if (subscriber.source) {
        attributes.SOURCE = subscriber.source;
      }
      
      // Add any custom fields
      if (subscriber.customFields) {
        Object.entries(subscriber.customFields).forEach(([key, value]) => {
          attributes[key.toUpperCase()] = value;
        });
      }
      
      // Create subscriber in Brevo
      const contactData = {
        email: subscriber.email,
        attributes,
        updateEnabled: true // Update if contact already exists
      };
      
      // Use list ID from param, or default from config
      const targetListId = listId || this.config.defaultListId;
      
      // Log if a list ID is provided with additional debug info
      if (targetListId) {
        console.log(`DEBUG: Adding subscriber to Brevo list ID: ${targetListId}`);
        console.log(`DEBUG: Full subscriber data:`, {
          email: subscriber.email,
          name: subscriber.name,
          source: subscriber.source,
          listId: targetListId
        });
      } else {
        console.log('DEBUG: No list ID provided for Brevo. Contact will be added but not assigned to a list.');
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
        console.log(`Brevo contact added/updated successfully: ${subscriber.email}`);
        
        // If listId is provided, add the contact to the specified list
        if (targetListId) {
          try {
            console.log(`Adding contact ${subscriber.email} to Brevo list ID ${targetListId}`);
            
            // Add contact to list
            const listResponse = await fetch(`https://api.brevo.com/v3/contacts/lists/${targetListId}/contacts/add`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'api-key': apiKey
              },
              body: JSON.stringify({
                emails: [subscriber.email]
              })
            });
            
            if (listResponse.ok) {
              const successData = await listResponse.json();
              console.log(`Successfully added ${subscriber.email} to Brevo list ID ${targetListId}`, successData);
            } else {
              const listError = await listResponse.json();
              console.error(`Error adding contact to Brevo list: ${listError.message || listResponse.statusText}`, listError);
            }
          } catch (listError: any) {
            console.error(`Exception adding contact to Brevo list: ${listError.message}`);
          }
        }
        
        return {
          success: true,
          message: `Subscriber successfully added to Brevo: ${subscriber.name || subscriber.email}`
        };
      } else {
        const errorData = await response.json();
        
        // Special case: If the contact already exists, this is not an error for us
        if (response.status === 400 && errorData?.message?.includes('Contact already exist')) {
          console.log(`Contact already exists in Brevo: ${subscriber.email}. This is not an error.`);
          
          // If listId is provided, add the existing contact to the specified list
          if (targetListId) {
            try {
              console.log(`Adding existing contact ${subscriber.email} to Brevo list ID ${targetListId}`);
              
              // Add contact to list
              const listResponse = await fetch(`https://api.brevo.com/v3/contacts/lists/${targetListId}/contacts/add`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'api-key': apiKey
                },
                body: JSON.stringify({
                  emails: [subscriber.email]
                })
              });
              
              if (listResponse.ok) {
                const successData = await listResponse.json();
                console.log(`Successfully added existing contact ${subscriber.email} to Brevo list ID ${targetListId}`, successData);
              } else {
                const listError = await listResponse.json();
                console.error(`Error adding existing contact to Brevo list: ${listError.message || listResponse.statusText}`, listError);
              }
            } catch (listError: any) {
              console.error(`Exception adding existing contact to Brevo list: ${listError.message}`);
            }
          }
          
          return {
            success: true,
            message: `Subscriber already exists in Brevo: ${subscriber.name || subscriber.email}`
          };
        }
        
        console.error('Brevo API error:', errorData);
        return {
          success: false,
          message: `Failed to add subscriber to Brevo`,
          error: `Brevo error: ${response.status} - ${errorData.message || response.statusText}`
        };
      }
    } catch (error: any) {
      console.error('Error adding subscriber to Brevo:', error);
      return {
        success: false,
        message: `Failed to add subscriber to Brevo`,
        error: `Brevo exception: ${error.message}`
      };
    }
  }

  /**
   * Remove a subscriber from Brevo
   * @param email The email of the subscriber to remove
   * @param listId Optional list ID to remove from (if not provided, removes from all lists)
   */
  async removeSubscriber(
    email: string,
    listId?: string
  ): Promise<SubscriberResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      // If list ID is provided, just remove from that list
      if (listId) {
        const response = await fetch(`https://api.brevo.com/v3/contacts/lists/${listId}/contacts/remove`, {
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
        
        if (response.ok) {
          return {
            success: true,
            message: `Subscriber removed from list ${listId}`
          };
        } else {
          const errorData = await response.json();
          return {
            success: false,
            message: `Failed to remove subscriber from list`,
            error: `Brevo error: ${response.status} - ${errorData.message || response.statusText}`
          };
        }
      } else {
        // Without a list ID, remove the contact entirely
        const response = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'api-key': apiKey
          }
        });
        
        if (response.ok) {
          return {
            success: true,
            message: `Subscriber removed from Brevo`
          };
        } else {
          const errorData = await response.json();
          return {
            success: false,
            message: `Failed to remove subscriber from Brevo`,
            error: `Brevo error: ${response.status} - ${errorData.message || response.statusText}`
          };
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to remove subscriber from Brevo`,
        error: `Brevo exception: ${error.message}`
      };
    }
  }

  /**
   * Update a subscriber in Brevo
   * @param subscriber The updated subscriber info
   * @param listId Optional list ID
   */
  async updateSubscriber(
    subscriber: EmailSubscriber,
    listId?: string
  ): Promise<SubscriberResponse> {
    // Brevo's addSubscriber already handles updates
    return this.addSubscriber(subscriber, listId);
  }

  /**
   * Get all lists from Brevo
   */
  async getLists(): Promise<ListResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      const response = await fetch('https://api.brevo.com/v3/contacts/lists', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'api-key': apiKey
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Retrieved ${data.lists?.length || 0} lists from Brevo`,
          listInfo: data
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          message: `Failed to retrieve lists from Brevo`,
          error: `Brevo error: ${response.status} - ${errorData.message || response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to retrieve lists from Brevo`,
        error: `Brevo exception: ${error.message}`
      };
    }
  }

  /**
   * Get a specific list from Brevo
   * @param listId The ID of the list to retrieve
   */
  async getList(listId: string): Promise<ListResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      const response = await fetch(`https://api.brevo.com/v3/contacts/lists/${listId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'api-key': apiKey
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Retrieved list ${listId} from Brevo`,
          listId: listId,
          listInfo: data
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          message: `Failed to retrieve list ${listId} from Brevo`,
          error: `Brevo error: ${response.status} - ${errorData.message || response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to retrieve list ${listId} from Brevo`,
        error: `Brevo exception: ${error.message}`
      };
    }
  }

  /**
   * Create a new list in Brevo
   * @param name The name of the list to create
   * @param options Additional options
   */
  async createList(name: string, options?: any): Promise<ListResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      const response = await fetch('https://api.brevo.com/v3/contacts/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          name: name,
          folderId: options?.folderId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Created list "${name}" in Brevo`,
          listId: data.id?.toString(),
          listInfo: data
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          message: `Failed to create list "${name}" in Brevo`,
          error: `Brevo error: ${response.status} - ${errorData.message || response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to create list "${name}" in Brevo`,
        error: `Brevo exception: ${error.message}`
      };
    }
  }

  /**
   * Send an email through Brevo
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
      const toField = recipients.map(email => ({
        email,
        name: email
      }));
      
      // Build Brevo email request
      const emailData: any = {
        sender: {
          name: options?.from?.name || defaultSenderName,
          email: options?.from?.email || defaultSenderEmail
        },
        to: toField,
        subject,
        htmlContent,
        textContent: textContent || ''
      };
      
      // Add reply-to if specified
      if (options?.replyTo) {
        emailData.replyTo = {
          name: options.replyTo.name || options.replyTo.email,
          email: options.replyTo.email
        };
      }
      
      // Add attachments if specified
      if (options?.attachments && options.attachments.length > 0) {
        emailData.attachment = options.attachments.map(attachment => {
          // If content is a Buffer, convert to base64
          const content = attachment.content instanceof Buffer
            ? attachment.content.toString('base64')
            : attachment.content;
            
          return {
            name: attachment.filename,
            content,
            contentType: attachment.contentType
          };
        });
      }
      
      // Add custom variables
      if (options?.customVars) {
        emailData.params = options.customVars;
      }
      
      // Send request to Brevo API
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify(emailData)
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Email sent successfully to ${Array.isArray(to) ? to.join(', ') : to}`,
          emailId: data.messageId
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          message: `Failed to send email`,
          error: `Brevo error: ${response.status} - ${errorData.message || response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to send email`,
        error: `Brevo exception: ${error.message}`
      };
    }
  }
}