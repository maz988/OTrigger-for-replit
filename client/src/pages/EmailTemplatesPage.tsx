import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import RichTextEditor from '@/components/RichTextEditor';
import AdminNavigation from '@/components/AdminNavigation';
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Eye,
  Mail,
  Clock,
  CalendarDays,
  FileEdit,
  Send,
  ChevronRight,
  Check,
  X,
  RefreshCw,
  Calendar,
  Paperclip,
  Settings,
  ArrowUpDown
} from 'lucide-react';

// Types from schema
interface EmailSequence {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string | null;
}

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  content: string;
  emailType: string;
  sequenceId: number;
  delayDays: number;
  attachLeadMagnet: boolean;
  leadMagnetPath: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

interface LeadMagnet {
  id: number;
  name: string;
  description: string | null;
  filePath: string;
  downloadCount: number;
  createdAt: string;
}

interface EmailQueue {
  id: number;
  subscriberId: number;
  templateId: number;
  scheduledFor: string;
  status: string;
  statusMessage: string | null;
  createdAt: string;
  processedAt: string | null;
}

const EmailTemplatesPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('sequences');
  
  // Sequences state
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false);
  const [isEditSequenceDialogOpen, setIsEditSequenceDialogOpen] = useState(false);
  const [isDeleteSequenceDialogOpen, setIsDeleteSequenceDialogOpen] = useState(false);
  const [selectedSequenceId, setSelectedSequenceId] = useState<number | null>(null);
  const [sequenceFormData, setSequenceFormData] = useState<Partial<EmailSequence>>({
    name: '',
    description: '',
    isDefault: false
  });
  
  // Templates state
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isEditTemplateDialogOpen, setIsEditTemplateDialogOpen] = useState(false);
  const [isViewTemplateDialogOpen, setIsViewTemplateDialogOpen] = useState(false);
  const [isDeleteTemplateDialogOpen, setIsDeleteTemplateDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templateFormData, setTemplateFormData] = useState<Partial<EmailTemplate>>({
    name: '',
    subject: '',
    content: '',
    emailType: 'custom',
    sequenceId: 0,
    delayDays: 0,
    attachLeadMagnet: false,
    leadMagnetPath: null,
    isActive: true
  });
  
  // Email Queue state
  const [isProcessQueueDialogOpen, setIsProcessQueueDialogOpen] = useState(false);
  
  // Queries
  const {
    data: sequences,
    isLoading: sequencesLoading,
    error: sequencesError,
    refetch: refetchSequences
  } = useQuery({ 
    queryKey: ['/api/admin/email/sequences'],
    queryFn: getQueryFn()
  });
  
  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates
  } = useQuery({ 
    queryKey: ['/api/admin/email/templates'],
    queryFn: getQueryFn()
  });
  
  const {
    data: leadMagnets,
    isLoading: leadMagnetsLoading
  } = useQuery({ 
    queryKey: ['/api/admin/leadmagnets'],
    queryFn: getQueryFn()
  });
  
  const {
    data: emailQueue,
    isLoading: queueLoading,
    refetch: refetchQueue
  } = useQuery({ 
    queryKey: ['/api/admin/email/queue'],
    queryFn: getQueryFn()
  });
  
  // Mutations
  const createSequenceMutation = useMutation({
    mutationFn: async (sequence: Partial<EmailSequence>) => {
      const res = await apiRequest('POST', '/api/admin/email/sequences', sequence);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email/sequences'] });
      toast({
        title: 'Sequence created',
        description: 'The email sequence has been created successfully',
      });
      setIsSequenceDialogOpen(false);
      resetSequenceForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create sequence: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const updateSequenceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<EmailSequence> }) => {
      const res = await apiRequest('PUT', `/api/admin/email/sequences/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email/sequences'] });
      toast({
        title: 'Sequence updated',
        description: 'The email sequence has been updated successfully',
      });
      setIsEditSequenceDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update sequence: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const deleteSequenceMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/email/sequences/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email/sequences'] });
      toast({
        title: 'Sequence deleted',
        description: 'The email sequence has been deleted successfully',
      });
      setIsDeleteSequenceDialogOpen(false);
      setSelectedSequenceId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete sequence: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const createTemplateMutation = useMutation({
    mutationFn: async (template: Partial<EmailTemplate>) => {
      const res = await apiRequest('POST', '/api/admin/email/templates', template);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email/templates'] });
      toast({
        title: 'Template created',
        description: 'The email template has been created successfully',
      });
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create template: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<EmailTemplate> }) => {
      const res = await apiRequest('PUT', `/api/admin/email/templates/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email/templates'] });
      toast({
        title: 'Template updated',
        description: 'The email template has been updated successfully',
      });
      setIsEditTemplateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update template: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/email/templates/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email/templates'] });
      toast({
        title: 'Template deleted',
        description: 'The email template has been deleted successfully',
      });
      setIsDeleteTemplateDialogOpen(false);
      setSelectedTemplateId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete template: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const toggleTemplateMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest('PUT', `/api/admin/email/templates/${id}/toggle`, { isActive });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email/templates'] });
      toast({
        title: 'Template updated',
        description: 'The template status has been updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update template status: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const processQueueMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/email/queue/process');
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Processing started',
        description: 'Email queue processing has been started',
      });
      setIsProcessQueueDialogOpen(false);
      // Refetch after a delay to get updated status
      setTimeout(() => {
        refetchQueue();
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to process email queue: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const deleteQueueItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/email/queue/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email/queue'] });
      toast({
        title: 'Queue item deleted',
        description: 'The email queue item has been deleted',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete queue item: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Helper functions
  const resetSequenceForm = () => {
    setSequenceFormData({
      name: '',
      description: '',
      isDefault: false
    });
  };
  
  const resetTemplateForm = () => {
    setTemplateFormData({
      name: '',
      subject: '',
      content: '',
      emailType: 'custom',
      sequenceId: sequences?.data?.[0]?.id || 0,
      delayDays: 0,
      attachLeadMagnet: false,
      leadMagnetPath: null,
      isActive: true
    });
  };
  
  const handleEditSequence = (sequence: EmailSequence) => {
    setSelectedSequenceId(sequence.id);
    setSequenceFormData({
      name: sequence.name,
      description: sequence.description,
      isDefault: sequence.isDefault
    });
    setIsEditSequenceDialogOpen(true);
  };
  
  const handleDeleteSequence = (id: number) => {
    setSelectedSequenceId(id);
    setIsDeleteSequenceDialogOpen(true);
  };
  
  const handleViewTemplate = (template: EmailTemplate) => {
    setSelectedTemplateId(template.id);
    setTemplateFormData(template);
    setIsViewTemplateDialogOpen(true);
  };
  
  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplateId(template.id);
    setTemplateFormData(template);
    setIsEditTemplateDialogOpen(true);
  };
  
  const handleDeleteTemplate = (id: number) => {
    setSelectedTemplateId(id);
    setIsDeleteTemplateDialogOpen(true);
  };
  
  const handleToggleTemplate = (id: number, isActive: boolean) => {
    toggleTemplateMutation.mutate({ id, isActive: !isActive });
  };
  
  const getSequenceName = (id: number) => {
    const sequence = sequences?.data?.find(seq => seq.id === id);
    return sequence ? sequence.name : 'Unknown Sequence';
  };
  
  const getTemplateName = (id: number) => {
    const template = templates?.data?.find(tpl => tpl.id === id);
    return template ? template.name : 'Unknown Template';
  };
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <AdminNavigation />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Email Management</h1>
        <p className="text-muted-foreground">Manage email templates, sequences and scheduled emails</p>
      </div>
      
      <Tabs defaultValue="sequences" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sequences">Email Sequences</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="queue">Email Queue</TabsTrigger>
        </TabsList>
        
        {/* Email Sequences Tab */}
        <TabsContent value="sequences" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Email Sequences</h2>
            <Button onClick={() => {
              resetSequenceForm();
              setIsSequenceDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" /> Add Sequence
            </Button>
          </div>
          
          {sequencesLoading ? (
            <div className="w-full h-48 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : sequencesError ? (
            <div className="bg-destructive/20 p-4 rounded-md">
              <p className="text-destructive">Error loading sequences. Please try again.</p>
            </div>
          ) : sequences?.data?.length === 0 ? (
            <div className="bg-muted p-8 rounded-md text-center">
              <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-1">No Email Sequences Found</h3>
              <p className="text-muted-foreground mb-4">Create a sequence to start organizing your email templates</p>
              <Button onClick={() => {
                resetSequenceForm();
                setIsSequenceDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" /> Create Your First Sequence
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sequences?.data?.map((sequence: EmailSequence) => (
                <Card key={sequence.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="mr-2">{sequence.name}</CardTitle>
                      {sequence.isDefault && (
                        <Badge variant="outline" className="bg-primary/10">Default</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {sequence.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Created: {formatDate(sequence.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {templates?.data?.filter((t: EmailTemplate) => t.sequenceId === sequence.id).length || 0} templates
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditSequence(sequence)}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive hover:text-destructive" 
                      onClick={() => handleDeleteSequence(sequence.id)}
                      disabled={sequence.isDefault}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Email Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Email Templates</h2>
            <Button onClick={() => {
              resetTemplateForm();
              setIsTemplateDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" /> Add Template
            </Button>
          </div>
          
          {templatesLoading ? (
            <div className="w-full h-48 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : templatesError ? (
            <div className="bg-destructive/20 p-4 rounded-md">
              <p className="text-destructive">Error loading templates. Please try again.</p>
            </div>
          ) : templates?.data?.length === 0 ? (
            <div className="bg-muted p-8 rounded-md text-center">
              <Mail className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-1">No Email Templates Found</h3>
              <p className="text-muted-foreground mb-4">Create a template to start sending emails to your subscribers</p>
              <Button onClick={() => {
                resetTemplateForm();
                setIsTemplateDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" /> Create Your First Template
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Sequence</TableHead>
                    <TableHead>Delay</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates?.data?.map((template: EmailTemplate) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{getSequenceName(template.sequenceId)}</TableCell>
                      <TableCell>
                        {template.delayDays === 0 ? (
                          <span>Immediate</span>
                        ) : (
                          <span>{template.delayDays} day{template.delayDays !== 1 ? 's' : ''}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {template.emailType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div 
                            className={`h-2.5 w-2.5 rounded-full mr-2 ${
                              template.isActive ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          ></div>
                          <span>{template.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleViewTemplate(template)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(template)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleToggleTemplate(template.id, template.isActive)}
                          >
                            {template.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive" 
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        {/* Email Queue Tab */}
        <TabsContent value="queue" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Email Queue</h2>
            <Button onClick={() => setIsProcessQueueDialogOpen(true)}>
              <RefreshCw className="mr-2 h-4 w-4" /> Process Queue
            </Button>
          </div>
          
          {queueLoading ? (
            <div className="w-full h-48 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : emailQueue?.data?.length === 0 ? (
            <div className="bg-muted p-8 rounded-md text-center">
              <Clock className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-1">No Emails In Queue</h3>
              <p className="text-muted-foreground">All scheduled emails have been processed</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailQueue?.data?.map((item: EmailQueue) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{getTemplateName(item.templateId)}</TableCell>
                      <TableCell>{formatDate(item.scheduledFor)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            item.status === 'sent' ? 'default' : 
                            item.status === 'failed' ? 'destructive' : 
                            item.status === 'processing' ? 'outline' : 
                            'secondary'
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteQueueItemMutation.mutate(item.id)}
                          disabled={item.status === 'sent' || item.status === 'processing'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Create Sequence Dialog */}
      <Dialog open={isSequenceDialogOpen} onOpenChange={setIsSequenceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Email Sequence</DialogTitle>
            <DialogDescription>
              Add a new email sequence to organize your email templates.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sequenceName" className="text-right">
                Name
              </Label>
              <Input
                id="sequenceName"
                value={sequenceFormData.name}
                onChange={(e) => setSequenceFormData({ ...sequenceFormData, name: e.target.value })}
                className="col-span-3"
                placeholder="Welcome Sequence"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sequenceDescription" className="text-right">
                Description
              </Label>
              <Textarea
                id="sequenceDescription"
                value={sequenceFormData.description || ''}
                onChange={(e) => setSequenceFormData({ ...sequenceFormData, description: e.target.value })}
                className="col-span-3"
                placeholder="A sequence of emails for new subscribers"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isDefault" className="text-right">
                Default
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="isDefault"
                  checked={sequenceFormData.isDefault}
                  onCheckedChange={(checked) => setSequenceFormData({ ...sequenceFormData, isDefault: checked })}
                />
                <Label htmlFor="isDefault">Set as default sequence</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsSequenceDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => createSequenceMutation.mutate(sequenceFormData)}
              disabled={!sequenceFormData.name || createSequenceMutation.isPending}
            >
              {createSequenceMutation.isPending && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              )}
              Create Sequence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Sequence Dialog */}
      <Dialog open={isEditSequenceDialogOpen} onOpenChange={setIsEditSequenceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Email Sequence</DialogTitle>
            <DialogDescription>
              Update the email sequence details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editSequenceName" className="text-right">
                Name
              </Label>
              <Input
                id="editSequenceName"
                value={sequenceFormData.name}
                onChange={(e) => setSequenceFormData({ ...sequenceFormData, name: e.target.value })}
                className="col-span-3"
                placeholder="Welcome Sequence"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editSequenceDescription" className="text-right">
                Description
              </Label>
              <Textarea
                id="editSequenceDescription"
                value={sequenceFormData.description || ''}
                onChange={(e) => setSequenceFormData({ ...sequenceFormData, description: e.target.value })}
                className="col-span-3"
                placeholder="A sequence of emails for new subscribers"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editIsDefault" className="text-right">
                Default
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="editIsDefault"
                  checked={sequenceFormData.isDefault}
                  onCheckedChange={(checked) => setSequenceFormData({ ...sequenceFormData, isDefault: checked })}
                />
                <Label htmlFor="editIsDefault">Set as default sequence</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditSequenceDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedSequenceId) {
                  updateSequenceMutation.mutate({ 
                    id: selectedSequenceId, 
                    data: sequenceFormData 
                  });
                }
              }}
              disabled={!sequenceFormData.name || updateSequenceMutation.isPending}
            >
              {updateSequenceMutation.isPending && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              )}
              Update Sequence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Sequence Confirmation */}
      <AlertDialog open={isDeleteSequenceDialogOpen} onOpenChange={setIsDeleteSequenceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the email sequence and all associated templates.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteSequenceDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedSequenceId) {
                  deleteSequenceMutation.mutate(selectedSequenceId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Create Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Add a new email template to your sequence.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="templateName" className="text-right">
                Name
              </Label>
              <Input
                id="templateName"
                value={templateFormData.name}
                onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                className="col-span-3"
                placeholder="Welcome Email"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="templateSubject" className="text-right">
                Subject
              </Label>
              <Input
                id="templateSubject"
                value={templateFormData.subject}
                onChange={(e) => setTemplateFormData({ ...templateFormData, subject: e.target.value })}
                className="col-span-3"
                placeholder="Welcome to our community!"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="templateSequence" className="text-right">
                Sequence
              </Label>
              <Select
                value={String(templateFormData.sequenceId)}
                onValueChange={(value) => setTemplateFormData({ ...templateFormData, sequenceId: parseInt(value) })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select sequence" />
                </SelectTrigger>
                <SelectContent>
                  {sequences?.data?.map((seq: EmailSequence) => (
                    <SelectItem key={seq.id} value={String(seq.id)}>
                      {seq.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="templateType" className="text-right">
                Type
              </Label>
              <Select
                value={templateFormData.emailType}
                onValueChange={(value) => setTemplateFormData({ ...templateFormData, emailType: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="hero_instinct">Hero Instinct</SelectItem>
                  <SelectItem value="value">Value</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="affiliate">Affiliate</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="templateDelay" className="text-right">
                Delay (days)
              </Label>
              <Input
                id="templateDelay"
                type="number"
                min="0"
                value={templateFormData.delayDays}
                onChange={(e) => setTemplateFormData({ ...templateFormData, delayDays: parseInt(e.target.value) })}
                className="col-span-3"
                placeholder="0"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="templateActive" className="text-right">
                Active
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="templateActive"
                  checked={templateFormData.isActive}
                  onCheckedChange={(checked) => setTemplateFormData({ ...templateFormData, isActive: checked })}
                />
                <Label htmlFor="templateActive">Template is active</Label>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="templateAttachment" className="text-right">
                Attachment
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="templateAttachment"
                  checked={templateFormData.attachLeadMagnet}
                  onCheckedChange={(checked) => setTemplateFormData({ ...templateFormData, attachLeadMagnet: checked })}
                />
                <Label htmlFor="templateAttachment">Attach lead magnet</Label>
              </div>
            </div>
            {templateFormData.attachLeadMagnet && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="templateLeadMagnet" className="text-right">
                  Lead Magnet
                </Label>
                <Select
                  value={templateFormData.leadMagnetPath || ''}
                  onValueChange={(value) => setTemplateFormData({ ...templateFormData, leadMagnetPath: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select lead magnet" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadMagnets?.data?.map((lm: LeadMagnet) => (
                      <SelectItem key={lm.id} value={lm.filePath}>
                        {lm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-4 gap-4">
              <Label htmlFor="templateContent" className="text-right mt-2">
                Content
              </Label>
              <div className="col-span-3">
                <div className="border rounded-md p-1 min-h-[150px]">
                  <RichTextEditor
                    value={templateFormData.content}
                    onChange={(value) => setTemplateFormData({ ...templateFormData, content: value })}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use {{firstName}} and other variables to personalize your email.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsTemplateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => createTemplateMutation.mutate(templateFormData)}
              disabled={
                !templateFormData.name || 
                !templateFormData.subject || 
                !templateFormData.content || 
                createTemplateMutation.isPending
              }
            >
              {createTemplateMutation.isPending && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              )}
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Template Dialog */}
      <Dialog open={isEditTemplateDialogOpen} onOpenChange={setIsEditTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Update the email template details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTemplateName" className="text-right">
                Name
              </Label>
              <Input
                id="editTemplateName"
                value={templateFormData.name}
                onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                className="col-span-3"
                placeholder="Welcome Email"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTemplateSubject" className="text-right">
                Subject
              </Label>
              <Input
                id="editTemplateSubject"
                value={templateFormData.subject}
                onChange={(e) => setTemplateFormData({ ...templateFormData, subject: e.target.value })}
                className="col-span-3"
                placeholder="Welcome to our community!"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTemplateSequence" className="text-right">
                Sequence
              </Label>
              <Select
                value={String(templateFormData.sequenceId)}
                onValueChange={(value) => setTemplateFormData({ ...templateFormData, sequenceId: parseInt(value) })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select sequence" />
                </SelectTrigger>
                <SelectContent>
                  {sequences?.data?.map((seq: EmailSequence) => (
                    <SelectItem key={seq.id} value={String(seq.id)}>
                      {seq.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTemplateType" className="text-right">
                Type
              </Label>
              <Select
                value={templateFormData.emailType}
                onValueChange={(value) => setTemplateFormData({ ...templateFormData, emailType: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="hero_instinct">Hero Instinct</SelectItem>
                  <SelectItem value="value">Value</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="affiliate">Affiliate</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTemplateDelay" className="text-right">
                Delay (days)
              </Label>
              <Input
                id="editTemplateDelay"
                type="number"
                min="0"
                value={templateFormData.delayDays}
                onChange={(e) => setTemplateFormData({ ...templateFormData, delayDays: parseInt(e.target.value) })}
                className="col-span-3"
                placeholder="0"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTemplateActive" className="text-right">
                Active
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="editTemplateActive"
                  checked={templateFormData.isActive}
                  onCheckedChange={(checked) => setTemplateFormData({ ...templateFormData, isActive: checked })}
                />
                <Label htmlFor="editTemplateActive">Template is active</Label>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTemplateAttachment" className="text-right">
                Attachment
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="editTemplateAttachment"
                  checked={templateFormData.attachLeadMagnet}
                  onCheckedChange={(checked) => setTemplateFormData({ ...templateFormData, attachLeadMagnet: checked })}
                />
                <Label htmlFor="editTemplateAttachment">Attach lead magnet</Label>
              </div>
            </div>
            {templateFormData.attachLeadMagnet && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editTemplateLeadMagnet" className="text-right">
                  Lead Magnet
                </Label>
                <Select
                  value={templateFormData.leadMagnetPath || ''}
                  onValueChange={(value) => setTemplateFormData({ ...templateFormData, leadMagnetPath: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select lead magnet" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadMagnets?.data?.map((lm: LeadMagnet) => (
                      <SelectItem key={lm.id} value={lm.filePath}>
                        {lm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-4 gap-4">
              <Label htmlFor="editTemplateContent" className="text-right mt-2">
                Content
              </Label>
              <div className="col-span-3">
                <div className="border rounded-md p-1 min-h-[150px]">
                  <RichTextEditor
                    value={templateFormData.content}
                    onChange={(value) => setTemplateFormData({ ...templateFormData, content: value })}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use {{firstName}} and other variables to personalize your email.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditTemplateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedTemplateId) {
                  updateTemplateMutation.mutate({ 
                    id: selectedTemplateId, 
                    data: templateFormData 
                  });
                }
              }}
              disabled={
                !templateFormData.name || 
                !templateFormData.subject || 
                !templateFormData.content || 
                updateTemplateMutation.isPending
              }
            >
              {updateTemplateMutation.isPending && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              )}
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Template Dialog */}
      <Dialog open={isViewTemplateDialogOpen} onOpenChange={setIsViewTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{templateFormData.name}</DialogTitle>
            <DialogDescription>
              {getSequenceName(templateFormData.sequenceId)} · {templateFormData.delayDays} day{templateFormData.delayDays !== 1 ? 's' : ''} delay
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-1">
              <Label>Subject</Label>
              <div className="p-2 rounded-md border bg-muted/50">
                {templateFormData.subject}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label>Content</Label>
                <div className="flex gap-2 items-center">
                  {templateFormData.attachLeadMagnet && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      Lead Magnet
                    </Badge>
                  )}
                  <Badge variant="outline" className="capitalize">
                    {templateFormData.emailType.replace('_', ' ')}
                  </Badge>
                  <Badge 
                    variant={templateFormData.isActive ? 'default' : 'secondary'}
                  >
                    {templateFormData.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div 
                className="p-4 rounded-md border bg-background" 
                dangerouslySetInnerHTML={{ __html: templateFormData.content }} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="secondary" 
              onClick={() => {
                setIsViewTemplateDialogOpen(false);
                handleEditTemplate(templateFormData as EmailTemplate);
              }}
            >
              <Edit className="mr-2 h-4 w-4" /> Edit Template
            </Button>
            <Button 
              variant="default" 
              onClick={() => setIsViewTemplateDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Template Confirmation */}
      <AlertDialog open={isDeleteTemplateDialogOpen} onOpenChange={setIsDeleteTemplateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this email template.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteTemplateDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedTemplateId) {
                  deleteTemplateMutation.mutate(selectedTemplateId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Process Queue Confirmation */}
      <AlertDialog open={isProcessQueueDialogOpen} onOpenChange={setIsProcessQueueDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process Email Queue</AlertDialogTitle>
            <AlertDialogDescription>
              This will process all pending emails in the queue that are scheduled for now or earlier.
              Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsProcessQueueDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => processQueueMutation.mutate()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Process Queue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmailTemplatesPage;