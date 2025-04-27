import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash, 
  Copy, 
  ExternalLink, 
  Search
} from 'lucide-react';

interface Page {
  id: string;
  title: string;
  slug: string;
  isHomePage: boolean;
  createdAt: string;
  updatedAt: string | null;
}

interface PageManagerProps {
  onEditPage: (pageId: string) => void;
  onNewPage: () => void;
}

const PageManager: React.FC<PageManagerProps> = ({ onEditPage, onNewPage }) => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newPageData, setNewPageData] = useState({ title: '', slug: '' });
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch pages
  const { data: pagesResponse, isLoading } = useQuery({
    queryKey: ['/api/admin/website/pages'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/website/pages');
      return response.data;
    },
  });
  
  const pages: Page[] = pagesResponse || [];
  
  // Create page mutation
  const createPageMutation = useMutation({
    mutationFn: async (data: { title: string, slug: string }) => {
      return apiRequest('POST', '/api/admin/website/pages', data);
    },
    onSuccess: (response) => {
      toast({
        title: 'Page created',
        description: 'The page has been created successfully.',
      });
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/website/pages'] });
      
      // If the response has the new page ID, go to edit mode
      if (response.data && response.data.id) {
        onEditPage(response.data.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating page',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Delete page mutation
  const deletePageMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/website/pages/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Page deleted',
        description: 'The page has been deleted successfully.',
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/website/pages'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting page',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Set as home page mutation
  const setHomePageMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('PATCH', `/api/admin/website/pages/${id}/home`, {});
    },
    onSuccess: () => {
      toast({
        title: 'Home page updated',
        description: 'The home page has been set successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/website/pages'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating home page',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Clone page mutation
  const clonePageMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/admin/website/pages/${id}/clone`, {});
    },
    onSuccess: () => {
      toast({
        title: 'Page cloned',
        description: 'The page has been cloned successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/website/pages'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error cloning page',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Handle page creation
  const handleCreatePage = () => {
    createPageMutation.mutate(newPageData);
  };
  
  // Handle delete confirmation
  const handleConfirmDelete = () => {
    if (selectedPageId) {
      deletePageMutation.mutate(selectedPageId);
    }
  };
  
  // Filter pages based on search query
  const filteredPages = pages.filter(page => 
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pages</h2>
          <p className="text-muted-foreground">Manage your website pages</p>
        </div>
        <Button onClick={() => {
          setNewPageData({ title: '', slug: '' });
          setIsAddDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Page
        </Button>
      </div>
      
      <div className="flex items-center mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 w-32 bg-muted rounded mb-2"></div>
                <div className="h-4 w-48 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted rounded mb-2"></div>
                <div className="h-4 w-2/3 bg-muted rounded"></div>
              </CardContent>
              <CardFooter>
                <div className="h-9 w-20 bg-muted rounded"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredPages.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No Pages Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? `No pages found matching "${searchQuery}"`
                : "Get started by adding your first page."}
            </p>
            {!searchQuery && (
              <Button onClick={onNewPage}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Page
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPages.map((page) => (
            <Card key={page.id} className={page.isHomePage ? "border-primary" : undefined}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {page.title}
                    {page.isHomePage && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground">
                        Home
                      </span>
                    )}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditPage(page.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {!page.isHomePage && (
                        <DropdownMenuItem onClick={() => setHomePageMutation.mutate(page.id)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Set as Home
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => clonePageMutation.mutate(page.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Clone
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setSelectedPageId(page.id);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>/{page.slug}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(page.createdAt).toLocaleDateString()}
                </p>
                {page.updatedAt && (
                  <p className="text-sm text-muted-foreground">
                    Last updated: {new Date(page.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" onClick={() => onEditPage(page.id)}>
                  Edit Page
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add page dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Page</DialogTitle>
            <DialogDescription>
              Create a new page for your website.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="title" className="mb-2 block">Page Title</Label>
              <Input
                id="title"
                placeholder="e.g. About Us"
                value={newPageData.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setNewPageData({
                    ...newPageData,
                    title,
                    // Generate a slug if one doesn't exist yet
                    slug: newPageData.slug === '' ? 
                      title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 
                      newPageData.slug
                  });
                }}
              />
            </div>
            <div>
              <Label htmlFor="slug" className="mb-2 block">URL Slug</Label>
              <div className="flex items-center">
                <span className="text-muted-foreground mr-1">/</span>
                <Input
                  id="slug"
                  placeholder="e.g. about-us"
                  value={newPageData.slug}
                  onChange={(e) => setNewPageData({
                    ...newPageData,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                  })}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This will be the URL path for your page.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreatePage} 
              disabled={createPageMutation.isPending || !newPageData.title || !newPageData.slug}
            >
              {createPageMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : 'Create Page'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this page? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePageMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PageManager;