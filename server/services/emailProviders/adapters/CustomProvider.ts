/**
 * Custom Email Provider Adapter
 * 
 * This adapter allows for dynamic configuration of custom email providers
 * through a generic API-based implementation.
 */

import axios, { AxiosRequestConfig } from 'axios';
import { 
  BaseEmailServiceProvider, 
  EmailProviderConfig, 
  EmailSubscriber, 
  EmailResponse, 
  ListResponse, 
  SubscriberResponse, 
  ConfigField 
} from '../interfaces';

export interface CustomProviderConfig extends EmailProviderConfig {
  api_base_url: string;
  api_key_field: string;
  auth_header: string;
  auth_method: 'bearer' | 'basic' | 'api_key' | 'query_param';
  data_format: 'json' | 'form' | 'xml';
  sender_email: string;
  sender_name: string;
  
  // Endpoint mappings
  subscribe_endpoint?: string;
  unsubscribe_endpoint?: string;
  get_lists_endpoint?: string;
  send_email_endpoint?: string;
  
  // Custom headers
  custom_headers?: Record<string, string>;
}

export class CustomProvider extends BaseEmailServiceProvider {
  name: string;
  displayName: string;
  description: string;
  iconUrl: string;
  configFields: ConfigField[];

  constructor(
    name: string,
    displayName: string,
    description: string,
    iconUrl: string,
    configFields: ConfigField[] = []
  ) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.description = description;
    this.iconUrl = iconUrl || `/images/email-providers/${name}.svg`;
    
    // Merge default config fields with provided fields
    this.configFields = [
      {
        name: 'api_key',
        displayName: 'API Key',
        type: 'string',
        required: true,
        secret: true,
        description: `Your ${displayName} API key`
      },
      {
        name: 'api_base_url',
        displayName: 'API Base URL',
        type: 'string',
        required: true,
        description: 'Base URL for API requests'
      },
      {
        name: 'api_key_field',
        displayName: 'API Key Field',
        type: 'string',
        required: true,
        default: 'api_key',
        description: 'Field name for the API key'
      },
      {
        name: 'auth_header',
        displayName: 'Auth Header',
        type: 'string',
        required: true,
        default: 'Authorization',
        description: 'Header used for authentication'
      },
      {
        name: 'auth_method',
        displayName: 'Auth Method',
        type: 'select',
        required: true,
        default: 'bearer',
        description: 'Authentication method',
        options: [
          { value: 'bearer', label: 'Bearer Token' },
          { value: 'basic', label: 'Basic Auth' },
          { value: 'api_key', label: 'API Key in Header' },
          { value: 'query_param', label: 'Query Parameter' }
        ]
      },
      {
        name: 'data_format',
        displayName: 'Data Format',
        type: 'select',
        required: true,
        default: 'json',
        description: 'Format used for API requests',
        options: [
          { value: 'json', label: 'JSON' },
          { value: 'form', label: 'Form Data' },
          { value: 'xml', label: 'XML' }
        ]
      },
      {
        name: 'sender_email',
        displayName: 'Sender Email',
        type: 'string',
        required: true,
        description: 'Default sender email address'
      },
      {
        name: 'sender_name',
        displayName: 'Sender Name',
        type: 'string',
        required: true,
        description: 'Default sender name'
      },
      {
        name: 'subscribe_endpoint',
        displayName: 'Subscribe Endpoint',
        type: 'string',
        required: false,
        description: 'API endpoint for adding subscribers (relative to base URL)'
      },
      {
        name: 'unsubscribe_endpoint',
        displayName: 'Unsubscribe Endpoint',
        type: 'string',
        required: false,
        description: 'API endpoint for removing subscribers (relative to base URL)'
      },
      {
        name: 'get_lists_endpoint',
        displayName: 'Get Lists Endpoint',
        type: 'string',
        required: false,
        description: 'API endpoint for retrieving lists (relative to base URL)'
      },
      {
        name: 'send_email_endpoint',
        displayName: 'Send Email Endpoint',
        type: 'string',
        required: false,
        description: 'API endpoint for sending emails (relative to base URL)'
      },
      ...configFields
    ];
  }

  private getRequestConfig(): AxiosRequestConfig {
    const providerConfig = this.config as CustomProviderConfig;
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        ...providerConfig.custom_headers
      }
    };

    // Set up authentication based on method
    switch (providerConfig.auth_method) {
      case 'bearer':
        config.headers![providerConfig.auth_header || 'Authorization'] = `Bearer ${providerConfig.apiKey}`;
        break;
      case 'basic':
        config.headers![providerConfig.auth_header || 'Authorization'] = `Basic ${Buffer.from(providerConfig.apiKey).toString('base64')}`;
        break;
      case 'api_key':
        config.headers![providerConfig.auth_header || 'X-API-Key'] = providerConfig.apiKey;
        break;
      case 'query_param':
        config.params = {
          [providerConfig.api_key_field || 'api_key']: providerConfig.apiKey
        };
        break;
    }

    return config;
  }

  private getBaseUrl(): string {
    const providerConfig = this.config as CustomProviderConfig;
    return providerConfig.api_base_url || '';
  }

  /**
   * Test the connection to the email service
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const providerConfig = this.config as CustomProviderConfig;
      const requestConfig = this.getRequestConfig();
      
      // Try to get lists as a basic test
      if (providerConfig.get_lists_endpoint) {
        const response = await axios.get(
          `${this.getBaseUrl()}${providerConfig.get_lists_endpoint}`,
          requestConfig
        );
        
        if (response.status >= 200 && response.status < 300) {
          return { 
            success: true, 
            message: `Successfully connected to ${this.displayName}` 
          };
        }
      } else {
        // If no lists endpoint, just test the base URL
        const response = await axios.get(
          this.getBaseUrl(),
          requestConfig
        );
        
        if (response.status >= 200 && response.status < 300) {
          return { 
            success: true, 
            message: `Successfully connected to ${this.displayName}` 
          };
        }
      }
      
      return { 
        success: false, 
        message: `Connection test failed: Invalid response from server` 
      };
    } catch (error: any) {
      console.error(`${this.displayName} connection test error:`, error.message);
      return { 
        success: false, 
        message: `Connection test failed: ${error.message || 'Unknown error'}` 
      };
    }
  }

  /**
   * Add a subscriber to a list
   */
  async addSubscriber(subscriber: EmailSubscriber, listId?: string): Promise<SubscriberResponse> {
    try {
      const providerConfig = this.config as CustomProviderConfig;
      
      if (!providerConfig.subscribe_endpoint) {
        return {
          success: false,
          message: 'Subscribe endpoint not configured',
          error: 'MISSING_ENDPOINT'
        };
      }
      
      const requestConfig = this.getRequestConfig();
      const endpoint = `${this.getBaseUrl()}${providerConfig.subscribe_endpoint}`;
      
      // Prepare data according to format
      let data: any = {
        email: subscriber.email,
        first_name: subscriber.firstName || subscriber.name || '',
        last_name: subscriber.lastName || '',
        list_id: listId || providerConfig.defaultListId
      };
      
      // Add source if provided
      if (subscriber.source) {
        data.source = subscriber.source;
      }
      
      // Add tags if provided
      if (subscriber.tags && subscriber.tags.length > 0) {
        data.tags = subscriber.tags;
      }
      
      // Add custom fields if provided
      if (subscriber.customFields) {
        data = { ...data, ...subscriber.customFields };
      }
      
      const response = await axios.post(endpoint, data, requestConfig);
      
      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          message: `Subscriber added to ${this.displayName}`,
          subscriberId: response.data?.id || 'unknown'
        };
      }
      
      return {
        success: false,
        message: `Failed to add subscriber: ${response.statusText}`,
        error: `HTTP_ERROR_${response.status}`
      };
    } catch (error: any) {
      console.error(`${this.displayName} add subscriber error:`, error.message);
      return {
        success: false,
        message: `Failed to add subscriber: ${error.message || 'Unknown error'}`,
        error: error.code || 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Remove a subscriber from a list
   */
  async removeSubscriber(email: string, listId?: string): Promise<SubscriberResponse> {
    try {
      const providerConfig = this.config as CustomProviderConfig;
      
      if (!providerConfig.unsubscribe_endpoint) {
        return {
          success: false,
          message: 'Unsubscribe endpoint not configured',
          error: 'MISSING_ENDPOINT'
        };
      }
      
      const requestConfig = this.getRequestConfig();
      const endpoint = `${this.getBaseUrl()}${providerConfig.unsubscribe_endpoint}`;
      
      // Prepare data according to format
      const data: any = {
        email: email,
        list_id: listId || providerConfig.defaultListId
      };
      
      const response = await axios.post(endpoint, data, requestConfig);
      
      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          message: `Subscriber removed from ${this.displayName}`
        };
      }
      
      return {
        success: false,
        message: `Failed to remove subscriber: ${response.statusText}`,
        error: `HTTP_ERROR_${response.status}`
      };
    } catch (error: any) {
      console.error(`${this.displayName} remove subscriber error:`, error.message);
      return {
        success: false,
        message: `Failed to remove subscriber: ${error.message || 'Unknown error'}`,
        error: error.code || 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Update a subscriber in a list
   */
  async updateSubscriber(subscriber: EmailSubscriber, listId?: string): Promise<SubscriberResponse> {
    // Many providers use the same endpoint for adding and updating
    return this.addSubscriber(subscriber, listId);
  }

  /**
   * Get all lists from the provider
   */
  async getLists(): Promise<ListResponse> {
    try {
      const providerConfig = this.config as CustomProviderConfig;
      
      if (!providerConfig.get_lists_endpoint) {
        return {
          success: false,
          message: 'Get lists endpoint not configured',
          error: 'MISSING_ENDPOINT'
        };
      }
      
      const requestConfig = this.getRequestConfig();
      const endpoint = `${this.getBaseUrl()}${providerConfig.get_lists_endpoint}`;
      
      const response = await axios.get(endpoint, requestConfig);
      
      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          message: `Lists retrieved from ${this.displayName}`,
          listInfo: response.data
        };
      }
      
      return {
        success: false,
        message: `Failed to get lists: ${response.statusText}`,
        error: `HTTP_ERROR_${response.status}`
      };
    } catch (error: any) {
      console.error(`${this.displayName} get lists error:`, error.message);
      return {
        success: false,
        message: `Failed to get lists: ${error.message || 'Unknown error'}`,
        error: error.code || 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Get a specific list from the provider
   */
  async getList(listId: string): Promise<ListResponse> {
    try {
      const providerConfig = this.config as CustomProviderConfig;
      
      if (!providerConfig.get_lists_endpoint) {
        return {
          success: false,
          message: 'Get lists endpoint not configured',
          error: 'MISSING_ENDPOINT'
        };
      }
      
      const requestConfig = this.getRequestConfig();
      const endpoint = `${this.getBaseUrl()}${providerConfig.get_lists_endpoint}/${listId}`;
      
      const response = await axios.get(endpoint, requestConfig);
      
      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          message: `List retrieved from ${this.displayName}`,
          listId: listId,
          listInfo: response.data
        };
      }
      
      return {
        success: false,
        message: `Failed to get list: ${response.statusText}`,
        error: `HTTP_ERROR_${response.status}`
      };
    } catch (error: any) {
      console.error(`${this.displayName} get list error:`, error.message);
      return {
        success: false,
        message: `Failed to get list: ${error.message || 'Unknown error'}`,
        error: error.code || 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Create a new list in the provider
   */
  async createList(name: string, options?: any): Promise<ListResponse> {
    // Creating lists is highly provider-specific
    // For now, return a not implemented response
    return {
      success: false,
      message: 'Creating lists is not implemented for custom providers',
      error: 'NOT_IMPLEMENTED'
    };
  }

  /**
   * Send an email using the provider
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
      const providerConfig = this.config as CustomProviderConfig;
      
      if (!providerConfig.send_email_endpoint) {
        return {
          success: false,
          message: 'Send email endpoint not configured',
          error: 'MISSING_ENDPOINT'
        };
      }
      
      const requestConfig = this.getRequestConfig();
      const endpoint = `${this.getBaseUrl()}${providerConfig.send_email_endpoint}`;
      
      // Format recipients
      const recipients = Array.isArray(to) ? to : [to];
      
      // Prepare data according to format
      const data: any = {
        to: recipients,
        subject: subject,
        html: htmlContent,
        text: textContent || ''
      };
      
      // Set sender
      if (options?.from) {
        data.from = {
          email: options.from.email,
          name: options.from.name || ''
        };
      } else {
        data.from = {
          email: providerConfig.sender_email || providerConfig.defaultSenderEmail || '',
          name: providerConfig.sender_name || providerConfig.defaultSenderName || ''
        };
      }
      
      // Set reply-to
      if (options?.replyTo) {
        data.reply_to = options.replyTo;
      }
      
      // Add attachments if provided
      if (options?.attachments && options.attachments.length > 0) {
        data.attachments = options.attachments;
      }
      
      // Add custom variables if provided
      if (options?.customVars) {
        data.custom_vars = options.customVars;
      }
      
      const response = await axios.post(endpoint, data, requestConfig);
      
      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          message: `Email sent via ${this.displayName}`,
          emailId: response.data?.id || 'unknown'
        };
      }
      
      return {
        success: false,
        message: `Failed to send email: ${response.statusText}`,
        error: `HTTP_ERROR_${response.status}`
      };
    } catch (error: any) {
      console.error(`${this.displayName} send email error:`, error.message);
      return {
        success: false,
        message: `Failed to send email: ${error.message || 'Unknown error'}`,
        error: error.code || 'UNKNOWN_ERROR'
      };
    }
  }
}