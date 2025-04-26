import { IEmailServiceProvider, EmailProviderConfig } from './interfaces';

/**
 * Email Service Provider Registry
 * 
 * Central registry that manages all available email service providers.
 * Provides methods to register, unregister, and retrieve providers.
 */
class EmailServiceProviderRegistry {
  private providers: Map<string, IEmailServiceProvider> = new Map();
  private providerConfigs: Map<string, EmailProviderConfig> = new Map();
  private activeProvider: string | null = null;
  
  /**
   * Register a new email service provider
   * @param provider The provider instance to register
   */
  registerProvider(provider: IEmailServiceProvider): void {
    if (this.providers.has(provider.name)) {
      throw new Error(`Provider with name "${provider.name}" is already registered`);
    }
    
    this.providers.set(provider.name, provider);
    console.log(`Email provider "${provider.displayName}" registered`);
  }
  
  /**
   * Unregister an email service provider
   * @param providerName The name of the provider to unregister
   */
  unregisterProvider(providerName: string): void {
    if (!this.providers.has(providerName)) {
      throw new Error(`Provider with name "${providerName}" is not registered`);
    }
    
    this.providers.delete(providerName);
    this.providerConfigs.delete(providerName);
    
    // If this was the active provider, reset active provider
    if (this.activeProvider === providerName) {
      this.activeProvider = null;
    }
    
    console.log(`Email provider "${providerName}" unregistered`);
  }
  
  /**
   * Get all registered providers
   */
  getAllProviders(): IEmailServiceProvider[] {
    return Array.from(this.providers.values());
  }
  
  /**
   * Get all registered provider names
   */
  getAllProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }
  
  /**
   * Get a specific provider by name
   * @param providerName The name of the provider to retrieve
   */
  getProvider(providerName: string): IEmailServiceProvider | undefined {
    return this.providers.get(providerName);
  }
  
  /**
   * Set the configuration for a specific provider
   * @param providerName The name of the provider to configure
   * @param config The configuration to set
   */
  setProviderConfig(providerName: string, config: EmailProviderConfig): void {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`Provider with name "${providerName}" is not registered`);
    }
    
    // Update the provider instance with the new config
    provider.setConfig(config);
    
    // Also store the config in our registry
    this.providerConfigs.set(providerName, config);
    
    console.log(`Configuration updated for provider "${providerName}"`);
  }
  
  /**
   * Get the configuration for a specific provider
   * @param providerName The name of the provider to get config for
   */
  getProviderConfig(providerName: string): EmailProviderConfig | undefined {
    return this.providerConfigs.get(providerName);
  }
  
  /**
   * Set the active email service provider
   * @param providerName The name of the provider to set as active
   */
  setActiveProvider(providerName: string): void {
    if (!this.providers.has(providerName)) {
      throw new Error(`Cannot set active provider: "${providerName}" is not registered`);
    }
    
    this.activeProvider = providerName;
    console.log(`Active email provider set to "${providerName}"`);
  }
  
  /**
   * Get the currently active email service provider
   */
  getActiveProvider(): IEmailServiceProvider | null {
    if (!this.activeProvider) {
      return null;
    }
    
    return this.providers.get(this.activeProvider) || null;
  }
  
  /**
   * Get the name of the currently active email service provider
   */
  getActiveProviderName(): string | null {
    return this.activeProvider;
  }
  
  /**
   * Check if a provider exists by name
   * @param providerName The name of the provider to check
   */
  hasProvider(providerName: string): boolean {
    return this.providers.has(providerName);
  }
}

// Create and export a singleton instance
export const emailProviderRegistry = new EmailServiceProviderRegistry();

// Export the class for types
export { EmailServiceProviderRegistry };