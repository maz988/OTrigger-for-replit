/**
 * Email Provider Registry
 * 
 * This registry maintains a list of available email service providers
 * and manages the active provider.
 */

import type { IEmailServiceProvider } from './interfaces';
import type { EmailProviderConfig } from './interfaces';

class EmailProviderRegistry {
  private providers: Map<string, IEmailServiceProvider> = new Map();
  private activeProviderName: string | null = null;
  
  /**
   * Register a new email service provider
   * @param provider The provider implementation to register
   */
  registerProvider(provider: IEmailServiceProvider): void {
    const providerName = provider.name.toLowerCase();
    
    if (this.providers.has(providerName)) {
      console.warn(`Provider with name '${providerName}' is already registered. Replacing...`);
    }
    
    this.providers.set(providerName, provider);
    console.log(`Registered email provider: ${provider.displayName}`);
    
    // If this is the first provider, set it as active
    if (this.providers.size === 1 && !this.activeProviderName) {
      this.setActiveProvider(providerName);
    }
  }
  
  /**
   * Unregister an email service provider
   * @param providerName The name of the provider to unregister
   */
  unregisterProvider(providerName: string): void {
    const normalizedName = providerName.toLowerCase();
    
    if (!this.providers.has(normalizedName)) {
      throw new Error(`Provider '${providerName}' is not registered`);
    }
    
    this.providers.delete(normalizedName);
    console.log(`Unregistered email provider: ${providerName}`);
    
    // If this was the active provider, clear it
    if (this.activeProviderName === normalizedName) {
      this.activeProviderName = null;
      
      // If there are other providers, set the first one as active
      if (this.providers.size > 0) {
        const firstProvider = this.providers.keys().next().value;
        this.setActiveProvider(firstProvider);
      }
    }
  }
  
  /**
   * Get a provider by name
   * @param providerName The name of the provider to get
   * @returns The provider implementation or undefined if not found
   */
  getProvider(providerName: string): IEmailServiceProvider | undefined {
    return this.providers.get(providerName?.toLowerCase());
  }
  
  /**
   * Get all registered providers
   * @returns Array of provider implementations
   */
  getAllProviders(): IEmailServiceProvider[] {
    return Array.from(this.providers.values());
  }
  
  /**
   * Set the active provider
   * @param providerName The name of the provider to set as active
   * @throws Error if provider does not exist
   */
  setActiveProvider(providerName: string): void {
    const normalizedName = providerName.toLowerCase();
    
    if (!this.providers.has(normalizedName)) {
      throw new Error(`Cannot set active provider: '${providerName}' is not registered`);
    }
    
    this.activeProviderName = normalizedName;
    console.log(`Set active email provider to: ${providerName}`);
  }
  
  /**
   * Get the active provider
   * @returns The active provider implementation or null if none is set
   */
  getActiveProvider(): IEmailServiceProvider | null {
    if (!this.activeProviderName) {
      return null;
    }
    
    return this.providers.get(this.activeProviderName) || null;
  }
  
  /**
   * Get the name of the active provider
   * @returns The name of the active provider or null if none is set
   */
  getActiveProviderName(): string | null {
    return this.activeProviderName;
  }
  
  /**
   * Set configuration for a specific provider
   * @param providerName The name of the provider to configure
   * @param config The configuration to apply
   * @throws Error if provider does not exist
   */
  setProviderConfig(providerName: string, config: EmailProviderConfig): void {
    const normalizedName = providerName.toLowerCase();
    const provider = this.providers.get(normalizedName);
    
    if (!provider) {
      throw new Error(`Cannot configure provider: '${providerName}' is not registered`);
    }
    
    provider.setConfig(config);
    console.log(`Configured email provider: ${providerName}`);
  }
  
  /**
   * Get provider configuration
   * @param providerName The name of the provider to get configuration for
   * @returns The provider configuration or null if provider not found
   */
  getProviderConfig(providerName: string): EmailProviderConfig | null {
    const normalizedName = providerName.toLowerCase();
    const provider = this.providers.get(normalizedName);
    
    if (!provider) {
      return null;
    }
    
    return provider.getConfig();
  }
}

// Create and export a singleton instance
export const emailProviderRegistry = new EmailProviderRegistry();