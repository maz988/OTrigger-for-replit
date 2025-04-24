import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import {
  ArrowLeft,
  KeyRound,
  KeySquare,
  Check,
  MailCheck,
  Sparkles,
  ImageIcon,
  Send,
  Braces,
  AlertCircle,
  Loader2,
  FileCheck,
  Settings2,
  Cloud,
  RefreshCw,
  PenBox
} from 'lucide-react';

// Types
interface ServiceSettings {
  id: string;
  name: string;
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
}

// Default settings to use initially
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
  leadMagnetFolder: '/public/lead-magnets',
  autoEmailDelivery: true,
  useExternalStorage: false,
  externalStorageProvider: 'none',
  externalStorageKey: '',
  blogKeywordsFile: '',
  autoBlogPublishing: false
};

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<ApiKeySettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<string>('ai');
  const [isTestingAi, setIsTestingAi] = useState<boolean>(false);
  const [isTestingEmail, setIsTestingEmail] = useState<boolean>(false);
  const [testEmailAddress, setTestEmailAddress] = useState<string>('');
  
  const { toast } = useToast();
  
  // Get the admin token from localStorage
  const token = localStorage.getItem('adminToken');
  
  // Fetch settings
  const { data: settingsData, isLoading: isLoadingSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    }
  });
  
  // Fetch keywords for blog settings
  const { data: keywordsData } = useQuery({
    queryKey: ['/api/admin/keywords'],
    queryFn: async () => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/keywords', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    }
  });
  
  // Update settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<ApiKeySettings>) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedSettings)
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Settings Updated',
        description: 'Your settings have been updated successfully.',
        variant: 'default',
      });
      refetchSettings();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Updating Settings',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Test AI connection
  const testAiConnectionMutation = useMutation({
    mutationFn: async (provider: string) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      setIsTestingAi(true);
      
      const response = await fetch('/api/admin/settings/test-ai', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'AI Connection Successful',
        description: data.message || 'Successfully connected to AI provider.',
        variant: 'default',
      });
      setIsTestingAi(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'AI Connection Failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsTestingAi(false);
    }
  });
  
  // Test email connection
  const testEmailConnectionMutation = useMutation({
    mutationFn: async (emailData: { provider: string; email: string }) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      setIsTestingEmail(true);
      
      const response = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Test Email Sent',
        description: data.message || 'Test email has been sent successfully.',
        variant: 'default',
      });
      setIsTestingEmail(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Test Email Failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsTestingEmail(false);
    }
  });
  
  // Trigger blog generation
  const triggerBlogGenerationMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/blog/generate-scheduled', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Blog Post Generated',
        description: data.message || 'Successfully generated a new blog post.',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Generating Blog Post',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Update auto-scheduling settings
  const updateAutoSchedulingMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/blog/auto-schedule/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          enabled,
          frequency: 'daily',
          time: '10:00'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Auto-Scheduling Updated',
        description: 'Blog auto-scheduling settings have been updated.',
        variant: 'default',
      });
      
      // Update local state
      setSettings(prev => ({
        ...prev,
        autoBlogPublishing: !prev.autoBlogPublishing
      }));
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Updating Auto-Scheduling',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Update keywords
  const updateKeywordsMutation = useMutation({
    mutationFn: async (keywordsText: string) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Parse the text into an array of keywords
      const keywords = keywordsText
        .split('\n')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      // First, we need to delete all existing keywords
      await fetch('/api/admin/keywords/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Then, add each new keyword
      for (const keyword of keywords) {
        await fetch('/api/admin/keywords', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ keyword })
        });
      }
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Keywords Updated',
        description: 'Blog keywords have been updated successfully.',
        variant: 'default',
      });
      
      // Invalidate the keywords query
      queryClient.invalidateQueries({ queryKey: ['/api/admin/keywords'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Updating Keywords',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Update settings from fetched data
  useEffect(() => {
    if (settingsData?.data) {
      // Convert the array of settings to our format
      const newSettings: Partial<ApiKeySettings> = { ...defaultSettings };
      
      settingsData.data.forEach((setting: ServiceSettings) => {
        switch (setting.id) {
          case 'openaiApiKey':
            newSettings.openaiApiKey = setting.value;
            break;
          case 'geminiApiKey':
            newSettings.geminiApiKey = setting.value;
            break;
          case 'defaultAiProvider':
            newSettings.defaultAiProvider = setting.value as any;
            break;
          case 'pexelsApiKey':
            newSettings.pexelsApiKey = setting.value;
            break;
          case 'unsplashApiKey':
            newSettings.unsplashApiKey = setting.value;
            break;
          case 'defaultImageProvider':
            newSettings.defaultImageProvider = setting.value as any;
            break;
          case 'sendgridApiKey':
            newSettings.sendgridApiKey = setting.value;
            break;
          case 'mailerliteApiKey':
            newSettings.mailerliteApiKey = setting.value;
            break;
          case 'brevoApiKey':
            newSettings.brevoApiKey = setting.value;
            break;
          case 'activeEmailService':
            newSettings.activeEmailService = setting.value as any;
            break;
          case 'senderEmail':
            newSettings.senderEmail = setting.value;
            break;
          case 'leadMagnetFolder':
            newSettings.leadMagnetFolder = setting.value;
            break;
          case 'autoEmailDelivery':
            newSettings.autoEmailDelivery = setting.value === 'true';
            break;
          case 'useExternalStorage':
            newSettings.useExternalStorage = setting.value === 'true';
            break;
          case 'externalStorageProvider':
            newSettings.externalStorageProvider = setting.value as any;
            break;
          case 'externalStorageKey':
            newSettings.externalStorageKey = setting.value;
            break;
          case 'autoBlogPublishing':
            newSettings.autoBlogPublishing = setting.value === 'true';
            break;
        }
      });
      
      setSettings(newSettings as ApiKeySettings);
    }
  }, [settingsData]);
  
  // Update blog keywords state when keywordsData is available
  useEffect(() => {
    if (keywordsData?.data && Array.isArray(keywordsData.data)) {
      const keywordsText = keywordsData.data.join('\n');
      setSettings(prev => ({
        ...prev,
        blogKeywordsFile: keywordsText
      }));
    }
  }, [keywordsData]);
  
  // Handle input changes
  const handleInputChange = (field: keyof ApiKeySettings, value: string | boolean) => {
    setSettings({
      ...settings,
      [field]: value
    });
  };
  
  // Save section settings
  const saveSettings = (section: string) => {
    const sectionSettings: Partial<ApiKeySettings> = {};
    
    switch (section) {
      case 'ai':
        sectionSettings.openaiApiKey = settings.openaiApiKey;
        sectionSettings.geminiApiKey = settings.geminiApiKey;
        sectionSettings.defaultAiProvider = settings.defaultAiProvider;
        break;
      case 'image':
        sectionSettings.pexelsApiKey = settings.pexelsApiKey;
        sectionSettings.unsplashApiKey = settings.unsplashApiKey;
        sectionSettings.defaultImageProvider = settings.defaultImageProvider;
        break;
      case 'email':
        sectionSettings.sendgridApiKey = settings.sendgridApiKey;
        sectionSettings.mailerliteApiKey = settings.mailerliteApiKey;
        sectionSettings.brevoApiKey = settings.brevoApiKey;
        sectionSettings.activeEmailService = settings.activeEmailService;
        sectionSettings.senderEmail = settings.senderEmail;
        break;
      case 'lead-magnet':
        sectionSettings.leadMagnetFolder = settings.leadMagnetFolder;
        sectionSettings.autoEmailDelivery = settings.autoEmailDelivery;
        sectionSettings.useExternalStorage = settings.useExternalStorage;
        sectionSettings.externalStorageProvider = settings.externalStorageProvider;
        sectionSettings.externalStorageKey = settings.externalStorageKey;
        break;
      case 'blog':
        // Blog keywords are handled separately
        sectionSettings.autoBlogPublishing = settings.autoBlogPublishing;
        break;
    }
    
    updateSettingsMutation.mutate(sectionSettings);
  };
  
  // Handle keyword updates
  const handleSaveKeywords = () => {
    if (settings.blogKeywordsFile.trim()) {
      updateKeywordsMutation.mutate(settings.blogKeywordsFile);
    }
  };
  
  // UI helpers
  const isPending = updateSettingsMutation.isPending;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Link href="/admin">
          <Button variant="outline" size="sm" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Integration Control Panel</h1>
          <p className="text-muted-foreground">Manage all external services and API keys</p>
        </div>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden md:inline">AI Providers</span>
            <span className="inline md:hidden">AI</span>
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden md:inline">Image Providers</span>
            <span className="inline md:hidden">Images</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <span className="hidden md:inline">Email Services</span>
            <span className="inline md:hidden">Email</span>
          </TabsTrigger>
          <TabsTrigger value="lead-magnet" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden md:inline">Lead Magnet Delivery</span>
            <span className="inline md:hidden">Lead Magnets</span>
          </TabsTrigger>
          <TabsTrigger value="blog" className="flex items-center gap-2">
            <PenBox className="h-4 w-4" />
            <span className="hidden md:inline">Auto-Blogging Settings</span>
            <span className="inline md:hidden">Auto-Blog</span>
          </TabsTrigger>
        </TabsList>
        
        {/* AI Providers Section */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Provider Integrations
              </CardTitle>
              <CardDescription>
                Configure your AI service providers for content generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* OpenAI API Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="openai-api-key" className="text-base flex items-center gap-2">
                    <Badge variant="outline" className="font-normal">OpenAI</Badge>
                    GPT-4o API Key
                  </Label>
                  {settings.openaiApiKey && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      <Check className="h-3 w-3 mr-1" /> Configured
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="openai-api-key"
                    type="password"
                    value={settings.openaiApiKey}
                    onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                    placeholder="sk-..."
                    className="pr-20"
                  />
                  {settings.openaiApiKey && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                      ••••••••{settings.openaiApiKey.slice(-4)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Used for blog content generation, quiz analysis and email templates.
                </p>
              </div>
              
              {/* Gemini API Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="gemini-api-key" className="text-base flex items-center gap-2">
                    <Badge variant="outline" className="font-normal">Google</Badge>
                    Gemini Pro API Key
                  </Label>
                  {settings.geminiApiKey && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      <Check className="h-3 w-3 mr-1" /> Configured
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="gemini-api-key"
                    type="password"
                    value={settings.geminiApiKey}
                    onChange={(e) => handleInputChange('geminiApiKey', e.target.value)}
                    placeholder="AIza..."
                    className="pr-20"
                  />
                  {settings.geminiApiKey && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                      ••••••••{settings.geminiApiKey.slice(-4)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Used for enhancing OpenAI-generated content and expanding article depth.
                </p>
              </div>
              
              {/* Default AI Provider */}
              <div className="space-y-2">
                <Label htmlFor="default-ai-provider" className="text-base">Default AI Provider</Label>
                <Select
                  value={settings.defaultAiProvider}
                  onValueChange={(value) => handleInputChange('defaultAiProvider', value)}
                >
                  <SelectTrigger id="default-ai-provider">
                    <SelectValue placeholder="Select default AI provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI GPT-4o Only</SelectItem>
                    <SelectItem value="gemini">Google Gemini Only</SelectItem>
                    <SelectItem value="both">Combined (OpenAI + Gemini)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {settings.defaultAiProvider === 'both' 
                    ? 'Using both AI systems together provides the highest quality content but uses more API credits.'
                    : settings.defaultAiProvider === 'openai'
                      ? 'Using only OpenAI provides high-quality content but may be more expensive.'
                      : 'Using only Gemini is more cost-effective but may require more content refinement.'}
                </p>
              </div>
              
              {/* Test AI Connection */}
              <div className="pt-4">
                <Button 
                  onClick={() => testAiConnectionMutation.mutate(settings.defaultAiProvider)}
                  disabled={isTestingAi || !settings.openaiApiKey || (settings.defaultAiProvider !== 'openai' && !settings.geminiApiKey)}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {isTestingAi ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Braces className="h-4 w-4 mr-2" />
                      Test AI Connection
                    </>
                  )}
                </Button>
              </div>
              
              <div className="pt-2">
                <Button 
                  onClick={() => saveSettings('ai')}
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4 mr-2" />
                      Save AI Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Image Providers Section */}
        <TabsContent value="image" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Image Provider Integrations
              </CardTitle>
              <CardDescription>
                Configure image sources for blog posts and content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pexels API Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pexels-api-key" className="text-base flex items-center gap-2">
                    <Badge variant="outline" className="font-normal">Pexels</Badge>
                    API Key
                  </Label>
                  {settings.pexelsApiKey && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      <Check className="h-3 w-3 mr-1" /> Configured
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="pexels-api-key"
                    type="password"
                    value={settings.pexelsApiKey}
                    onChange={(e) => handleInputChange('pexelsApiKey', e.target.value)}
                    placeholder="Enter Pexels API key"
                    className="pr-20"
                  />
                  {settings.pexelsApiKey && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                      ••••••••{settings.pexelsApiKey.slice(-4)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Used for finding high-quality stock photos for blog posts.
                </p>
              </div>
              
              {/* Unsplash API Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="unsplash-api-key" className="text-base flex items-center gap-2">
                    <Badge variant="outline" className="font-normal">Unsplash</Badge>
                    API Key
                  </Label>
                  {settings.unsplashApiKey && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      <Check className="h-3 w-3 mr-1" /> Configured
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="unsplash-api-key"
                    type="password"
                    value={settings.unsplashApiKey}
                    onChange={(e) => handleInputChange('unsplashApiKey', e.target.value)}
                    placeholder="Enter Unsplash API key"
                    className="pr-20"
                  />
                  {settings.unsplashApiKey && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                      ••••••••{settings.unsplashApiKey.slice(-4)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Alternative source for professional-quality images.
                </p>
              </div>
              
              {/* Default Image Provider */}
              <div className="space-y-2">
                <Label htmlFor="default-image-provider" className="text-base">Default Image Provider</Label>
                <Select
                  value={settings.defaultImageProvider}
                  onValueChange={(value) => handleInputChange('defaultImageProvider', value)}
                >
                  <SelectTrigger id="default-image-provider">
                    <SelectValue placeholder="Select default image provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pexels">Pexels Only</SelectItem>
                    <SelectItem value="unsplash">Unsplash Only</SelectItem>
                    <SelectItem value="both">Randomize Between Both</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {settings.defaultImageProvider === 'both' 
                    ? 'Using both services provides greater variety in your image library.'
                    : settings.defaultImageProvider === 'pexels'
                      ? 'Pexels offers a wide range of high-quality stock photos.'
                      : 'Unsplash provides artistic, often unique photography.'}
                </p>
              </div>
              
              <div className="pt-2">
                <Button 
                  onClick={() => saveSettings('image')}
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4 mr-2" />
                      Save Image Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Email Services Section */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Email Marketing Integrations
              </CardTitle>
              <CardDescription>
                Configure email delivery services for lead magnets and newsletters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SendGrid API Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sendgrid-api-key" className="text-base flex items-center gap-2">
                    <Badge variant="outline" className="font-normal">SendGrid</Badge>
                    API Key
                  </Label>
                  {settings.sendgridApiKey && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      <Check className="h-3 w-3 mr-1" /> Configured
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="sendgrid-api-key"
                    type="password"
                    value={settings.sendgridApiKey}
                    onChange={(e) => handleInputChange('sendgridApiKey', e.target.value)}
                    placeholder="SG..."
                    className="pr-20"
                  />
                  {settings.sendgridApiKey && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                      ••••••••{settings.sendgridApiKey.slice(-4)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Twilio SendGrid for reliable email delivery.
                </p>
              </div>
              
              {/* MailerLite API Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mailerlite-api-key" className="text-base flex items-center gap-2">
                    <Badge variant="outline" className="font-normal">MailerLite</Badge>
                    API Key
                  </Label>
                  {settings.mailerliteApiKey && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      <Check className="h-3 w-3 mr-1" /> Configured
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="mailerlite-api-key"
                    type="password"
                    value={settings.mailerliteApiKey}
                    onChange={(e) => handleInputChange('mailerliteApiKey', e.target.value)}
                    placeholder="Enter MailerLite API key"
                    className="pr-20"
                  />
                  {settings.mailerliteApiKey && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                      ••••••••{settings.mailerliteApiKey.slice(-4)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  MailerLite for newsletter delivery and automation.
                </p>
              </div>
              
              {/* Brevo API Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="brevo-api-key" className="text-base flex items-center gap-2">
                    <Badge variant="outline" className="font-normal">Brevo</Badge>
                    API Key
                  </Label>
                  {settings.brevoApiKey && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      <Check className="h-3 w-3 mr-1" /> Configured
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="brevo-api-key"
                    type="password"
                    value={settings.brevoApiKey}
                    onChange={(e) => handleInputChange('brevoApiKey', e.target.value)}
                    placeholder="Enter Brevo API key"
                    className="pr-20"
                  />
                  {settings.brevoApiKey && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                      ••••••••{settings.brevoApiKey.slice(-4)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Brevo (formerly Sendinblue) for email marketing and SMS.
                </p>
              </div>
              
              {/* Active Email Service */}
              <div className="space-y-2">
                <Label htmlFor="active-email-service" className="text-base">Active Email Service</Label>
                <Select
                  value={settings.activeEmailService}
                  onValueChange={(value) => handleInputChange('activeEmailService', value)}
                >
                  <SelectTrigger id="active-email-service">
                    <SelectValue placeholder="Select active email service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailerlite">MailerLite</SelectItem>
                    <SelectItem value="brevo">Brevo</SelectItem>
                    <SelectItem value="none">None (Disabled)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select which email provider to use for sending emails.
                </p>
              </div>
              
              {/* Sender Email */}
              <div className="space-y-2">
                <Label htmlFor="sender-email" className="text-base">Sender Email Address</Label>
                <Input
                  id="sender-email"
                  type="email"
                  value={settings.senderEmail}
                  onChange={(e) => handleInputChange('senderEmail', e.target.value)}
                  placeholder="noreply@yourdomain.com"
                />
                <p className="text-sm text-muted-foreground">
                  The email address that will appear as the sender.
                </p>
              </div>
              
              {/* Test Email */}
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="test-email" className="text-base">Test Email Configuration</Label>
                <div className="flex gap-2">
                  <Input
                    id="test-email"
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="Enter email to send test to"
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => testEmailConnectionMutation.mutate({
                      provider: settings.activeEmailService,
                      email: testEmailAddress
                    })}
                    disabled={isTestingEmail || !testEmailAddress || settings.activeEmailService === 'none'}
                    variant="outline"
                  >
                    {isTestingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <MailCheck className="h-4 w-4 mr-2" />
                        Send Test
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Send a test email to verify your configuration.
                </p>
              </div>
              
              <div className="pt-2">
                <Button 
                  onClick={() => saveSettings('email')}
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4 mr-2" />
                      Save Email Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Lead Magnet Section */}
        <TabsContent value="lead-magnet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Lead Magnet Delivery Settings
              </CardTitle>
              <CardDescription>
                Configure how lead magnets are stored and delivered
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Lead Magnet Folder */}
              <div className="space-y-2">
                <Label htmlFor="lead-magnet-folder" className="text-base">Default Folder for Lead Magnets</Label>
                <Input
                  id="lead-magnet-folder"
                  value={settings.leadMagnetFolder}
                  onChange={(e) => handleInputChange('leadMagnetFolder', e.target.value)}
                  placeholder="/public/lead-magnets"
                />
                <p className="text-sm text-muted-foreground">
                  Local folder path where lead magnet files are stored.
                </p>
              </div>
              
              {/* Auto Email Delivery */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-email-delivery" className="text-base">
                    Enable Auto-Email Delivery
                  </Label>
                  <Switch
                    id="auto-email-delivery"
                    checked={settings.autoEmailDelivery}
                    onCheckedChange={(checked) => handleInputChange('autoEmailDelivery', checked)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically send lead magnets via email after form submission.
                </p>
              </div>
              
              {/* External Storage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="use-external-storage" className="text-base">
                    Use External File Storage
                  </Label>
                  <Switch
                    id="use-external-storage"
                    checked={settings.useExternalStorage}
                    onCheckedChange={(checked) => handleInputChange('useExternalStorage', checked)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Store files on an external service instead of locally.
                </p>
              </div>
              
              {settings.useExternalStorage && (
                <>
                  {/* External Storage Provider */}
                  <div className="space-y-2">
                    <Label htmlFor="external-storage-provider" className="text-base">Storage Provider</Label>
                    <Select
                      value={settings.externalStorageProvider}
                      onValueChange={(value) => handleInputChange('externalStorageProvider', value)}
                    >
                      <SelectTrigger id="external-storage-provider">
                        <SelectValue placeholder="Select storage provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="firebase">Firebase Storage</SelectItem>
                        <SelectItem value="cloudinary">Cloudinary</SelectItem>
                        <SelectItem value="none">None (Disabled)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Select which cloud storage provider to use.
                    </p>
                  </div>
                  
                  {/* External Storage Key */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="external-storage-key" className="text-base flex items-center gap-2">
                        <Badge variant="outline" className="font-normal">
                          {settings.externalStorageProvider === 'firebase' ? 'Firebase' : 
                           settings.externalStorageProvider === 'cloudinary' ? 'Cloudinary' : 'Storage'}
                        </Badge>
                        API Key
                      </Label>
                      {settings.externalStorageKey && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          <Check className="h-3 w-3 mr-1" /> Configured
                        </Badge>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="external-storage-key"
                        type="password"
                        value={settings.externalStorageKey}
                        onChange={(e) => handleInputChange('externalStorageKey', e.target.value)}
                        placeholder="Enter storage API key"
                        className="pr-20"
                      />
                      {settings.externalStorageKey && (
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                          ••••••••{settings.externalStorageKey.slice(-4)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      API key for your selected cloud storage provider.
                    </p>
                  </div>
                </>
              )}
              
              <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Storage Information</AlertTitle>
                <AlertDescription>
                  Lead magnets must be uploaded to the specified folder before they can be delivered. 
                  Make sure the files are accessible with the correct permissions.
                </AlertDescription>
              </Alert>
              
              <div className="pt-2">
                <Button 
                  onClick={() => saveSettings('lead-magnet')}
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4 mr-2" />
                      Save Lead Magnet Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Auto-Blogging Section */}
        <TabsContent value="blog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenBox className="h-5 w-5 text-primary" />
                Auto-Blogging Configuration
              </CardTitle>
              <CardDescription>
                Configure auto-blog content generation and scheduling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Keywords Editor */}
              <div className="space-y-2">
                <Label htmlFor="blog-keywords" className="text-base">Blog Keywords</Label>
                <Textarea
                  id="blog-keywords"
                  value={settings.blogKeywordsFile}
                  onChange={(e) => handleInputChange('blogKeywordsFile', e.target.value)}
                  placeholder="Enter one keyword per line..."
                  className="font-mono h-48"
                />
                <p className="text-sm text-muted-foreground">
                  Enter one keyword per line. These will be used for automatic blog post generation.
                </p>
                
                <Button 
                  onClick={handleSaveKeywords}
                  disabled={updateKeywordsMutation.isPending}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  {updateKeywordsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving Keywords...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Keywords
                    </>
                  )}
                </Button>
              </div>
              
              <Separator />
              
              {/* Auto-Blog Publishing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-blog-publishing" className="text-base">
                    Enable Auto-Blog Publishing
                  </Label>
                  <Switch
                    id="auto-blog-publishing"
                    checked={settings.autoBlogPublishing}
                    onCheckedChange={(checked) => {
                      handleInputChange('autoBlogPublishing', checked);
                      updateAutoSchedulingMutation.mutate(checked);
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  When enabled, the system will automatically generate and publish blog posts based on your schedule.
                </p>
              </div>
              
              {/* Generate Now Button */}
              <div className="pt-4">
                <Button 
                  onClick={() => triggerBlogGenerationMutation.mutate()}
                  disabled={triggerBlogGenerationMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {triggerBlogGenerationMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Article...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate New Article Now
                    </>
                  )}
                </Button>
              </div>
              
              <Alert variant="default" className="bg-orange-50 text-orange-800 border-orange-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Content Generation Credits</AlertTitle>
                <AlertDescription>
                  Remember that generating blog posts consumes AI API credits. Make sure you have 
                  sufficient credits available before enabling automatic content generation.
                </AlertDescription>
              </Alert>
              
              <div className="pt-2">
                <Button 
                  onClick={() => saveSettings('blog')}
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4 mr-2" />
                      Save Blog Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;