/**
 * Email Provider Interface
 * 
 * Core interface that all email service providers must implement.
 * This ensures a consistent API regardless of the underlying service.
 */

// Represents a subscriber with required and optional fields
export interface EmailSubscriber {
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  source?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

// Response format for subscriber operations
export interface SubscriberResponse {
  success: boolean;
  message: string;
  error?: string;
  subscriberId?: string | number;
}

// Response format for email list operations
export interface ListResponse {
  success: boolean;
  message: string;
  error?: string;
  listId?: string | number;
  listInfo?: any;
}

// Response format for email sending operations
export interface EmailResponse {
  success: boolean;
  message: string;
  error?: string;
  emailId?: string | number;
}

// Configuration for an email provider
export interface EmailProviderConfig {
  apiKey: string;
  apiSecret?: string;
  apiUrl?: string;
  defaultListId?: string;
  defaultSenderEmail?: string;
  defaultSenderName?: string;
  requiresListId?: boolean;
  additionalConfig?: Record<string, any>;
}

/**
 * Interface that all email service providers must implement
 */
export interface IEmailServiceProvider {
  // Provider information
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly iconUrl?: string;
  readonly configFields: Array<{
    name: string;
    displayName: string;
    type: 'string' | 'number' | 'boolean';
    required: boolean;
    secret?: boolean;
    description?: string;
  }>;
  
  // Connection and configuration
  getConfig(): EmailProviderConfig;
  setConfig(config: EmailProviderConfig): void;
  testConnection(): Promise<{ success: boolean; message: string }>;
  
  // Subscriber operations
  addSubscriber(subscriber: EmailSubscriber, listId?: string): Promise<SubscriberResponse>;
  removeSubscriber(email: string, listId?: string): Promise<SubscriberResponse>;
  updateSubscriber(subscriber: EmailSubscriber, listId?: string): Promise<SubscriberResponse>;
  
  // List operations
  getLists(): Promise<ListResponse>;
  getList(listId: string): Promise<ListResponse>;
  createList(name: string, options?: any): Promise<ListResponse>;
  
  // Email operations
  sendEmail(
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
  ): Promise<EmailResponse>;
}

/**
 * Base class that providers can extend for common functionality
 */
export abstract class BaseEmailServiceProvider implements IEmailServiceProvider {
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly description: string;
  abstract readonly iconUrl?: string;
  abstract readonly configFields: Array<{
    name: string;
    displayName: string;
    type: 'string' | 'number' | 'boolean';
    required: boolean;
    secret?: boolean;
    description?: string;
  }>;
  
  protected config: EmailProviderConfig = {
    apiKey: '',
  };
  
  getConfig(): EmailProviderConfig {
    return this.config;
  }
  
  setConfig(config: EmailProviderConfig): void {
    this.config = config;
  }
  
  abstract testConnection(): Promise<{ success: boolean; message: string }>;
  abstract addSubscriber(subscriber: EmailSubscriber, listId?: string): Promise<SubscriberResponse>;
  abstract removeSubscriber(email: string, listId?: string): Promise<SubscriberResponse>;
  abstract updateSubscriber(subscriber: EmailSubscriber, listId?: string): Promise<SubscriberResponse>;
  abstract getLists(): Promise<ListResponse>;
  abstract getList(listId: string): Promise<ListResponse>;
  abstract createList(name: string, options?: any): Promise<ListResponse>;
  abstract sendEmail(
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
  ): Promise<EmailResponse>;
}