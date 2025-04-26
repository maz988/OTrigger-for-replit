/**
 * Email Provider Interfaces
 * 
 * This file defines the interfaces for email service providers.
 * These interfaces provide a common contract that all email provider
 * implementations must adhere to.
 */

/**
 * Configuration for an email provider
 * Can be extended with provider-specific fields
 */
export interface EmailProviderConfig {
  apiKey: string;
  defaultSenderEmail?: string;
  defaultSenderName?: string;
  defaultListId?: string;
  replyTo?: string;
  [key: string]: any; // Allow for additional provider-specific config
}

/**
 * Configuration field definition for provider UI
 */
export interface ConfigField {
  name: string;
  displayName: string;
  type: 'string' | 'boolean' | 'number' | 'select';
  required: boolean;
  description?: string;
  secret?: boolean;
  options?: Array<{ value: string; label: string }>;
  default?: any;
}

/**
 * Subscriber data for provider operations
 */
export interface EmailSubscriber {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  source?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

/**
 * Response from subscriber operations
 */
export interface SubscriberResponse {
  success: boolean;
  message: string;
  error?: string;
  subscriberId?: string;
}

/**
 * Response from list operations
 */
export interface ListResponse {
  success: boolean;
  message: string;
  error?: string;
  listId?: string;
  listInfo?: any;
}

/**
 * Response from email operations
 */
export interface EmailResponse {
  success: boolean;
  message: string;
  error?: string;
  emailId?: string;
}

/**
 * Interface that all email service providers must implement
 */
export interface IEmailServiceProvider {
  // Provider metadata
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly iconUrl: string;
  readonly configFields: ConfigField[];
  
  // Configuration methods
  getConfig(): EmailProviderConfig;
  setConfig(config: EmailProviderConfig): void;
  
  // Connection testing
  testConnection(): Promise<{ success: boolean; message: string }>;
  
  // Subscriber management
  addSubscriber(subscriber: EmailSubscriber, listId?: string): Promise<SubscriberResponse>;
  removeSubscriber(email: string, listId?: string): Promise<SubscriberResponse>;
  updateSubscriber(subscriber: EmailSubscriber, listId?: string): Promise<SubscriberResponse>;
  
  // List management
  getLists(): Promise<ListResponse>;
  getList(listId: string): Promise<ListResponse>;
  createList(name: string, options?: any): Promise<ListResponse>;
  
  // Email sending
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
 * Base class for email service providers
 * Implements common functionality
 */
export abstract class BaseEmailServiceProvider implements IEmailServiceProvider {
  // Provider metadata to be implemented by subclasses
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly description: string;
  abstract readonly iconUrl: string;
  abstract readonly configFields: ConfigField[];
  
  // Default empty configuration
  protected config: EmailProviderConfig = { apiKey: '' };
  
  /**
   * Get the current provider configuration
   */
  getConfig(): EmailProviderConfig {
    return { ...this.config };
  }
  
  /**
   * Set the provider configuration
   */
  setConfig(config: EmailProviderConfig): void {
    this.config = { ...config };
  }
  
  // Abstract methods that must be implemented by subclasses
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