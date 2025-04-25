import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Edit2, Send } from "lucide-react";

type NotificationTemplate = {
  id: number;
  type: string;
  subject: string;
  message: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
};

type NotificationLog = {
  id: number;
  subscriberId: number;
  notificationType: string;
  status: string;
  sentAt: string;
  metadata: Record<string, any>;
};

type EmailSubscriber = {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string;
  unsubscribed: boolean;
  createdAt: string;
  lastEmailSent: string | null;
  source: string;
};

export default function NotificationsPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("templates");
  
  // Form state for creating/editing templates
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    type: "welcome",
    subject: "",
    message: "",
    isActive: true
  });
  
  // Form state for sending notifications
  const [sendForm, setSendForm] = useState({
    subscriberId: "",
    type: "welcome",
    customSubject: "",
    customMessage: ""
  });
  
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get templates
        const templatesResponse = await apiRequest('GET', '/api/admin/notifications/templates');
        const templatesData = await templatesResponse.json();
        if (templatesData.success) {
          setTemplates(templatesData.data || []);
        }
        
        // Get logs
        const logsResponse = await apiRequest('GET', '/api/admin/notifications/logs');
        const logsData = await logsResponse.json();
        if (logsData.success) {
          setLogs(logsData.data || []);
        }
        
        // Get subscribers for selection dropdown
        const subscribersResponse = await apiRequest('GET', '/api/admin/subscribers');
        const subscribersData = await subscribersResponse.json();
        if (subscribersData.success) {
          setSubscribers(subscribersData.data || []);
        }
      } catch (error) {
        console.error('Error fetching notification data:', error);
        toast({
          title: "Error",
          description: "Failed to load notification data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle form input changes for template
  const handleTemplateFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTemplateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle switch/checkbox changes for template
  const handleTemplateActiveChange = (checked: boolean) => {
    setTemplateForm(prev => ({
      ...prev,
      isActive: checked
    }));
  };
  
  // Handle form input changes for sending notifications
  const handleSendFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSendForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Create or update a template
  const handleSubmitTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let response;
      
      if (editingTemplate) {
        // Update existing template
        response = await apiRequest(
          'PUT', 
          `/api/admin/notifications/templates/${editingTemplate.id}`,
          templateForm
        );
      } else {
        // Create new template
        response = await apiRequest(
          'POST', 
          '/api/admin/notifications/templates',
          templateForm
        );
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: editingTemplate 
            ? "Template updated successfully" 
            : "Template created successfully"
        });
        
        // Refresh templates
        const templatesResponse = await apiRequest('GET', '/api/admin/notifications/templates');
        const templatesData = await templatesResponse.json();
        if (templatesData.success) {
          setTemplates(templatesData.data || []);
        }
        
        // Reset form
        setTemplateForm({
          type: "welcome",
          subject: "",
          message: "",
          isActive: true
        });
        setEditingTemplate(null);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save template",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete a template
  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }
    
    try {
      const response = await apiRequest('DELETE', `/api/admin/notifications/templates/${id}`);
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Template deleted successfully"
        });
        
        // Remove from local state
        setTemplates(prev => prev.filter(template => template.id !== id));
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete template",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      });
    }
  };
  
  // Edit a template
  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      type: template.type,
      subject: template.subject,
      message: template.message,
      isActive: template.isActive
    });
    setActiveTab("templates");
  };
  
  // Send a notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest(
        'POST', 
        '/api/admin/notifications/send',
        sendForm
      );
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Notification sent successfully"
        });
        
        // Refresh logs
        const logsResponse = await apiRequest('GET', '/api/admin/notifications/logs');
        const logsData = await logsResponse.json();
        if (logsData.success) {
          setLogs(logsData.data || []);
        }
        
        // Reset form
        setSendForm({
          subscriberId: "",
          type: "welcome",
          customSubject: "",
          customMessage: ""
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send notification",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Notification System</h1>
      <p className="text-muted-foreground mb-6">
        Manage notification templates and send notifications to subscribers.
      </p>
      
      <Tabs defaultValue="templates" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="send">Send</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        
        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Template Form */}
            <Card>
              <CardHeader>
                <CardTitle>{editingTemplate ? "Edit Template" : "Create New Template"}</CardTitle>
                <CardDescription>
                  {editingTemplate 
                    ? "Update an existing notification template" 
                    : "Define a new notification template for your subscribers"}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmitTemplate}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Template Type</Label>
                    <Select 
                      value={templateForm.type} 
                      onValueChange={(value) => setTemplateForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="welcome">Welcome</SelectItem>
                        <SelectItem value="lead_magnet">Lead Magnet</SelectItem>
                        <SelectItem value="content_update">Content Update</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={templateForm.subject}
                      onChange={handleTemplateFormChange}
                      placeholder="Notification subject"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={templateForm.message}
                      onChange={handleTemplateFormChange}
                      placeholder="Enter the notification message. Use {{firstName}} to include the subscriber's name."
                      rows={8}
                      required
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={templateForm.isActive}
                      onCheckedChange={handleTemplateActiveChange}
                    />
                    <Label htmlFor="isActive">Template is active</Label>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setEditingTemplate(null);
                      setTemplateForm({
                        type: "welcome",
                        subject: "",
                        message: "",
                        isActive: true
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingTemplate ? "Update Template" : "Create Template"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
            
            {/* Template List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Existing Templates</h3>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : templates.length === 0 ? (
                <p className="text-muted-foreground">No templates found. Create your first template!</p>
              ) : (
                templates.map(template => (
                  <Card key={template.id} className={!template.isActive ? "opacity-70" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">
                          {template.subject}
                          {!template.isActive && <span className="ml-2 text-xs text-muted-foreground">(Inactive)</span>}
                        </CardTitle>
                        <div className="flex space-x-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>Type: {template.type}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <p className="text-sm whitespace-pre-wrap">
                        {template.message.length > 100 
                          ? template.message.slice(0, 100) + "..." 
                          : template.message}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Send Notifications Tab */}
        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>Send Notification</CardTitle>
              <CardDescription>
                Send a notification to a subscriber using a template or custom message
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSendNotification}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subscriberId">Recipient</Label>
                  <Select 
                    value={sendForm.subscriberId} 
                    onValueChange={(value) => setSendForm(prev => ({ ...prev, subscriberId: value }))}
                  >
                    <SelectTrigger id="subscriberId">
                      <SelectValue placeholder="Select subscriber" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscribers.map(subscriber => (
                        <SelectItem key={subscriber.id} value={subscriber.id.toString()}>
                          {subscriber.firstName} {subscriber.lastName || ''} ({subscriber.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Notification Type</Label>
                  <Select 
                    value={sendForm.type} 
                    onValueChange={(value) => setSendForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="lead_magnet">Lead Magnet</SelectItem>
                      <SelectItem value="content_update">Content Update</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Will use the template for this type unless you provide custom content below
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customSubject">Custom Subject (Optional)</Label>
                  <Input
                    id="customSubject"
                    name="customSubject"
                    value={sendForm.customSubject}
                    onChange={handleSendFormChange}
                    placeholder="Leave empty to use template subject"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customMessage">Custom Message (Optional)</Label>
                  <Textarea
                    id="customMessage"
                    name="customMessage"
                    value={sendForm.customMessage}
                    onChange={handleSendFormChange}
                    placeholder="Leave empty to use template message content"
                    rows={6}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="ml-auto" disabled={isSubmitting || !sendForm.subscriberId}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send Notification
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                Recent notifications sent to subscribers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : logs.length === 0 ? (
                <p className="text-muted-foreground">No notification logs found.</p>
              ) : (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Subscriber</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {logs.map(log => {
                        const subscriber = subscribers.find(s => s.id === log.subscriberId);
                        
                        return (
                          <tr key={log.id}>
                            <td className="px-4 py-2 text-sm">
                              {new Date(log.sentAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {subscriber 
                                ? `${subscriber.firstName} ${subscriber.lastName || ''}`
                                : `Subscriber #${log.subscriberId}`}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {log.notificationType}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                log.status === 'sent' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}