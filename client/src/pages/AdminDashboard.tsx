import React, { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AdminNavigation from '@/components/AdminNavigation';
import RichTextEditor from '@/components/RichTextEditor';
import { 
  BarChart3, 
  FileText, 
  Settings,
  Users,
  Plus,
  Edit,
  Loader2
} from 'lucide-react';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';

// Define types for website content
interface WebsiteSection {
  id: string;
  name: string;
  sectionType: string;
  content: string;
  settings: Record<string, string>;
}

interface SectionFormData {
  name: string;
  content: string;
  settings: Record<string, string>;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const { toast } = useToast();
  
  // State for website section editing
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<Partial<WebsiteSection> | null>(null);
  const [sectionFormData, setSectionFormData] = useState<SectionFormData>({
    name: '',
    content: '',
    settings: {}
  });
  
  // Fetch dashboard overview data
  const { data: dashboardOverviewResponse, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/admin/dashboard/overview'],
    queryFn: getQueryFn(),
    refetchOnWindowFocus: false,
  });
  
  // Mock mutation for updating website content
  const updateSectionMutation = useMutation({
    mutationFn: async (data: any) => {
      // In a real implementation, this would call your API
      console.log('Updating section with data:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Section updated',
        description: 'The website section has been updated successfully.',
      });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'There was an error updating the section. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Function to handle opening the edit dialog
  const handleEditSection = (sectionName: string, description: string) => {
    setCurrentSection({
      id: sectionName.toLowerCase().replace(/\s+/g, '-'),
      name: sectionName,
      sectionType: 'content',
      content: description,
      settings: {
        title: sectionName,
        description: description,
      }
    });
    
    setSectionFormData({
      name: sectionName,
      content: description,
      settings: {
        title: sectionName,
        description: description,
      }
    });
    
    setIsEditDialogOpen(true);
  };

  const handleSaveSection = () => {
    if (currentSection) {
      updateSectionMutation.mutate({
        id: currentSection.id,
        ...sectionFormData
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground">Monitor performance metrics for your quiz and blog system</p>
      
      <AdminNavigation />
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="blog">Blog Analytics</TabsTrigger>
          <TabsTrigger value="content">Blog Posts</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="website">Website Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Sample Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Quiz Responses</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardLoading ? (
                  <div>Loading...</div>
                ) : (
                  <div className="text-3xl font-bold">
                    {dashboardOverviewResponse?.data?.totalQuizResponses || 0}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Blog Analytics Tab */}
        <TabsContent value="blog" className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Blog Analytics</h2>
          <Card>
            <CardHeader>
              <CardTitle>Blog Performance</CardTitle>
              <CardDescription>View detailed analytics of your blog posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div>Sample Blog Analytics Content</div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blog Posts Tab */}
        <TabsContent value="content" className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Blog Posts</h2>
          <Card>
            <CardHeader>
              <CardTitle>Manage Blog Posts</CardTitle>
              <CardDescription>Create, edit, and manage your blog posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div>Sample Blog Post Management Content</div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers" className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Email Subscribers</h2>
          <Card>
            <CardHeader>
              <CardTitle>Manage Subscribers</CardTitle>
              <CardDescription>View and manage your email subscribers</CardDescription>
            </CardHeader>
            <CardContent>
              <div>Sample Subscribers Management Content</div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Website Content Tab */}
        <TabsContent value="website" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Website Content</h2>
              <p className="text-muted-foreground">Manage your website content, pages, and sections</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Section
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Home Page</CardTitle>
                <CardDescription>Manage your home page content and sections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-medium">Hero Section</h3>
                      <Button variant="outline" size="sm" onClick={() => handleEditSection("Hero Section", "The main hero section with heading, subheading, and call-to-action")}>Edit</Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      The main hero section with heading, subheading, and call-to-action
                    </div>
                  </div>

                  <div className="bg-muted rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-medium">Features Section</h3>
                      <Button variant="outline" size="sm" onClick={() => handleEditSection("Features Section", "Highlights key features of the Obsession Trigger system")}>Edit</Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Highlights key features of the Obsession Trigger system
                    </div>
                  </div>

                  <div className="bg-muted rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-medium">Testimonials Section</h3>
                      <Button variant="outline" size="sm" onClick={() => handleEditSection("Testimonials Section", "User testimonials and success stories")}>Edit</Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      User testimonials and success stories
                    </div>
                  </div>

                  <div className="bg-muted rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-medium">Call to Action Section</h3>
                      <Button variant="outline" size="sm" onClick={() => handleEditSection("Call to Action Section", "Final call to action encouraging quiz participation")}>Edit</Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Final call to action encouraging quiz participation
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About Page</CardTitle>
                <CardDescription>Manage your about page content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-medium">About Introduction</h3>
                      <Button variant="outline" size="sm" onClick={() => handleEditSection("About Introduction", "Introduction and mission statement")}>Edit</Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Introduction and mission statement
                    </div>
                  </div>

                  <div className="bg-muted rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-medium">Our Approach</h3>
                      <Button variant="outline" size="sm" onClick={() => handleEditSection("Our Approach", "Details about our psychological approach and methodology")}>Edit</Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Details about our psychological approach and methodology
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Page</CardTitle>
                <CardDescription>Manage your contact page content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-medium">Contact Information</h3>
                      <Button variant="outline" size="sm" onClick={() => handleEditSection("Contact Information", "Contact details and form settings")}>Edit</Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Contact details and form settings
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Section Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[725px]">
            <DialogHeader>
              <DialogTitle>{currentSection ? `Edit ${currentSection.name}` : 'Edit Section'}</DialogTitle>
              <DialogDescription>
                Make changes to the section content below. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="section-name">Section Name</Label>
                <Input
                  id="section-name"
                  value={sectionFormData.name}
                  onChange={(e) => setSectionFormData({...sectionFormData, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="section-content">Content</Label>
                <div className="min-h-[200px] border rounded-md p-4">
                  <RichTextEditor
                    value={sectionFormData.content}
                    onChange={(content) => setSectionFormData({...sectionFormData, content})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Additional Settings</Label>
                <div className="bg-muted rounded-md p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="background-color">Background Color</Label>
                      <Select 
                        value={sectionFormData.settings.backgroundColor || "white"}
                        onValueChange={(value) => setSectionFormData({
                          ...sectionFormData, 
                          settings: {...sectionFormData.settings, backgroundColor: value}
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select background color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="white">White</SelectItem>
                          <SelectItem value="light">Light Gray</SelectItem>
                          <SelectItem value="accent">Accent</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="layout">Layout</Label>
                      <Select
                        value={sectionFormData.settings.layout || "standard"}
                        onValueChange={(value) => setSectionFormData({
                          ...sectionFormData, 
                          settings: {...sectionFormData.settings, layout: value}
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select layout" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="wide">Wide</SelectItem>
                          <SelectItem value="centered">Centered</SelectItem>
                          <SelectItem value="split">Split</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSection} disabled={updateSectionMutation.isPending}>
                {updateSectionMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Settings</h2>
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure global application settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div>Sample Settings Content</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;