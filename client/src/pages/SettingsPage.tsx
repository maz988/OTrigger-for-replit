import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, Save, RefreshCw, Settings2, ImageIcon, Mail, Database, FileEdit, AlarmCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import AdminNavigation from '@/components/AdminNavigation';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

interface ServiceSettings {
  id: string;
  name: string;
  displayName: string;
  value: string;
  active: boolean;
  category: 'ai' | 'image' | 'email' | 'storage' | 'blog' | 'other';
  updatedAt: string;
}

interface ApiKeySettings {
  openaiApiKey: string;
  geminiApiKey: string;
  defaultAiProvider: 'openai' | 'gemini' | 'both';
  pexelsApiKey: string;
  unsplashApiKey: string;
  defaultImageProvider: 'pexels' | 'unsplash' | 'both';
  sendgridApiKey: string;
  mailerliteApiKey: string;
  brevoApiKey: string;
  activeEmailService: 'sendgrid' | 'mailerlite' | 'brevo' | 'none';
  senderEmail: string;
  leadMagnetFolder: string;
  autoEmailDelivery: boolean;
  useExternalStorage: boolean;
  externalStorageProvider: 'firebase' | 'cloudinary' | 'none';
  externalStorageKey: string;
  blogKeywordsFile: string;
  autoBlogPublishing: boolean;
  pdfGuideImageUrl: string;
  quizListId: string;
  leadMagnetListId: string;
  defaultListId: string;
}

const defaultSettings: ApiKeySettings = {
  openaiApiKey: '',
  geminiApiKey: '',
  defaultAiProvider: 'both',
  pexelsApiKey: '',
  unsplashApiKey: '',
  defaultImageProvider: 'pexels',
  sendgridApiKey: '',
  mailerliteApiKey: '',
  brevoApiKey: '',
  activeEmailService: 'none',
  senderEmail: '',
  leadMagnetFolder: 'lead_magnets',
  autoEmailDelivery: true,
  useExternalStorage: false,
  externalStorageProvider: 'none',
  externalStorageKey: '',
  blogKeywordsFile: 'keywords.txt',
  autoBlogPublishing: false,
  pdfGuideImageUrl: '/images/pdf-guide-icon.svg',
  quizListId: 'none',
  leadMagnetListId: 'none',
  defaultListId: 'none'
};

// Form validation schema
const apiKeySettingsSchema = z.object({
  openaiApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
  defaultAiProvider: z.enum(['openai', 'gemini', 'both']),
  pexelsApiKey: z.string().optional(),
  unsplashApiKey: z.string().optional(),
  defaultImageProvider: z.enum(['pexels', 'unsplash', 'both']),
  sendgridApiKey: z.string().optional(),
  mailerliteApiKey: z.string().optional(),
  brevoApiKey: z.string().optional(),
  activeEmailService: z.enum(['sendgrid', 'mailerlite', 'brevo', 'none']),
  senderEmail: z.string().email().optional(),
  leadMagnetFolder: z.string(),
  autoEmailDelivery: z.boolean(),
  useExternalStorage: z.boolean(),
  externalStorageProvider: z.enum(['firebase', 'cloudinary', 'none']),
  externalStorageKey: z.string().optional(),
  blogKeywordsFile: z.string(),
  autoBlogPublishing: z.boolean(),
  pdfGuideImageUrl: z.string(),
  quizListId: z.string().optional(),
  leadMagnetListId: z.string().optional(),
  defaultListId: z.string().optional()
});

// Get color for service status
const getStatusColor = (active: boolean, hasValue: boolean): string => {
  if (!hasValue) return 'text-gray-400';
  return active ? 'text-green-500' : 'text-amber-500';
};

// Get text for service status
const getStatusText = (active: boolean, hasValue: boolean): string => {
  if (!hasValue) return 'Not Configured';
  return active ? 'Active' : 'Configured (Inactive)';
};

// Check if a setting is actually configured in the database
const isSettingConfigured = (settingKey: string, settings: ServiceSettings[]): boolean => {
  // First try to find the setting by name matching the exact key
  const setting = settings.find(s => 
    s.name === settingKey || 
    // Also try with common variations like API_KEY format vs apiKey format
    s.name === settingKey.toUpperCase() || 
    s.name === settingKey.replace(/([A-Z])/g, '_$1').toUpperCase());
  
  return !!(setting && setting.value && setting.value.length > 0);
};

// Interface for email provider list
interface EmailList {
  id: string;
  name: string;
  subscriberCount?: number;
  description?: string;
  createdAt?: string;
  isDefault?: boolean;
}

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('ai');
  const [testingService, setTestingService] = useState<string | null>(null);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testResults, setTestResults] = useState<{success: boolean, message: string} | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);

  // Fetch settings
  const { data: settingsResponse, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: getQueryFn(),
  });

  // Parse settings from API response
  const settings: ServiceSettings[] = settingsResponse?.data || [];
  
  // Fetch email provider lists
  const { data: emailListsResponse, refetch: refetchEmailLists } = useQuery({
    queryKey: ['/api/admin/email/lists'],
    queryFn: getQueryFn(),
    enabled: false, // Don't fetch automatically, we'll fetch manually when needed
  });
  
  // Ensure we always have a valid array for lists
  const [emailLists, setEmailLists] = useState<EmailList[]>([]);
  
  // Update email lists whenever the response changes
  useEffect(() => {
    if (emailListsResponse?.data && Array.isArray(emailListsResponse.data)) {
      console.log("Email lists loaded:", emailListsResponse.data.length);
      setEmailLists(emailListsResponse.data);
    } else {
      console.log("No email lists found or invalid format");
      setEmailLists([]);
    }
  }, [emailListsResponse?.data]);
  
  // Form setup with the schema
  const form = useForm<ApiKeySettings>({
    resolver: zodResolver(apiKeySettingsSchema),
    defaultValues: defaultSettings,
  });

  // Parse settings into form data
  useEffect(() => {
    if (settings.length > 0) {
      const formData: Partial<ApiKeySettings> = { ...defaultSettings };
      
      // Map of setting keys to form field names
      const settingKeyMap: Record<string, keyof ApiKeySettings> = {
        'OPENAI_API_KEY': 'openaiApiKey',
        'openaiApiKey': 'openaiApiKey',
        'GEMINI_API_KEY': 'geminiApiKey',
        'geminiApiKey': 'geminiApiKey',
        'PEXELS_API_KEY': 'pexelsApiKey',
        'pexelsApiKey': 'pexelsApiKey',
        'UNSPLASH_API_KEY': 'unsplashApiKey',
        'unsplashApiKey': 'unsplashApiKey',
        'SENDGRID_API_KEY': 'sendgridApiKey',
        'sendgridApiKey': 'sendgridApiKey',
        'MAILERLITE_API_KEY': 'mailerliteApiKey',
        'mailerliteApiKey': 'mailerliteApiKey',
        'BREVO_API_KEY': 'brevoApiKey',
        'brevoApiKey': 'brevoApiKey',
        'autoEmailDelivery': 'autoEmailDelivery',
        'useExternalStorage': 'useExternalStorage',
        'autoBlogPublishing': 'autoBlogPublishing',
        'pdfGuideImageUrl': 'pdfGuideImageUrl',
        'PDF_GUIDE_IMAGE_URL': 'pdfGuideImageUrl',
        'QUIZ_LIST_ID': 'quizListId',
        'quizListId': 'quizListId',
        'LEAD_MAGNET_LIST_ID': 'leadMagnetListId',
        'leadMagnetListId': 'leadMagnetListId',
        'DEFAULT_LIST_ID': 'defaultListId',
        'defaultListId': 'defaultListId'
      };
      
      settings.forEach((setting: ServiceSettings) => {
        // Check if we have a mapping for this setting
        const formKey = settingKeyMap[setting.name] || 
                        settingKeyMap[setting.name.replace(/([A-Z])/g, '_$1').toUpperCase()];
        
        if (formKey) {
          if (formKey === 'autoEmailDelivery' || 
              formKey === 'useExternalStorage' || 
              formKey === 'autoBlogPublishing') {
            // For boolean values
            formData[formKey] = setting.value === 'true';
          } else {
            // For string and enum values
            formData[formKey] = setting.value as any;
          }
        } else {
          // If it's a direct match for a field in our form
          if (setting.name in formData) {
            const key = setting.name as keyof ApiKeySettings;
            if (typeof defaultSettings[key] === 'boolean') {
              formData[key] = setting.value === 'true';
            } else {
              formData[key] = setting.value as any;
            }
          }
        }
      });
      
      console.log("Form data set from settings:", formData);
      form.reset(formData as ApiKeySettings);
    }
  }, [settings, form]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: ApiKeySettings) => {
      try {
        // Convert boolean values to strings for the API
        const processedSettings: Record<string, string | boolean> = {};
        
        // Process all values properly
        Object.entries(newSettings).forEach(([key, value]) => {
          // Convert booleans to strings since server expects string values
          if (typeof value === 'boolean') {
            processedSettings[key] = value.toString();
          } else if (value !== undefined && value !== null) {
            processedSettings[key] = value;
          }
        });
        
        console.log("Submitting settings:", processedSettings);
        
        // apiRequest expects (method, url, body, options)
        return await apiRequest(
          'POST',
          '/api/admin/settings',
          processedSettings
        );
      } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate the settings cache to refresh all components using settings
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      
      toast({
        title: 'Settings Updated',
        description: 'Integration settings have been saved successfully.',
        variant: 'default',
      });
      refetchSettings();
    },
    onError: (error: Error) => {
      console.error("Settings update error:", error);
      toast({
        title: 'Error Updating Settings',
        description: error.message || "An unknown error occurred",
        variant: 'destructive',
      });
    }
  });

  // Test service connection mutation
  const testServiceMutation = useMutation({
    mutationFn: async (serviceType: string) => {
      try {
        // First, save any pending changes to settings
        if (form.formState.isDirty) {
          await updateSettingsMutation.mutateAsync(form.getValues());
        }
        
        // Get the current value of the API key from the form
        let apiKey;
        switch(serviceType) {
          case 'openai':
            apiKey = form.getValues().openaiApiKey;
            break;
          case 'gemini':
            apiKey = form.getValues().geminiApiKey;
            break;
          case 'pexels':
            apiKey = form.getValues().pexelsApiKey;
            break;
          case 'unsplash':
            apiKey = form.getValues().unsplashApiKey;
            break;
          case 'sendgrid':
            apiKey = form.getValues().sendgridApiKey;
            break;
          case 'mailerlite':
            apiKey = form.getValues().mailerliteApiKey;
            break;
          case 'brevo':
            apiKey = form.getValues().brevoApiKey;
            break;
        }
        
        // If API key is empty, provide a helpful message
        if (!apiKey) {
          // If this is an email service, show a message about using environment variables
          if (['sendgrid', 'mailerlite', 'brevo'].includes(serviceType)) {
            toast({
              title: 'No API key provided',
              description: 'Using API key from environment variables if available.',
              variant: 'default',
            });
          }
        }
        
        // apiRequest expects (method, url, body, options)
        const response = await apiRequest(
          'POST',
          `/api/admin/settings/test/${serviceType}`,
          { apiKey } // Body will be automatically JSON stringified
        );
        return response; // This is already the parsed JSON response
      } catch (error) {
        console.error("Error testing service:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Show success toast notification
      toast({
        title: '✅ Connection Successful',
        description: data.message || 'Connection test was successful!',
        variant: 'default',
      });
      
      setTestResults({
        success: true,
        message: data.message || 'Connection successful!'
      });
      
      // Refresh settings to ensure UI is up to date
      refetchSettings();
    },
    onError: (error: any) => {
      console.log("Test service error received:", error);
      
      // Try to extract and parse the JSON error from the response
      let errorMessage = "Connection failed. Please check your API key.";
      
      if (error.message) {
        try {
          // If we're getting a JSON response embedded in the error message, let's extract it
          const jsonMatch = error.message.match(/{.*}/);
          if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[0]);
            if (jsonData.error) {
              errorMessage = jsonData.error;
            }
          } else if (error.message.includes(":")) {
            // Split by colon and take everything after the first colon
            errorMessage = error.message.split(":").slice(1).join(":").trim();
          } else {
            errorMessage = error.message;
          }
        } catch (parseError) {
          console.error("Error parsing error message:", parseError);
          // Just use the raw error message if we can't parse it
          errorMessage = error.message;
        }
      }
      
      // Show error toast notification
      toast({
        title: '❌ Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      setTestResults({
        success: false,
        message: errorMessage
      });
      
      // Refresh settings to ensure UI is up to date with latest values
      refetchSettings();
    }
  });

  // Handle form submission
  const onSubmit = (data: ApiKeySettings) => {
    console.log("Form submitted with data:", data);
    updateSettingsMutation.mutate(data);
  };

  // Test connection to a service
  const handleTestService = (serviceType: string) => {
    setTestingService(serviceType);
    setTestResults(null);
    setIsTestDialogOpen(true);
    testServiceMutation.mutate(serviceType);
  };
  
  // Fetch email lists for the currently active provider
  const fetchEmailLists = async () => {
    try {
      setLoadingLists(true);
      const activeProvider = form.getValues().activeEmailService;
      
      console.log("Fetching email lists for provider:", activeProvider);
      
      if (activeProvider === 'none') {
        toast({
          title: 'No email provider selected',
          description: 'Please select an email provider first',
          variant: 'destructive',
        });
        return;
      }
      
      // Save current form values before testing to ensure API key is up to date
      if (form.formState.isDirty) {
        console.log("Saving form values before fetching lists");
        await updateSettingsMutation.mutateAsync(form.getValues());
      }
      
      console.log("Fetching lists from API...");
      const result = await refetchEmailLists();
      console.log("API response:", result);
      
      if (result.isError) {
        console.error("Error fetching lists:", result.error);
        throw new Error(result.error?.message || "Failed to fetch email lists");
      }
      
      if (!result.data?.data || !Array.isArray(result.data.data)) {
        console.warn("Invalid list format returned:", result.data);
        toast({
          title: 'No lists found',
          description: `No valid lists were returned from ${activeProvider}. Try creating a list first.`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Lists Fetched',
          description: `Successfully fetched ${result.data.data.length} lists from ${activeProvider}`,
          variant: 'default',
        });
      }
    } catch (error: any) {
      console.error("Error fetching email lists:", error);
      toast({
        title: 'Error Fetching Lists',
        description: error.message || "Could not fetch lists. Please check your API key and try again.",
        variant: 'destructive',
      });
    } finally {
      setLoadingLists(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <AdminNavigation />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Integration Control Panel</h1>
        <p className="text-muted-foreground">Configure external services and API connections for your system</p>
      </div>

      <Form {...form}>
        <form 
          onSubmit={(e) => {
            console.log("Form submission event triggered");
            e.preventDefault(); 
            // Get the current form values
            const formValues = form.getValues();
            console.log("Form values before submit:", formValues);
            
            // Call the onSubmit handler with the form values
            onSubmit(formValues);
          }} 
          className="space-y-8">
          <Tabs 
            defaultValue="ai" 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ai">AI Services</TabsTrigger>
              <TabsTrigger value="image">Image Services</TabsTrigger>
              <TabsTrigger value="email">Email Services</TabsTrigger>
              <TabsTrigger value="blog">Blog Settings</TabsTrigger>
            </TabsList>

            {/* AI Services Tab */}
            <TabsContent value="ai" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>OpenAI Integration</CardTitle>
                    <CardDescription>
                      Configure OpenAI API for content generation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="openaiApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OpenAI API Key</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="sk-..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Required for GPT-4 based content generation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between pt-2">
                      <div className="font-medium text-sm">
                        Status: 
                        <span className={getStatusColor(true, isSettingConfigured('openaiApiKey', settings) || !!form.getValues().openaiApiKey)}>
                          {' '}{getStatusText(true, isSettingConfigured('openaiApiKey', settings) || !!form.getValues().openaiApiKey)}
                        </span>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        disabled={!form.getValues().openaiApiKey}
                        onClick={() => handleTestService('openai')}
                      >
                        Test Connection
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Google Gemini Integration</CardTitle>
                    <CardDescription>
                      Configure Google Gemini API for content enhancement
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="geminiApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gemini API Key</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="AIzaSyA..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Used for additional insights and content variety
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between pt-2">
                      <div className="font-medium text-sm">
                        Status: 
                        <span className={getStatusColor(true, isSettingConfigured('geminiApiKey', settings) || !!form.getValues().geminiApiKey)}>
                          {' '}{getStatusText(true, isSettingConfigured('geminiApiKey', settings) || !!form.getValues().geminiApiKey)}
                        </span>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        disabled={!form.getValues().geminiApiKey}
                        onClick={() => handleTestService('gemini')}
                      >
                        Test Connection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>AI Service Configuration</CardTitle>
                  <CardDescription>
                    Configure how AI services are used in content creation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="defaultAiProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default AI Provider</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select default AI provider" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI Only</SelectItem>
                            <SelectItem value="gemini">Gemini Only</SelectItem>
                            <SelectItem value="both">Use Both (Enhanced Quality)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose which AI service to use by default. Using both will generate with OpenAI and enhance with Gemini.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Image Services Tab */}
            <TabsContent value="image" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Pexels Integration</CardTitle>
                    <CardDescription>
                      Configure Pexels API for blog images
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="pexelsApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pexels API Key</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="pexels_api_key..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Required for automatic image selection for blog posts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between pt-2">
                      <div className="font-medium text-sm">
                        Status: 
                        <span className={getStatusColor(true, isSettingConfigured('pexelsApiKey', settings) || !!form.getValues().pexelsApiKey)}>
                          {' '}{getStatusText(true, isSettingConfigured('pexelsApiKey', settings) || !!form.getValues().pexelsApiKey)}
                        </span>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        disabled={!form.getValues().pexelsApiKey}
                        onClick={() => handleTestService('pexels')}
                      >
                        Test Connection
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Unsplash Integration</CardTitle>
                    <CardDescription>
                      Configure Unsplash API for image variety
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="unsplashApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unsplash API Key</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="unsplash_access_key..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional alternative image source
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between pt-2">
                      <div className="font-medium text-sm">
                        Status: 
                        <span className={getStatusColor(true, isSettingConfigured('unsplashApiKey', settings) || !!form.getValues().unsplashApiKey)}>
                          {' '}{getStatusText(true, isSettingConfigured('unsplashApiKey', settings) || !!form.getValues().unsplashApiKey)}
                        </span>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        disabled={!form.getValues().unsplashApiKey}
                        onClick={() => handleTestService('unsplash')}
                      >
                        Test Connection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Image Service Configuration</CardTitle>
                  <CardDescription>
                    Configure which image service to use
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="defaultImageProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Image Provider</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select default image provider" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pexels">Pexels Only</SelectItem>
                            <SelectItem value="unsplash">Unsplash Only</SelectItem>
                            <SelectItem value="both">Use Both (Alternating)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose which image service to use by default
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Services Tab */}
            <TabsContent value="email" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>SendGrid Integration</CardTitle>
                    <CardDescription>
                      Configure SendGrid for email delivery
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="sendgridApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SendGrid API Key</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="SG..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Required for automated email delivery
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between pt-2">
                      <div className="font-medium text-sm">
                        Status: 
                        <span className={getStatusColor(
                          form.getValues().activeEmailService === 'sendgrid', 
                          isSettingConfigured('sendgridApiKey', settings) || !!form.getValues().sendgridApiKey
                        )}>
                          {' '}{getStatusText(
                            form.getValues().activeEmailService === 'sendgrid', 
                            isSettingConfigured('sendgridApiKey', settings) || !!form.getValues().sendgridApiKey
                          )}
                        </span>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        disabled={!form.getValues().sendgridApiKey}
                        onClick={() => handleTestService('sendgrid')}
                      >
                        Test Connection
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>MailerLite Integration</CardTitle>
                    <CardDescription>
                      Configure MailerLite for email marketing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="mailerliteApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>MailerLite API Key</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="mailerlite_api_key..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Alternative email service provider
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between pt-2">
                      <div className="font-medium text-sm">
                        Status: 
                        <span className={getStatusColor(
                          form.getValues().activeEmailService === 'mailerlite', 
                          isSettingConfigured('mailerliteApiKey', settings) || !!form.getValues().mailerliteApiKey
                        )}>
                          {' '}{getStatusText(
                            form.getValues().activeEmailService === 'mailerlite', 
                            isSettingConfigured('mailerliteApiKey', settings) || !!form.getValues().mailerliteApiKey
                          )}
                        </span>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        disabled={!form.getValues().mailerliteApiKey}
                        onClick={() => handleTestService('mailerlite')}
                      >
                        Test Connection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Brevo Integration</CardTitle>
                    <CardDescription>
                      Configure Brevo (formerly Sendinblue) for email marketing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="brevoApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brevo API Key</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="xkeysib-..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Alternative email service with marketing automation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between pt-2">
                      <div className="font-medium text-sm">
                        Status: 
                        <span className={getStatusColor(
                          form.getValues().activeEmailService === 'brevo', 
                          isSettingConfigured('brevoApiKey', settings) || !!form.getValues().brevoApiKey
                        )}>
                          {' '}{getStatusText(
                            form.getValues().activeEmailService === 'brevo', 
                            isSettingConfigured('brevoApiKey', settings) || !!form.getValues().brevoApiKey
                          )}
                        </span>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        disabled={!form.getValues().brevoApiKey}
                        onClick={() => handleTestService('brevo')}
                      >
                        Test Connection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Email Configuration</CardTitle>
                  <CardDescription>
                    Configure email delivery settings and list management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="activeEmailService"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Active Email Service</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Clear list selections when provider changes
                              form.setValue('quizListId', 'none');
                              form.setValue('leadMagnetListId', 'none');
                              form.setValue('defaultListId', 'none');
                            }}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select active email service" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None (Disable Email)</SelectItem>
                              <SelectItem value="sendgrid">SendGrid</SelectItem>
                              <SelectItem value="mailerlite">MailerLite</SelectItem>
                              <SelectItem value="brevo">Brevo (Sendinblue)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose which email service to use
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="senderEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sender Email Address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="noreply@yourdomain.com"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Email address used for sending
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-4" />
                  
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Email Lists Configuration</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      disabled={form.getValues().activeEmailService === 'none'}
                      onClick={fetchEmailLists}
                    >
                      {loadingLists ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading Lists...
                        </>
                      ) : (
                        <>Fetch Lists</>
                      )}
                    </Button>
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="defaultListId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default List</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={!emailLists.length}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select default list" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No List (Don't Use)</SelectItem>
                              {emailLists.map((list: EmailList) => (
                                <SelectItem key={list.id} value={list.id}>
                                  {list.name} {list.isDefault ? " (Default)" : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Default list for all subscribers (if none specified)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="quizListId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quiz Subscribers List</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={!emailLists.length}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select quiz subscribers list" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No List (Use Default)</SelectItem>
                              {emailLists.map((list: EmailList) => (
                                <SelectItem key={list.id} value={list.id}>
                                  {list.name} {list.isDefault ? " (Default)" : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Specific list for quiz subscribers
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="leadMagnetListId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Magnet Subscribers List</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={!emailLists.length}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select lead magnet subscribers list" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No List (Use Default)</SelectItem>
                              {emailLists.map((list: EmailList) => (
                                <SelectItem key={list.id} value={list.id}>
                                  {list.name} {list.isDefault ? " (Default)" : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Specific list for lead magnet subscribers
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="leadMagnetFolder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Magnet Storage Folder</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="lead_magnets"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Folder path where lead magnets are stored
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="autoEmailDelivery"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Automatic Email Delivery
                            </FormLabel>
                            <FormDescription>
                              Automatically send lead magnets to new subscribers
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Blog Settings Tab */}
            <TabsContent value="blog" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Auto-Blogging Configuration</CardTitle>
                    <CardDescription>
                      Configure settings for automated blog post generation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="blogKeywordsFile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Keywords File Path</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="keywords.txt"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Path to the file containing blog keywords
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="autoBlogPublishing"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Automatic Blog Publishing
                            </FormLabel>
                            <FormDescription>
                              Enable scheduled automatic blog post generation
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Lead Magnet Configuration</CardTitle>
                    <CardDescription>
                      Configure lead magnet PDF guide appearance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="pdfGuideImageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PDF Guide Image</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              <div className="flex gap-3">
                                <Input
                                  type="text"
                                  placeholder="/images/pdf-guide-icon.svg"
                                  {...field}
                                  className="flex-1"
                                />
                                <div className="relative">
                                  <input
                                    type="file"
                                    id="pdf-guide-upload"
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        // Set uploading state
                                        setImageUploading(true);
                                        
                                        // Create a temporary URL for the file
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                          // Handle image upload to server
                                          const formData = new FormData();
                                          formData.append('image', file);
                                          
                                          // Get admin token from localStorage
                                          const token = localStorage.getItem('adminToken');
                                          
                                          fetch('/api/admin/upload-image', {
                                            method: 'POST',
                                            headers: {
                                              'Authorization': `Bearer ${token}`
                                            },
                                            body: formData
                                          })
                                          .then(response => response.json())
                                          .then(data => {
                                            setImageUploading(false);
                                            if (data.success && data.imageUrl) {
                                              // Update the field with the uploaded image URL
                                              field.onChange(data.imageUrl);
                                              toast({
                                                title: "Image Uploaded",
                                                description: "The image has been uploaded successfully.",
                                              });
                                            } else {
                                              // Show error message
                                              toast({
                                                title: "Upload Failed",
                                                description: data.message || "Failed to upload image. Please try again.",
                                                variant: "destructive"
                                              });
                                            }
                                          })
                                          .catch(error => {
                                            setImageUploading(false);
                                            console.error("Upload error:", error);
                                            toast({
                                              title: "Upload Error",
                                              description: "An error occurred while uploading the image.",
                                              variant: "destructive"
                                            });
                                          });
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    disabled={imageUploading}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={imageUploading}
                                  >
                                    {imageUploading ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                        Uploading...
                                      </>
                                    ) : "Upload"}
                                  </Button>
                                </div>
                              </div>
                              <div className="flex flex-col items-center p-4 border rounded-md">
                                {imageUploading ? (
                                  <div className="h-32 flex items-center justify-center">
                                    <div className="text-center">
                                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                      <p className="text-sm text-muted-foreground">Uploading image...</p>
                                    </div>
                                  </div>
                                ) : (
                                  <img 
                                    src={field.value || '/images/pdf-guide-icon.svg'} 
                                    alt="PDF Guide Preview" 
                                    className="h-32 object-contain mb-2"
                                    onError={(e) => { 
                                      e.currentTarget.src = '/images/pdf-guide-icon.svg';
                                      e.currentTarget.classList.add('border', 'border-red-300');
                                      e.currentTarget.title = "Invalid image URL";
                                    }}
                                  />
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                  {imageUploading ? 'Uploading...' : 
                                    (field.value ? 'Current image' : 'Default image (no custom image set)')}
                                </p>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Upload or enter URL for the PDF guide image shown in the lead magnet forms
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>External Storage</CardTitle>
                    <CardDescription>
                      Configure external storage for media assets
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="useExternalStorage"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Use External Storage
                            </FormLabel>
                            <FormDescription>
                              Store media files in external cloud storage
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="externalStorageProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Storage Provider</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={!form.getValues().useExternalStorage}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select storage provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="firebase">Firebase Storage</SelectItem>
                              <SelectItem value="cloudinary">Cloudinary</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose which external storage to use
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="externalStorageKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Storage API Key/Config</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="storage_api_key..."
                              {...field}
                              disabled={!form.getValues().useExternalStorage || 
                                        form.getValues().externalStorageProvider === 'none'}
                            />
                          </FormControl>
                          <FormDescription>
                            API key or configuration for external storage
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Blog System Status</CardTitle>
                  <CardDescription>
                    Current status of blog generation system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <h3 className="text-sm font-medium mb-2">Auto-blogging Status</h3>
                        <div className="flex items-center gap-2">
                          {form.getValues().autoBlogPublishing ? (
                            <>
                              <AlarmCheck className="h-5 w-5 text-green-500" />
                              <span className="text-sm">Active - Automatically publishing</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-5 w-5 text-amber-500" />
                              <span className="text-sm">Inactive - Manual publishing only</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h3 className="text-sm font-medium mb-2">AI Content Generation</h3>
                        <div className="flex items-center gap-2">
                          {form.getValues().openaiApiKey ? (
                            <>
                              <Settings2 className="h-5 w-5 text-green-500" />
                              <span className="text-sm">Configured and ready</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-5 w-5 text-amber-500" />
                              <span className="text-sm">API key required</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open('/admin/blog-management', '_blank')}
                      className="w-full"
                    >
                      <FileEdit className="mr-2 h-4 w-4" />
                      Manage Blog Posts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                refetchSettings().then(() => {
                  // Reset form to latest data after refetch
                  if (settings.length > 0) {
                    const formData: Partial<ApiKeySettings> = { ...defaultSettings };
                    
                    // Map of setting keys to form field names
                    const settingKeyMap: Record<string, keyof ApiKeySettings> = {
                      'OPENAI_API_KEY': 'openaiApiKey',
                      'openaiApiKey': 'openaiApiKey',
                      'GEMINI_API_KEY': 'geminiApiKey',
                      'geminiApiKey': 'geminiApiKey',
                      'PEXELS_API_KEY': 'pexelsApiKey',
                      'pexelsApiKey': 'pexelsApiKey',
                      'UNSPLASH_API_KEY': 'unsplashApiKey',
                      'unsplashApiKey': 'unsplashApiKey',
                      'SENDGRID_API_KEY': 'sendgridApiKey',
                      'sendgridApiKey': 'sendgridApiKey',
                      'MAILERLITE_API_KEY': 'mailerliteApiKey',
                      'mailerliteApiKey': 'mailerliteApiKey',
                      'BREVO_API_KEY': 'brevoApiKey',
                      'brevoApiKey': 'brevoApiKey',
                      'autoEmailDelivery': 'autoEmailDelivery',
                      'useExternalStorage': 'useExternalStorage',
                      'autoBlogPublishing': 'autoBlogPublishing'
                    };
                    
                    settings.forEach((setting: ServiceSettings) => {
                      // Check if we have a mapping for this setting
                      const formKey = settingKeyMap[setting.name] || 
                                      settingKeyMap[setting.name.replace(/([A-Z])/g, '_$1').toUpperCase()];
                      
                      if (formKey) {
                        if (formKey === 'autoEmailDelivery' || 
                            formKey === 'useExternalStorage' || 
                            formKey === 'autoBlogPublishing') {
                          // For boolean values
                          formData[formKey] = setting.value === 'true';
                        } else {
                          // For string and enum values
                          formData[formKey] = setting.value as any;
                        }
                      } else {
                        // If it's a direct match for a field in our form
                        if (setting.name in formData) {
                          const key = setting.name as keyof ApiKeySettings;
                          if (typeof defaultSettings[key] === 'boolean') {
                            formData[key] = setting.value === 'true';
                          } else {
                            formData[key] = setting.value as any;
                          }
                        }
                      }
                    });
                    
                    form.reset(formData as ApiKeySettings);
                  }
                  
                  toast({
                    title: 'Form Reset',
                    description: 'Settings form has been reset to saved values.',
                  });
                });
              }}
              disabled={updateSettingsMutation.isPending}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button
              type="submit"
              onClick={(e) => {
                console.log("Save button clicked");
                // The form's onSubmit handler should handle this,
                // but let's add a backup
                if (form.formState.isValid) {
                  e.preventDefault();
                  const formValues = form.getValues();
                  console.log("Submitting form manually:", formValues);
                  onSubmit(formValues);
                }
              }}
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Testing Connection</DialogTitle>
            <DialogDescription>
              Checking connection to the service...
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            {testServiceMutation.isPending ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Testing connection to {testingService}...</p>
              </div>
            ) : testResults ? (
              <div className={`flex flex-col items-center justify-center gap-4 ${testResults.success ? 'text-green-600' : 'text-red-600'}`}>
                {testResults.success ? (
                  <>
                    <div className="rounded-full bg-green-100 p-3">
                      <Settings2 className="h-6 w-6" />
                    </div>
                    <p className="text-center font-medium">Connection Successful!</p>
                  </>
                ) : (
                  <>
                    <div className="rounded-full bg-red-100 p-3">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <p className="text-center font-medium">Connection Failed</p>
                  </>
                )}
                <p className="text-center text-sm text-muted-foreground">{testResults.message}</p>
              </div>
            ) : null}
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setIsTestDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;