import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Eye, 
  Undo, 
  Redo, 
  Copy,
  Trash, 
  ArrowLeft, 
  AlertCircle
} from 'lucide-react';

import ElementControls, { ElementTemplate } from './ElementControls';
import ElementRenderer, { PageElement } from './ElementRenderer';
import PropertyEditor from './PropertyEditor';

interface WebsiteBuilderProps {
  pageId?: string;
  onBack?: () => void;
}

const WebsiteBuilder: React.FC<WebsiteBuilderProps> = ({ pageId, onBack }) => {
  const { toast } = useToast();
  
  // Initialize with a blank page structure if no pageId is provided
  const [pageElements, setPageElements] = useState<PageElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [history, setHistory] = useState<PageElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [pageTitle, setPageTitle] = useState('Untitled Page');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Handle loading page data if pageId is provided
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['/api/admin/website/pages', pageId],
    queryFn: async () => {
      if (!pageId) return null;
      const response = await apiRequest('GET', `/api/admin/website/pages/${pageId}`);
      return response.data;
    },
    enabled: !!pageId,
  });
  
  // Save page mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { title: string, elements: PageElement[] }) => {
      if (pageId) {
        // Update existing page
        return apiRequest('PATCH', `/api/admin/website/pages/${pageId}`, data);
      } else {
        // Create new page
        return apiRequest('POST', '/api/admin/website/pages', data);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Page saved successfully',
        description: pageId ? 'Your changes have been updated.' : 'New page has been created.',
      });
      setIsSaveDialogOpen(false);
      setIsDirty(false);
      
      // Refresh pages list if it exists in query cache
      queryClient.invalidateQueries({ queryKey: ['/api/admin/website/pages'] });
      
      // If it was a new page, navigate to the edit page
      if (!pageId && onBack) {
        onBack(); // Go back to pages list
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error saving page',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Initialize page data when loaded
  useEffect(() => {
    if (pageData) {
      setPageTitle(pageData.title || 'Untitled Page');
      if (pageData.elements && pageData.elements.length > 0) {
        setPageElements(pageData.elements);
        // Initialize history with the loaded elements
        setHistory([pageData.elements]);
        setHistoryIndex(0);
      }
    }
  }, [pageData]);
  
  // Selected element
  const selectedElement = pageElements.find(el => findElementById(el, selectedElementId)) || null;
  
  // Find element by ID deeply nested
  const findElementById = (element: PageElement, id: string | null): PageElement | null => {
    if (!id) return null;
    if (element.id === id) return element;
    if (element.children) {
      for (const child of element.children) {
        const found = findElementById(child, id);
        if (found) return found;
      }
    }
    return null;
  };
  
  // Update history whenever page elements change
  useEffect(() => {
    if (history.length === 0 || JSON.stringify(history[historyIndex]) !== JSON.stringify(pageElements)) {
      setIsDirty(true);
      // Remove any future history if we're not at the end
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, pageElements]);
      setHistoryIndex(newHistory.length);
    }
  }, [pageElements]);
  
  // Handle undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPageElements(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };
  
  // Handle redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPageElements(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };
  
  // Add a new element
  const handleAddElement = (template: ElementTemplate) => {
    const newElement: PageElement = {
      id: uuidv4(),
      type: template.type,
      props: { ...template.defaultProps },
      children: template.type === 'section' || template.type === 'container' || template.type === 'row' ? [] : undefined,
    };
    
    if (selectedElementId) {
      // Find the selected element and determine where to add the new element
      const addElementToParent = (elements: PageElement[]): PageElement[] => {
        return elements.map(element => {
          if (element.id === selectedElementId) {
            // If the selected element can have children and the new element should be a child
            if (element.children && (element.type === 'section' || element.type === 'container' || element.type === 'row' || element.type === 'column')) {
              return {
                ...element,
                children: [...element.children, newElement],
              };
            } 
            // Otherwise add it after the selected element at the same level
            return element;
          } else if (element.children) {
            // Recursively check children
            const childResult = addElementToParent(element.children);
            if (childResult !== element.children) {
              return { ...element, children: childResult };
            }
          }
          return element;
        });
      };
      
      const result = addElementToParent(pageElements);
      
      // If the element wasn't added (because it should be added after the selected element)
      if (JSON.stringify(result) === JSON.stringify(pageElements)) {
        // Add after the selected element at the top level
        const newElements = [...pageElements];
        const index = newElements.findIndex(el => el.id === selectedElementId);
        if (index !== -1) {
          newElements.splice(index + 1, 0, newElement);
          setPageElements(newElements);
        } else {
          // Add at the end if element not found at top level
          setPageElements([...pageElements, newElement]);
        }
      } else {
        setPageElements(result);
      }
    } else {
      // Add at the end if no element is selected
      setPageElements([...pageElements, newElement]);
    }
    
    // Select the newly added element
    setSelectedElementId(newElement.id);
  };
  
  // Move an element (up or down)
  const handleMoveElement = (direction: 'up' | 'down') => {
    if (!selectedElementId) return;
    
    const moveElementInArray = (elements: PageElement[]): [PageElement[], boolean] => {
      const index = elements.findIndex(el => el.id === selectedElementId);
      if (index !== -1) {
        const newElements = [...elements];
        const newIndex = direction === 'up' ? Math.max(0, index - 1) : Math.min(elements.length - 1, index + 1);
        
        if (newIndex !== index) {
          // Swap elements
          [newElements[index], newElements[newIndex]] = [newElements[newIndex], newElements[index]];
          return [newElements, true];
        }
        return [elements, false];
      }
      
      // If not found at this level, check children
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].children) {
          const [newChildren, moved] = moveElementInArray(elements[i].children!);
          if (moved) {
            const newElements = [...elements];
            newElements[i] = { ...elements[i], children: newChildren };
            return [newElements, true];
          }
        }
      }
      
      return [elements, false];
    };
    
    const [newElements, moved] = moveElementInArray(pageElements);
    if (moved) {
      setPageElements(newElements);
    }
  };
  
  // Delete an element
  const handleDeleteElement = () => {
    if (!selectedElementId) return;
    
    const removeElementById = (elements: PageElement[]): PageElement[] => {
      return elements.filter(element => {
        if (element.id === selectedElementId) return false;
        if (element.children) {
          element.children = removeElementById(element.children);
        }
        return true;
      });
    };
    
    const newElements = removeElementById(pageElements);
    setPageElements(newElements);
    setSelectedElementId(null);
  };
  
  // Select an element
  const handleSelectElement = (id: string) => {
    setSelectedElementId(id === selectedElementId ? null : id);
  };
  
  // Update element properties
  const handleUpdateElementProps = (id: string, newProps: Record<string, any>) => {
    const updateElementProps = (elements: PageElement[]): PageElement[] => {
      return elements.map(element => {
        if (element.id === id) {
          return { ...element, props: newProps };
        } else if (element.children) {
          return { ...element, children: updateElementProps(element.children) };
        }
        return element;
      });
    };
    
    setPageElements(updateElementProps(pageElements));
  };
  
  // Handle element drop for drag and drop reordering
  const handleDropElement = (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    if (draggedId === targetId) return;
    
    // First, find and remove the dragged element
    let draggedElement: PageElement | null = null;
    
    const removeElementById = (elements: PageElement[]): PageElement[] => {
      return elements.filter(element => {
        if (element.id === draggedId) {
          draggedElement = { ...element };
          return false;
        }
        if (element.children) {
          element.children = removeElementById(element.children);
        }
        return true;
      });
    };
    
    const elementsWithoutDragged = removeElementById([...pageElements]);
    
    if (!draggedElement) {
      toast({
        title: "Error moving element",
        description: "Could not find the element being moved.",
        variant: "destructive"
      });
      return;
    }
    
    // Then, add it to the right place
    const insertElement = (elements: PageElement[]): [PageElement[], boolean] => {
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].id === targetId) {
          const newElements = [...elements];
          
          if (position === 'inside' && elements[i].children) {
            newElements[i] = {
              ...elements[i],
              children: [...(elements[i].children || []), draggedElement!]
            };
            return [newElements, true];
          } else if (position === 'before') {
            newElements.splice(i, 0, draggedElement!);
            return [newElements, true];
          } else if (position === 'after') {
            newElements.splice(i + 1, 0, draggedElement!);
            return [newElements, true];
          }
        }
        
        if (elements[i].children) {
          const [newChildren, inserted] = insertElement(elements[i].children!);
          if (inserted) {
            const newElements = [...elements];
            newElements[i] = { ...elements[i], children: newChildren };
            return [newElements, true];
          }
        }
      }
      
      return [elements, false];
    };
    
    const [newElements, inserted] = insertElement(elementsWithoutDragged);
    
    if (inserted) {
      setPageElements(newElements);
    } else {
      // If not inserted, add back to the end
      setPageElements([...elementsWithoutDragged, draggedElement]);
    }
  };
  
  // Handle save
  const handleSave = () => {
    setIsSaveDialogOpen(true);
  };
  
  // Handle final save action
  const handleSaveConfirm = () => {
    saveMutation.mutate({
      title: pageTitle,
      elements: pageElements
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Determine if an element can be moved up or down
  const canMoveUp = () => {
    if (!selectedElementId) return false;
    
    const findElementPosition = (elements: PageElement[]): [number, PageElement[]] | null => {
      const index = elements.findIndex(el => el.id === selectedElementId);
      if (index !== -1) {
        return [index, elements];
      }
      
      for (const element of elements) {
        if (element.children) {
          const result = findElementPosition(element.children);
          if (result) return result;
        }
      }
      
      return null;
    };
    
    const position = findElementPosition(pageElements);
    return position ? position[0] > 0 : false;
  };
  
  const canMoveDown = () => {
    if (!selectedElementId) return false;
    
    const findElementPosition = (elements: PageElement[]): [number, PageElement[]] | null => {
      const index = elements.findIndex(el => el.id === selectedElementId);
      if (index !== -1) {
        return [index, elements];
      }
      
      for (const element of elements) {
        if (element.children) {
          const result = findElementPosition(element.children);
          if (result) return result;
        }
      }
      
      return null;
    };
    
    const position = findElementPosition(pageElements);
    return position ? position[0] < position[1].length - 1 : false;
  };
  
  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Toolbar */}
      <div className="border-b bg-background p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <span className="font-medium text-lg">{pageTitle}</span>
          {isDirty && <span className="text-xs text-muted-foreground">(unsaved)</span>}
        </div>
        
        <div className="flex items-center space-x-2">
          <Tabs value={isPreviewMode ? "preview" : "edit"} onValueChange={(v) => setIsPreviewMode(v === "preview")}>
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleSave}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex">
        {!isPreviewMode && (
          <ResizablePanelGroup direction="horizontal">
            {/* Left panel - Element Controls */}
            <ResizablePanel defaultSize={20} minSize={15}>
              <ElementControls 
                onAddElement={handleAddElement}
                onMoveElement={handleMoveElement}
                onDeleteElement={handleDeleteElement}
                canMoveUp={canMoveUp()}
                canMoveDown={canMoveDown()}
                isElementSelected={!!selectedElementId}
              />
            </ResizablePanel>
            
            {/* Center panel - Preview */}
            <ResizablePanel defaultSize={60}>
              <div className="h-full flex flex-col">
                <div className="border-b p-2 bg-background flex items-center justify-between">
                  <span className="text-sm font-medium">Page Content</span>
                  {pageElements.length === 0 && (
                    <div className="flex items-center text-yellow-600 text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Page is empty. Add some elements.
                    </div>
                  )}
                </div>
                <div className="flex-1 bg-gray-100 overflow-auto p-4">
                  <div className="bg-white min-h-[1000px] shadow-sm mx-auto">
                    {pageElements.length > 0 ? (
                      pageElements.map(element => (
                        <ElementRenderer 
                          key={element.id}
                          element={element}
                          isEditMode={true}
                          isSelected={selectedElementId === element.id}
                          onSelect={handleSelectElement}
                          onDropElement={handleDropElement}
                        />
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-20 text-center text-gray-400">
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 max-w-md">
                          <h3 className="text-lg mb-2">Your page is empty</h3>
                          <p className="mb-4">Start by adding some elements from the left panel</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ResizablePanel>
            
            {/* Right panel - Property Editor */}
            <ResizablePanel defaultSize={20} minSize={15}>
              <PropertyEditor 
                selectedElement={selectedElement ? findElementById(selectedElement, selectedElementId) : null}
                onUpdateElementProps={handleUpdateElementProps}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
        
        {/* Preview mode */}
        {isPreviewMode && (
          <div className="w-full h-full bg-gray-100 overflow-auto p-4">
            <div className="bg-white min-h-[1000px] shadow-sm mx-auto">
              {pageElements.length > 0 ? (
                pageElements.map(element => (
                  <ElementRenderer 
                    key={element.id}
                    element={element}
                    isEditMode={false}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center text-gray-400">
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 max-w-md">
                    <h3 className="text-lg mb-2">Your page is empty</h3>
                    <p>This page has no content to preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Save dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Page</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <Label htmlFor="page-title" className="mb-2 block">Page Title</Label>
              <Input 
                id="page-title"
                value={pageTitle} 
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="Enter page title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveConfirm} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : 'Save Page'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebsiteBuilder;