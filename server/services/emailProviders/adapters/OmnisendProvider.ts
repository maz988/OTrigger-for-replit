import { 
  BaseEmailServiceProvider, 
  EmailProviderConfig, 
  EmailSubscriber, 
  SubscriberResponse, 
  ListResponse, 
  EmailResponse 
} from '../interfaces';

/**
 * Omnisend Email Service Provider Implementation
 */
export class OmnisendProvider extends BaseEmailServiceProvider {
  readonly name = 'omnisend';
  readonly displayName = 'Omnisend';
  readonly description = 'Omnisend email marketing and automation platform';
  readonly iconUrl = '/images/providers/omnisend-logo.svg';
  readonly configFields = [
    {
      name: 'apiKey',
      displayName: 'API Key',
      type: 'string' as const,
      required: true,
      secret: true,
      description: 'Omnisend API key from your account settings'
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
   * Validate API key format (minimal validation)
   * @param apiKey The API key to validate
   * @returns True if the key appears to be valid
   */
  private validateApiKey(apiKey: string): boolean {
    return typeof apiKey === 'string' && apiKey.length > 10;
  }

  /**
   * Test connection to Omnisend API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const apiKey = this.config.apiKey;
      
      // API key format validation
      if (!this.validateApiKey(apiKey)) {
        return {
          success: false,
          message: 'Invalid Omnisend API key format.'
        };
      }

      // Test API key by making a request to the Omnisend API
      const response = await fetch('https://api.omnisend.com/v3/contacts', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': apiKey
        }
      });

      if (response.ok) {
        return {
          success: true,
          message: `Successfully connected to Omnisend API!`
        };
      } else {
        let errorMessage = `Omnisend error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `Omnisend error: ${response.status} - ${
            errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        console.error('Omnisend API test error:', errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Error testing Omnisend connection:', error);
      return {
        success: false,
        message: `Omnisend connection error: ${error.message}`
      };
    }
  }

  /**
   * Add a subscriber to Omnisend
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
          message: 'Invalid Omnisend API key format',
          error: 'Invalid API key'
        };
      }
      
      // Create subscriber in Omnisend
      const contactData: any = {
        identifiers: [
          { type: 'email', id: subscriber.email, channels: { email: { status: 'subscribed' } } }
        ],
        firstName: subscriber.firstName || '',
        lastName: subscriber.lastName || '',
        tags: subscriber.tags || []
      };
      
      // If first/last aren't provided but name is, split it
      if (!contactData.firstName && !contactData.lastName && subscriber.name) {
        const nameParts = subscriber.name.split(' ');
        contactData.firstName = nameParts[0] || '';
        contactData.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      }
      
      // Add custom fields
      if (subscriber.customFields) {
        contactData.customProperties = subscriber.customFields;
      }
      
      // Add source as tag if available
      if (subscriber.source) {
        contactData.tags = contactData.tags || [];
        contactData.tags.push(subscriber.source);
      }
      
      // Get target list ID
      const targetListId = listId || this.config.defaultListId;
      
      // Create the contact
      const response = await fetch('https://api.omnisend.com/v3/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-KEY': apiKey
        },
        body: JSON.stringify(contactData)
      });
      
      if (!response.ok) {
        let errorMessage = `Omnisend error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `Omnisend error: ${response.status} - ${
            errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        console.error('Omnisend API error:', errorMessage);
        return {
          success: false,
          message: `Failed to add subscriber to Omnisend`,
          error: errorMessage
        };
      }
      
      const contactResult = await response.json();
      
      // If list ID provided, add the contact to that list
      if (targetListId) {
        const listResponse = await fetch(`https://api.omnisend.com/v3/contacts/${contactResult.contactID}/lists/${targetListId}`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'X-API-KEY': apiKey
          }
        });
        
        if (!listResponse.ok) {
          console.warn(`Successfully created contact but failed to add to list ${targetListId}:`, await listResponse.text());
        }
      }
      
      return {
        success: true,
        message: `Subscriber successfully added to Omnisend: ${subscriber.email}`,
        subscriberId: contactResult.contactID
      };
    } catch (error: any) {
      console.error('Error adding subscriber to Omnisend:', error);
      return {
        success: false,
        message: `Failed to add subscriber to Omnisend`,
        error: `Omnisend exception: ${error.message}`
      };
    }
  }

  /**
   * Remove a subscriber from Omnisend
   * @param email The email of the subscriber to remove
   * @param listId Optional list ID to remove the subscriber from
   */
  async removeSubscriber(
    email: string,
    listId?: string
  ): Promise<SubscriberResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      // First, find the contact by email
      const findResponse = await fetch(`https://api.omnisend.com/v3/contacts?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': apiKey
        }
      });
      
      if (!findResponse.ok) {
        return {
          success: false,
          message: `Failed to find subscriber in Omnisend`,
          error: `Omnisend error: ${findResponse.status}`
        };
      }
      
      const findResult = await findResponse.json();
      
      if (!findResult.contacts || findResult.contacts.length === 0) {
        return {
          success: true,
          message: `Subscriber not found in Omnisend: ${email}`
        };
      }
      
      const contactId = findResult.contacts[0].contactID;
      
      // If list ID is provided, remove from specific list
      if (listId) {
        const listResponse = await fetch(`https://api.omnisend.com/v3/contacts/${contactId}/lists/${listId}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'X-API-KEY': apiKey
          }
        });
        
        if (listResponse.ok) {
          return {
            success: true,
            message: `Subscriber removed from Omnisend list: ${email}`
          };
        } else {
          let errorMessage = `Omnisend error: ${listResponse.status}`;
          try {
            const errorData = await listResponse.json();
            errorMessage = `Omnisend error: ${listResponse.status} - ${
              errorData.message || listResponse.statusText
            }`;
          } catch (jsonError) {}
          
          return {
            success: false,
            message: `Failed to remove subscriber from Omnisend list`,
            error: errorMessage
          };
        }
      } else {
        // For full unsubscribe, update channel status
        const updateResponse = await fetch(`https://api.omnisend.com/v3/contacts/${contactId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-API-KEY': apiKey
          },
          body: JSON.stringify({
            identifiers: [
              { type: 'email', id: email, channels: { email: { status: 'unsubscribed' } } }
            ]
          })
        });
        
        if (updateResponse.ok) {
          return {
            success: true,
            message: `Subscriber unsubscribed from Omnisend: ${email}`
          };
        } else {
          let errorMessage = `Omnisend error: ${updateResponse.status}`;
          try {
            const errorData = await updateResponse.json();
            errorMessage = `Omnisend error: ${updateResponse.status} - ${
              errorData.message || updateResponse.statusText
            }`;
          } catch (jsonError) {}
          
          return {
            success: false,
            message: `Failed to unsubscribe subscriber from Omnisend`,
            error: errorMessage
          };
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to remove subscriber from Omnisend`,
        error: `Omnisend exception: ${error.message}`
      };
    }
  }

  /**
   * Update a subscriber in Omnisend
   * @param subscriber The updated subscriber info
   * @param listId Optional list ID
   */
  async updateSubscriber(
    subscriber: EmailSubscriber,
    listId?: string
  ): Promise<SubscriberResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      // First, find the contact by email
      const findResponse = await fetch(`https://api.omnisend.com/v3/contacts?email=${encodeURIComponent(subscriber.email)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': apiKey
        }
      });
      
      if (!findResponse.ok) {
        return {
          success: false,
          message: `Failed to find subscriber in Omnisend`,
          error: `Omnisend error: ${findResponse.status}`
        };
      }
      
      const findResult = await findResponse.json();
      
      if (!findResult.contacts || findResult.contacts.length === 0) {
        // Contact doesn't exist, create it
        return this.addSubscriber(subscriber, listId);
      }
      
      const contactId = findResult.contacts[0].contactID;
      
      // Update the contact
      const contactData: any = {
        firstName: subscriber.firstName || '',
        lastName: subscriber.lastName || '',
        tags: subscriber.tags || []
      };
      
      // If first/last aren't provided but name is, split it
      if (!contactData.firstName && !contactData.lastName && subscriber.name) {
        const nameParts = subscriber.name.split(' ');
        contactData.firstName = nameParts[0] || '';
        contactData.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      }
      
      // Add custom fields
      if (subscriber.customFields) {
        contactData.customProperties = subscriber.customFields;
      }
      
      // Add source as tag if available
      if (subscriber.source) {
        contactData.tags = contactData.tags || [];
        contactData.tags.push(subscriber.source);
      }
      
      const updateResponse = await fetch(`https://api.omnisend.com/v3/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-KEY': apiKey
        },
        body: JSON.stringify(contactData)
      });
      
      if (!updateResponse.ok) {
        let errorMessage = `Omnisend error: ${updateResponse.status}`;
        try {
          const errorData = await updateResponse.json();
          errorMessage = `Omnisend error: ${updateResponse.status} - ${
            errorData.message || updateResponse.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to update subscriber in Omnisend`,
          error: errorMessage
        };
      }
      
      // If list ID provided, add the contact to that list
      if (listId) {
        const listResponse = await fetch(`https://api.omnisend.com/v3/contacts/${contactId}/lists/${listId}`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'X-API-KEY': apiKey
          }
        });
        
        if (!listResponse.ok) {
          console.warn(`Successfully updated contact but failed to add to list ${listId}:`, await listResponse.text());
        }
      }
      
      return {
        success: true,
        message: `Subscriber successfully updated in Omnisend: ${subscriber.email}`,
        subscriberId: contactId
      };
    } catch (error: any) {
      console.error('Error updating subscriber in Omnisend:', error);
      return {
        success: false,
        message: `Failed to update subscriber in Omnisend`,
        error: `Omnisend exception: ${error.message}`
      };
    }
  }

  /**
   * Get all lists from Omnisend
   */
  async getLists(): Promise<ListResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      const response = await fetch('https://api.omnisend.com/v3/lists', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': apiKey
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Retrieved ${data.lists?.length || 0} lists from Omnisend`,
          listInfo: data.lists
        };
      } else {
        let errorMessage = `Omnisend error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `Omnisend error: ${response.status} - ${
            errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to retrieve lists from Omnisend`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to retrieve lists from Omnisend`,
        error: `Omnisend exception: ${error.message}`
      };
    }
  }

  /**
   * Get a specific list from Omnisend
   * @param listId The ID of the list to retrieve
   */
  async getList(listId: string): Promise<ListResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      const response = await fetch(`https://api.omnisend.com/v3/lists/${listId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': apiKey
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Retrieved list ${listId} from Omnisend`,
          listId: listId,
          listInfo: data
        };
      } else {
        let errorMessage = `Omnisend error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `Omnisend error: ${response.status} - ${
            errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to retrieve list ${listId} from Omnisend`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to retrieve list ${listId} from Omnisend`,
        error: `Omnisend exception: ${error.message}`
      };
    }
  }

  /**
   * Create a new list in Omnisend
   * @param name The name of the list to create
   */
  async createList(name: string): Promise<ListResponse> {
    try {
      const apiKey = this.config.apiKey;
      
      const response = await fetch('https://api.omnisend.com/v3/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-KEY': apiKey
        },
        body: JSON.stringify({
          name: name
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Created list "${name}" in Omnisend`,
          listId: data.listID,
          listInfo: data
        };
      } else {
        let errorMessage = `Omnisend error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `Omnisend error: ${response.status} - ${
            errorData.message || response.statusText
          }`;
        } catch (jsonError) {}
        
        return {
          success: false,
          message: `Failed to create list "${name}" in Omnisend`,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to create list "${name}" in Omnisend`,
        error: `Omnisend exception: ${error.message}`
      };
    }
  }

  /**
   * Send an email through Omnisend
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
      
      // Build Omnisend email request data
      const emailData: any = {
        sender: {
          email: options?.from?.email || defaultSenderEmail,
          name: options?.from?.name || defaultSenderName
        },
        recipients: recipients.map(email => ({ email })),
        subject: subject,
        content: {
          html: htmlContent,
          plain: textContent || ''
        }
      };
      
      // Add reply-to if specified
      if (options?.replyTo) {
        emailData.replyTo = {
          email: options.replyTo.email,
          name: options.replyTo.name || ''
        };
      }
      
      // Unfortunately, Omnisend doesn't have a simple transactional email API
      // This API is a simplified approximation - in a real implementation,
      // you might need to use their campaign API or a different approach
      
      // For this example, we'll use a mock "send" endpoint
      const response = await fetch('https://api.omnisend.com/v3/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-KEY': apiKey
        },
        body: JSON.stringify(emailData)
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Email sent successfully to ${recipients.length} recipient(s)`,
          emailId: data.id
        };
      } else {
        let errorMessage = `Omnisend error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = `Omnisend error: ${response.status} - ${
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
        error: `Omnisend exception: ${error.message}`
      };
    }
  }
}