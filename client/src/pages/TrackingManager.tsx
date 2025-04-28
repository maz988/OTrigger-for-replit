import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import AdminNavigation from '@/components/AdminNavigation';
import { apiRequest, getQueryFn, queryClient } from '@/lib/queryClient';
import { Loader2, InfoIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrackingPixel {
  id: string;
  name: string;
  description: string;
  code: string;
  isEnabled: boolean;
  placementLocation: 'head' | 'body';
  formatInfo?: string;
}

const TrackingManager: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('pixels');

  // Fetch existing tracking settings
  const { data: trackingSettings, isLoading: settingsLoading, isError: settingsError } = useQuery({
    queryKey: ['/api/admin/tracking-settings'],
    queryFn: getQueryFn(),
    refetchOnWindowFocus: false,
  });

  // Initialize state for tracking pixels
  const [pixels, setPixels] = useState<TrackingPixel[]>([
    {
      id: 'facebook',
      name: 'Facebook Pixel',
      description: 'Track conversions from Facebook ads and build audiences',
      code: '',
      isEnabled: false,
      placementLocation: 'head',
      formatInfo: 'Enter your Facebook Pixel ID (e.g., 123456789012345)'
    },
    {
      id: 'snapchat',
      name: 'Snapchat Pixel',
      description: 'Track conversions from Snapchat ads',
      code: '',
      isEnabled: false,
      placementLocation: 'head',
      formatInfo: 'Enter your Snapchat Pixel ID'
    },
    {
      id: 'tiktok', 
      name: 'TikTok Pixel',
      description: 'Track conversions from TikTok ads',
      code: '',
      isEnabled: false,
      placementLocation: 'head',
      formatInfo: 'Enter your TikTok Pixel ID'
    },
    {
      id: 'googleAds',
      name: 'Google Ads (gTag)',
      description: 'Track conversions from Google Ads',
      code: '',
      isEnabled: false,
      placementLocation: 'head',
      formatInfo: 'Enter your Google Ads ID (e.g., AW-123456789)'
    },
    {
      id: 'ga4',
      name: 'Google Analytics 4',
      description: 'Track website traffic and user behavior with GA4',
      code: '',
      isEnabled: false,
      placementLocation: 'head',
      formatInfo: 'Enter your GA4 Measurement ID (e.g., G-XXXXXXXXXX)'
    }
  ]);

  // Initialize state for meta tags
  const [metaTags, setMetaTags] = useState<TrackingPixel[]>([
    {
      id: 'googleSearchConsole',
      name: 'Google Search Console',
      description: 'Verify your site with Google Search Console',
      code: '',
      isEnabled: false,
      placementLocation: 'head',
      formatInfo: 'Enter the full meta tag from Google Search Console'
    },
    {
      id: 'bingWebmaster',
      name: 'Bing Webmaster Tools',
      description: 'Verify your site with Bing Webmaster Tools',
      code: '',
      isEnabled: false,
      placementLocation: 'head',
      formatInfo: 'Enter the full meta tag from Bing Webmaster Tools'
    }
  ]);

  // Initialize state for custom scripts
  const [customScripts, setCustomScripts] = useState<TrackingPixel[]>([
    {
      id: 'customHeadScript',
      name: 'Custom Head Script',
      description: 'Add a custom script to the head of your site',
      code: '',
      isEnabled: false,
      placementLocation: 'head'
    },
    {
      id: 'customBodyScript',
      name: 'Custom Body Script',
      description: 'Add a custom script to the body of your site',
      code: '',
      isEnabled: false,
      placementLocation: 'body'
    }
  ]);

  // Update state when tracking settings are loaded
  useEffect(() => {
    if (trackingSettings?.data) {
      // Update pixels state
      const updatedPixels = pixels.map(pixel => {
        const foundSetting = trackingSettings.data.find((setting: any) => setting.settingKey === `tracking_${pixel.id}`);
        if (foundSetting) {
          try {
            const settingData = JSON.parse(foundSetting.settingValue || '{"code":"","isEnabled":false}');
            return {
              ...pixel,
              code: settingData.code || '',
              isEnabled: settingData.isEnabled || false
            };
          } catch (e) {
            console.error(`Error parsing setting for ${pixel.id}`, e);
            return pixel;
          }
        }
        return pixel;
      });
      setPixels(updatedPixels);

      // Update meta tags state
      const updatedMetaTags = metaTags.map(tag => {
        const foundSetting = trackingSettings.data.find((setting: any) => setting.settingKey === `tracking_${tag.id}`);
        if (foundSetting) {
          try {
            const settingData = JSON.parse(foundSetting.settingValue || '{"code":"","isEnabled":false}');
            return {
              ...tag,
              code: settingData.code || '',
              isEnabled: settingData.isEnabled || false
            };
          } catch (e) {
            console.error(`Error parsing setting for ${tag.id}`, e);
            return tag;
          }
        }
        return tag;
      });
      setMetaTags(updatedMetaTags);

      // Update custom scripts state
      const updatedCustomScripts = customScripts.map(script => {
        const foundSetting = trackingSettings.data.find((setting: any) => setting.settingKey === `tracking_${script.id}`);
        if (foundSetting) {
          try {
            const settingData = JSON.parse(foundSetting.settingValue || '{"code":"","isEnabled":false}');
            return {
              ...script,
              code: settingData.code || '',
              isEnabled: settingData.isEnabled || false
            };
          } catch (e) {
            console.error(`Error parsing setting for ${script.id}`, e);
            return script;
          }
        }
        return script;
      });
      setCustomScripts(updatedCustomScripts);
    }
  }, [trackingSettings]);

  // Save tracking settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/admin/tracking-settings', data);
    },
    onSuccess: () => {
      toast({
        title: 'Settings saved',
        description: 'Tracking settings saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tracking-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving settings',
        description: error.message || 'An error occurred while saving tracking settings.',
        variant: 'destructive',
      });
    }
  });

  // Handle saving all tracking settings
  const handleSaveAll = () => {
    const allSettings = [
      ...pixels.map(pixel => ({
        settingKey: `tracking_${pixel.id}`,
        settingValue: JSON.stringify({
          code: pixel.code,
          isEnabled: pixel.isEnabled
        }),
        settingType: 'tracking'
      })),
      ...metaTags.map(tag => ({
        settingKey: `tracking_${tag.id}`,
        settingValue: JSON.stringify({
          code: tag.code,
          isEnabled: tag.isEnabled
        }),
        settingType: 'tracking'
      })),
      ...customScripts.map(script => ({
        settingKey: `tracking_${script.id}`,
        settingValue: JSON.stringify({
          code: script.code,
          isEnabled: script.isEnabled
        }),
        settingType: 'tracking'
      }))
    ];

    saveSettingsMutation.mutate(allSettings);
  };

  // Handle toggle change for tracking pixels
  const handlePixelToggleChange = (id: string, checked: boolean) => {
    setPixels(prevPixels => 
      prevPixels.map(pixel => 
        pixel.id === id ? { ...pixel, isEnabled: checked } : pixel
      )
    );
  };

  // Handle code change for tracking pixels
  const handlePixelCodeChange = (id: string, code: string) => {
    setPixels(prevPixels => 
      prevPixels.map(pixel => 
        pixel.id === id ? { ...pixel, code } : pixel
      )
    );
  };

  // Handle toggle change for meta tags
  const handleMetaTagToggleChange = (id: string, checked: boolean) => {
    setMetaTags(prevTags => 
      prevTags.map(tag => 
        tag.id === id ? { ...tag, isEnabled: checked } : tag
      )
    );
  };

  // Handle code change for meta tags
  const handleMetaTagCodeChange = (id: string, code: string) => {
    setMetaTags(prevTags => 
      prevTags.map(tag => 
        tag.id === id ? { ...tag, code } : tag
      )
    );
  };

  // Handle toggle change for custom scripts
  const handleCustomScriptToggleChange = (id: string, checked: boolean) => {
    setCustomScripts(prevScripts => 
      prevScripts.map(script => 
        script.id === id ? { ...script, isEnabled: checked } : script
      )
    );
  };

  // Handle code change for custom scripts
  const handleCustomScriptCodeChange = (id: string, code: string) => {
    setCustomScripts(prevScripts => 
      prevScripts.map(script => 
        script.id === id ? { ...script, code } : script
      )
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-2">Tracking & Analytics Manager</h1>
      <p className="text-muted-foreground mb-6">Manage all your tracking pixels, meta tags, and analytics scripts</p>
      
      <AdminNavigation />
      
      <Tabs defaultValue="pixels" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pixels">Tracking Pixels</TabsTrigger>
          <TabsTrigger value="metatags">Meta Tags</TabsTrigger>
          <TabsTrigger value="customscripts">Custom Scripts</TabsTrigger>
        </TabsList>

        {/* Tracking Pixels Tab */}
        <TabsContent value="pixels" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Tracking Pixels</h2>
            <Button onClick={handleSaveAll} disabled={saveSettingsMutation.isPending}>
              {saveSettingsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save All Changes
            </Button>
          </div>

          {settingsLoading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {pixels.map((pixel) => (
                <Card key={pixel.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 pb-2">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{pixel.name}</CardTitle>
                        <CardDescription>{pixel.description}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`${pixel.id}-toggle`} className="text-sm font-medium mr-2">
                          {pixel.isEnabled ? 'Active' : 'Inactive'}
                        </Label>
                        <Switch
                          id={`${pixel.id}-toggle`}
                          checked={pixel.isEnabled}
                          onCheckedChange={(checked) => handlePixelToggleChange(pixel.id, checked)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`${pixel.id}-code`} className="text-sm font-medium">
                          Pixel Code/ID
                        </Label>
                        {pixel.formatInfo && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoIcon className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs text-xs">{pixel.formatInfo}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <Input
                        id={`${pixel.id}-code`}
                        value={pixel.code}
                        onChange={(e) => handlePixelCodeChange(pixel.id, e.target.value)}
                        placeholder={`Enter your ${pixel.name} code or ID`}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Meta Tags Tab */}
        <TabsContent value="metatags" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Verification Meta Tags</h2>
            <Button onClick={handleSaveAll} disabled={saveSettingsMutation.isPending}>
              {saveSettingsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save All Changes
            </Button>
          </div>

          {settingsLoading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {metaTags.map((tag) => (
                <Card key={tag.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 pb-2">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{tag.name}</CardTitle>
                        <CardDescription>{tag.description}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`${tag.id}-toggle`} className="text-sm font-medium mr-2">
                          {tag.isEnabled ? 'Active' : 'Inactive'}
                        </Label>
                        <Switch
                          id={`${tag.id}-toggle`}
                          checked={tag.isEnabled}
                          onCheckedChange={(checked) => handleMetaTagToggleChange(tag.id, checked)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`${tag.id}-code`} className="text-sm font-medium">
                          Meta Tag Code
                        </Label>
                        {tag.formatInfo && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoIcon className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs text-xs">{tag.formatInfo}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <Input
                        id={`${tag.id}-code`}
                        value={tag.code}
                        onChange={(e) => handleMetaTagCodeChange(tag.id, e.target.value)}
                        placeholder={`Enter your ${tag.name} verification meta tag`}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Custom Scripts Tab */}
        <TabsContent value="customscripts" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Custom Scripts</h2>
            <Button onClick={handleSaveAll} disabled={saveSettingsMutation.isPending}>
              {saveSettingsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save All Changes
            </Button>
          </div>

          {settingsLoading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {customScripts.map((script) => (
                <Card key={script.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 pb-2">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{script.name}</CardTitle>
                        <CardDescription>{script.description}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`${script.id}-toggle`} className="text-sm font-medium mr-2">
                          {script.isEnabled ? 'Active' : 'Inactive'}
                        </Label>
                        <Switch
                          id={`${script.id}-toggle`}
                          checked={script.isEnabled}
                          onCheckedChange={(checked) => handleCustomScriptToggleChange(script.id, checked)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${script.id}-code`} className="text-sm font-medium">
                        Script Code
                      </Label>
                      <Textarea
                        id={`${script.id}-code`}
                        value={script.code}
                        onChange={(e) => handleCustomScriptCodeChange(script.id, e.target.value)}
                        placeholder={`Enter your custom script code (including <script> tags)`}
                        className="min-h-[120px] font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Will be placed in the {script.placementLocation === 'head' ? '<head>' : '<body>'} section of the site.
                        Enter the full script including the &lt;script&gt; tags.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrackingManager;