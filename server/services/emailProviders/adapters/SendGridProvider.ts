import { 
  BaseEmailServiceProvider, 
  EmailProviderConfig, 
  EmailSubscriber, 
  SubscriberResponse, 
  ListResponse, 
  EmailResponse 
} from '../interfaces';

/**
 * SendGrid Email Service Provider Implementation
 */
export class SendGridProvider extends BaseEmailServiceProvider {
  readonly name = 'sendgrid';
  readonly displayName = 'SendGrid';
  readonly description = 'Twilio SendGrid email marketing service';
  readonly iconUrl = '/images/providers/sendgrid-logo.svg';
  readonly configFields = [
    {
      name: 'apiKey',
      displayName: 'API Key',
      type: 'string' as const,
      required: true,
      secret: true,
      description: 'SendGrid API key with marketing access permissions'
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
   * Validate SendGrid API key format (minimal validation)
   * @param apiKey The API key to validate
   * @returns True if the key appears to be valid
   */
  private validateApiKey(apiKey: string): boolean {
    // SendGrid API keys usually start with SG. and are fairly long
    return typeof apiKey === 'string' && apiKey.length >= 20;
  }

  /**
   * Test connection to SendGrid API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const apiKey = this.config.apiKey;
      
      // API key format validation
      if (!this.validateApiKey(apiKey)) {
        return {
          success: false,
          message: 'Invalid SendGrid API key format. It should be at least 20 characters long.'
        };
      }

      // Test API key by making a request to the SendGrid API
      const response = await fetch('https://api.sendgrid.com/v3/marketing/lists', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const listCount = data.result?.length || 0;
        
        return {
          success: true,
          message: `Successfully connected to SendGrid API! Found ${listCount} marketing lists.`
        };
      } else {
        const errorData = await response.json();
        console.error('SendGrid API test error:', errorData);
        return {
          success: false,
          message: `SendGrid API error: ${response.status} - ${
            errorData.message || response.statusText
          }`
        };
      }
    } catch (error: any) {
      console.error('Error testing SendGrid connection:', error);
      return {
        success: false,
        message: `SendGrid connection error: ${error.message}`
      };
    }
  }

  /**
   * Add a subscriber to SendGrid
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
          message: 'Invalid SendGrid API key format',
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
      
      // Use list ID from param, or default from config
      const targetListId = listId || this.config.defaultListId;
      if (!targetListId) {
        console.log('No list ID provided for SendGrid. Consider providing a default list ID in the configuration.');
      }
      
      // Create contact in SendGrid
      const contactData = {
        contacts: [
          {
            email: subscriber.email,
            first_name: firstName,
            last_name: lastName,
            // Add any custom fields
            ...(subscriber.customFields || {}),
            // Add source if provided
            source: subscriber.source || 'api'
          }
        ]
      };
      
      // If list ID is provided, we'll add to that list
      let requestUrl = 'https://api.sendgrid.com/v3/marketing/contacts';
      if (targetListId) {
        requestUrl = `https://api.sendgrid.com/v3/marketing/contacts`;
        contactData['list_ids'] = [targetListId];
      }
      
      // Log debug information
      console.log(`DEBUG: Adding subscriber to SendGrid${targetListId ? ` list ID: ${targetListId}` : ''}`);
      console.log(`DEBUG: Full subscriber data:`, {
        email: subscriber.email,
        name: subscriber.name,
        source: subscriber.source,
        listId: targetListId
      });
      
      // Send the request to SendGrid API
      const response = await fetch(requestUrl, {
        method: 'PUT', // SendGrid uses PUT to upsert contacts
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(contactData)
      });
      
      // Handle response
      if (response.ok || response.status === 202) {
        // SendGrid often returns 202 Accepted for async operations
        console.log(`SendGrid contact added/updated successfully: ${subscriber.email}`);
        
        return {
          success: true,
          message: `Subscriber successfully ${targetListId ? 'added to SendGrid list' : 'created in SendGrid'}: ${subscriber.name || subscriber.email}`
        };
      } else {
        // Handle error
        let errorMessage = `SendGrid error: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('SendGrid API error:', errorData);
          errorMessage = `SendGrid error: ${response.status} - ${
            errorData.message || errorData.errors?.[0]?.message || response.statusText
          }`;
        } catch (jsonError) {
          errorMessage = `SendGrid error: ${response.status} - ${response.statusText}`;
        }
        
        return {
          success: false,
          message: `Failed to add subscriber to SendGrid`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Error adding subscriber to SendGrid:', error);
      return {
        success: false,
        message: `Failed to add subscriber to SendGrid`,
        error: `SendGrid exception: ${error.message}`
      };
    }
  }

  /**
   * Remove a subscriber from SendGrid
   * @param email The email of the subscriber to remove
   * @param listId Optional list ID to remove from (if not provided, removes from all lists)
   */
  async removeSubscriber(
    email: string,
    listId?: string
  ): Promise<SubscriberResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      // If list ID is provided, just remove from that list, otherwise delete contact
      if (listId) {
        // Remove from specific list
        const response = await fetch(`https://api.sendgrid.com/v3/marketing/lists/${listId}/contacts`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            contact_ids: [],
            emails: [email]
          })
        });
        
        if (response.ok || response.status === 202) {
          return {
            success: true,
            message: `Subscriber removed from SendGrid list ${listId}`
          };
        } else {
          let errorMessage = `SendGrid error: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = `SendGrid error: ${response.status} - ${
              errorData.message || errorData.errors?.[0]?.message || response.statusText
            }`;
          } catch (jsonError) {}
          
          return {
            success: false,
            message: `Failed to remove subscriber from SendGrid list`,
            error: errorMessage
          };
        }
      } else {
        // Delete contact entirely - search for the contact first to get its ID
        const searchResponse = await fetch(`https://api.sendgrid.com/v3/marketing/contacts/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            query: `email LIKE '${email.replace(/'/g, "''")}'`
          })
        });
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          const contactId = searchData.result?.[0]?.id;
          
          if (contactId) {
            // Delete the contact
            const deleteResponse = await fetch(`https://api.sendgrid.com/v3/marketing/contacts`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                ids: [contactId]
              })
            });
            
            if (deleteResponse.ok || deleteResponse.status === 202) {
              return {
                success: true,
                message: `Subscriber removed from SendGrid`
              };
            } else {
              let errorMessage = `SendGrid error: ${deleteResponse.status}`;
              try {
                const errorData = await deleteResponse.json();
                errorMessage = `SendGrid error: ${deleteResponse.status} - ${
                  errorData.message || errorData.errors?.[0]?.message || deleteResponse.statusText
                }`;
              } catch (jsonError) {}
              
              return {
                success: false,
                message: `Failed to remove subscriber from SendGrid`,
                error: errorMessage
              };
            }
          } else {
            return {
              success: false,
              message: `Failed to remove subscriber from SendGrid`,
              error: `Contact not found`
            };
          }
        } else {
          let errorMessage = `SendGrid error: ${searchResponse.status}`;
          try {
            const errorData = await searchResponse.json();
            errorMessage = `SendGrid error: ${searchResponse.status} - ${
              errorData.message || errorData.errors?.[0]?.message || searchResponse.statusText
            }`;
          } catch (jsonError) {}
          
          return {
            success: false,
            message: `Failed to search for subscriber in SendGrid`,
            error: errorMessage
          };
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to remove subscriber from SendGrid`,
        error: `SendGrid exception: ${error.message}`
      };
    }
  }

  /**
   * Update a subscriber in SendGrid
   * @param subscriber The updated subscriber info
   * @param listId Optional list ID
   */
  async updateSubscriber(
    subscriber: EmailSubscriber,
    listId?: string
  ): Promise<SubscriberResponse> {
    // SendGrid's addSubscriber already handles updates (upsert)
    return this.addSubscriber(subscriber, listId);
  }

  /**
   * Get all lists from SendGrid
   */
  async getLists(): Promise<ListResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      const response = await fetch('https://api.sendgrid.com/v3/marketing/lists', {
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
          message: `Retrieved ${data.result?.length || 0} lists from SendGrid`,
          listInfo: data.result
        };
      } else {
        let errorMessage = `SendGrid error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `SendGrid error: ${response.status} - ${
            errorData.message || errorData.errors?.[0]?.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to retrieve lists from SendGrid`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to retrieve lists from SendGrid`,
        error: `SendGrid exception: ${error.message}`
      };
    }
  }

  /**
   * Get a specific list from SendGrid
   * @param listId The ID of the list to retrieve
   */
  async getList(listId: string): Promise<ListResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      const response = await fetch(`https://api.sendgrid.com/v3/marketing/lists/${listId}`, {
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
          message: `Retrieved list ${listId} from SendGrid`,
          listId: listId,
          listInfo: data
        };
      } else {
        let errorMessage = `SendGrid error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `SendGrid error: ${response.status} - ${
            errorData.message || errorData.errors?.[0]?.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to retrieve list ${listId} from SendGrid`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to retrieve list ${listId} from SendGrid`,
        error: `SendGrid exception: ${error.message}`
      };
    }
  }

  /**
   * Create a new list in SendGrid
   * @param name The name of the list to create
   * @param options Additional options
   */
  async createList(name: string, options?: any): Promise<ListResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      const response = await fetch('https://api.sendgrid.com/v3/marketing/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          name: name
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Created list "${name}" in SendGrid`,
          listId: data.id,
          listInfo: data
        };
      } else {
        let errorMessage = `SendGrid error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `SendGrid error: ${response.status} - ${
            errorData.message || errorData.errors?.[0]?.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to create list "${name}" in SendGrid`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to create list "${name}" in SendGrid`,
        error: `SendGrid exception: ${error.message}`
      };
    }
  }

  /**
   * Send an email through SendGrid
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
      const personalizationObj = {
        to: recipients.map(email => ({
          email,
          name: email
        }))
      };
      
      // Add custom variables if provided
      if (options?.customVars) {
        personalizationObj['dynamic_template_data'] = options.customVars;
      }
      
      // Build SendGrid email request
      const emailData: any = {
        personalizations: [personalizationObj],
        from: {
          name: options?.from?.name || defaultSenderName,
          email: options?.from?.email || defaultSenderEmail
        },
        subject,
        content: [
          {
            type: 'text/html',
            value: htmlContent
          }
        ]
      };
      
      // Add plain text content if provided
      if (textContent) {
        emailData.content.push({
          type: 'text/plain',
          value: textContent
        });
      }
      
      // Add reply-to if specified
      if (options?.replyTo) {
        emailData.reply_to = {
          name: options.replyTo.name || options.replyTo.email,
          email: options.replyTo.email
        };
      }
      
      // Add attachments if specified
      if (options?.attachments && options.attachments.length > 0) {
        emailData.attachments = options.attachments.map(attachment => {
          // If content is a Buffer, convert to base64
          const content = attachment.content instanceof Buffer
            ? attachment.content.toString('base64')
            : attachment.content;
            
          return {
            filename: attachment.filename,
            content,
            type: attachment.contentType || 'application/octet-stream',
            disposition: 'attachment'
          };
        });
      }
      
      // Send request to SendGrid API
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(emailData)
      });
      
      if (response.ok || response.status === 202) {
        // SendGrid returns 202 Accepted for successful email sends
        return {
          success: true,
          message: `Email sent successfully to ${Array.isArray(to) ? to.join(', ') : to}`
        };
      } else {
        let errorMessage = `SendGrid error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `SendGrid error: ${response.status} - ${
            errorData.message || errorData.errors?.[0]?.message || response.statusText
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
        error: `SendGrid exception: ${error.message}`
      };
    }
  }
}