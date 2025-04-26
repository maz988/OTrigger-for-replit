/**
 * Email Provider System
 * 
 * This is the main entry point for the email provider system.
 * It exports the registry and all available providers.
 */

import { emailProviderRegistry } from './registry';
import type { IEmailServiceProvider } from './interfaces';
import type { EmailProviderConfig } from './interfaces';

// Import all provider implementations
import { BrevoProvider } from './adapters/BrevoProvider';
import { SendGridProvider } from './adapters/SendGridProvider';
import { MailerLiteProvider } from './adapters/MailerLiteProvider';
import { CustomProvider } from './adapters/CustomProvider';

// Register built-in providers
function registerBuiltInProviders() {
  try {
    // Register Brevo provider
    const brevoProvider = new BrevoProvider();
    emailProviderRegistry.registerProvider(brevoProvider);
    
    // Register SendGrid provider
    const sendGridProvider = new SendGridProvider();
    emailProviderRegistry.registerProvider(sendGridProvider);
    
    // Register MailerLite provider
    const mailerLiteProvider = new MailerLiteProvider();
    emailProviderRegistry.registerProvider(mailerLiteProvider);
    
    return true;
  } catch (error) {
    console.error('Error registering built-in email providers:', error);
    return false;
  }
}

// Initialize providers on module import
registerBuiltInProviders();

/**
 * Get all available email providers
 * @returns Array of email provider objects
 */
export function getAllProviders(): IEmailServiceProvider[] {
  return emailProviderRegistry.getAllProviders();
}

/**
 * Get provider by name
 * @param providerName Name of the provider to get
 * @returns Provider object or undefined if not found
 */
export function getProvider(providerName: string): IEmailServiceProvider | undefined {
  return emailProviderRegistry.getProvider(providerName?.toLowerCase());
}

/**
 * Set active email provider
 * @param providerName Name of the provider to set as active
 * @returns True if successful, false otherwise
 */
export function setActiveProvider(providerName: string): boolean {
  try {
    emailProviderRegistry.setActiveProvider(providerName.toLowerCase());
    return true;
  } catch (error) {
    console.error(`Error setting active provider to ${providerName}:`, error);
    return false;
  }
}

/**
 * Get active email provider
 * @returns Active provider object or null if none is set
 */
export function getActiveProvider(): IEmailServiceProvider | null {
  return emailProviderRegistry.getActiveProvider();
}

/**
 * Get active provider name
 * @returns Name of the active provider or null if none is set
 */
export function getActiveProviderName(): string | null {
  return emailProviderRegistry.getActiveProviderName();
}

/**
 * Configure a specific provider
 * @param providerName Name of the provider to configure
 * @param config Configuration to apply
 * @returns True if successful, false otherwise
 */
export function configureProvider(providerName: string, config: EmailProviderConfig): boolean {
  try {
    emailProviderRegistry.setProviderConfig(providerName.toLowerCase(), config);
    return true;
  } catch (error) {
    console.error(`Error configuring provider ${providerName}:`, error);
    return false;
  }
}

/**
 * Register a new provider dynamically
 * @param provider Provider implementation to register
 * @returns True if successful, false otherwise
 */
export function registerProvider(provider: IEmailServiceProvider): boolean {
  try {
    emailProviderRegistry.registerProvider(provider);
    return true;
  } catch (error) {
    console.error(`Error registering provider ${provider.name}:`, error);
    return false;
  }
}

/**
 * Unregister a provider
 * @param providerName Name of the provider to unregister
 * @returns True if successful, false otherwise
 */
export function unregisterProvider(providerName: string): boolean {
  try {
    emailProviderRegistry.unregisterProvider(providerName.toLowerCase());
    return true;
  } catch (error) {
    console.error(`Error unregistering provider ${providerName}:`, error);
    return false;
  }
}

export { 
  IEmailServiceProvider, 
  EmailProviderConfig,
  BrevoProvider,
  SendGridProvider,
  MailerLiteProvider
};