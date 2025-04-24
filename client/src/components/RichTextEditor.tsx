import { useEffect, useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  AlertTriangle, 
  Info, 
  X, 
  Code, 
  ImageIcon, 
  Link as LinkIcon, 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3, 
  Quote, 
  PanelLeft, 
  FileText, 
  Eye,
  Maximize,
  Minimize 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  readOnly?: boolean;
  showToolbar?: boolean;
  showHTMLTab?: boolean;
  showPreviewTab?: boolean;
  onSave?: () => void;
  onAutoSave?: (content: string) => void;
  enableAutoSave?: boolean;
}

// Define EditorState type for better type safety
interface EditorState {
  // Core state
  mounted: boolean;
  activeTab: 'visual' | 'html' | 'preview';
  htmlSource: string;
  wordCount: number;
  characterCount: number;
  lastSaved: Date | null;
  isFullscreen: boolean;
  autoSaveEnabled: boolean;
  
  // UI dialog states
  showImageUpload: boolean;
  showButtonConfig: boolean;
  showLinkConfig: boolean;
  showSnippetDialog: boolean;
  showMediaAlert: boolean;
  
  // Media states
  imageUrl: string;
  imageAlt: string;
  imageWidth: string;
  imageHeight: string;
  imageCaption: string;
  imageAlignment: 'left' | 'center' | 'right';
  
  // Button config
  buttonConfig: {
    text: string;
    url: string;
    style: string;
    newTab: boolean;
  };
  
  // Link config
  linkConfig: {
    text: string;
    url: string;
    title: string;
    newTab: boolean;
  };
  
  // Code snippet
  snippetContent: string;
  
  // Editor instance and selection
  editorInstance: any;
  editorSelection: any;
}

// Create initial state to maintain consistent hook order
const createInitialState = (value: string, enableAutoSave: boolean): EditorState => ({
  // Core state
  mounted: false,
  activeTab: 'visual',
  htmlSource: value,
  wordCount: 0,
  characterCount: 0,
  lastSaved: null,
  isFullscreen: false,
  autoSaveEnabled: enableAutoSave,
  
  // UI dialog states
  showImageUpload: false,
  showButtonConfig: false,
  showLinkConfig: false,
  showSnippetDialog: false,
  showMediaAlert: false,
  
  // Media states
  imageUrl: '',
  imageAlt: '',
  imageWidth: '',
  imageHeight: '',
  imageCaption: '',
  imageAlignment: 'center',
  
  // Button config
  buttonConfig: {
    text: '',
    url: '',
    style: 'primary',
    newTab: true
  },
  
  // Link config
  linkConfig: {
    text: '',
    url: '',
    title: '',
    newTab: true
  },
  
  // Code snippet
  snippetContent: '',
  
  // Editor instance and selection
  editorInstance: null,
  editorSelection: null
});

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = 'Start writing your content...', 
  minHeight = '400px',
  readOnly = false,
  showToolbar = true,
  showHTMLTab = true,
  showPreviewTab = true,
  onSave,
  onAutoSave,
  enableAutoSave = false
}: RichTextEditorProps) => {
  // Use a single state object to maintain consistent hook ordering
  const [state, setState] = useState<EditorState>(createInitialState(value, enableAutoSave));
  
  // Use a ref for auto-save timer to prevent it from affecting render cycles
  const autoSaveTimerRef = useRef<any>(null);
  
  // Create safe state update helper
  const updateState = (updates: Partial<EditorState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };
  
  // Mount effect - only runs once
  useEffect(() => {
    updateState({ mounted: true });
    
    // Cleanup function
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, []);
  
  // Word and character count effect
  useEffect(() => {
    if (!state.mounted) return;
    
    if (value) {
      const textOnly = value.replace(/<[^>]*>/g, '');
      updateState({
        characterCount: textOnly.length,
        wordCount: textOnly.trim().split(/\s+/).filter(Boolean).length
      });
    } else {
      updateState({
        characterCount: 0,
        wordCount: 0
      });
    }
  }, [value, state.mounted]);
  
  // Sync HTML source with editor
  useEffect(() => {
    if (!state.mounted) return;
    
    if (state.activeTab === 'visual') {
      updateState({ htmlSource: value });
    }
  }, [value, state.activeTab, state.mounted]);
  
  // Auto-save effect
  useEffect(() => {
    // Always define the cleanup function for consistency
    const cleanup = () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
    
    if (state.autoSaveEnabled && onAutoSave && state.mounted) {
      cleanup(); // Clear previous timer
      
      autoSaveTimerRef.current = setTimeout(() => {
        if (state.mounted) { // Double-check component is still mounted
          onAutoSave(value);
          updateState({ lastSaved: new Date() });
        }
      }, 10000); // Auto-save after 10 seconds of inactivity
    }
    
    return cleanup;
  }, [value, state.autoSaveEnabled, onAutoSave, state.mounted]);
  
  // Custom toolbar handlers
  const imageHandler = () => {
    updateState({ showImageUpload: true });
  };
  
  const buttonHandler = () => {
    updateState({ showButtonConfig: true });
  };
  
  const linkHandler = () => {
    if (state.editorInstance) {
      const selection = state.editorInstance.getEditor().getSelection();
      updateState({ 
        editorSelection: selection,
        showLinkConfig: true 
      });
    }
  };
  
  const insertImage = () => {
    if (state.imageUrl && state.editorInstance) {
      const editor = state.editorInstance.getEditor();
      const range = editor.getSelection(true);
      
      // Create an enhanced image HTML with all parameters
      let style = '';
      if (state.imageWidth) style += `width: ${state.imageWidth.includes('%') ? state.imageWidth : `${state.imageWidth}px`}; `;
      if (state.imageHeight) style += `height: ${state.imageHeight}px; `;
      
      // Handle alignment
      let alignClass = '';
      let wrapperStyle = '';
      if (state.imageAlignment === 'left') {
        alignClass = 'float-left mr-4 mb-2';
      } else if (state.imageAlignment === 'right') {
        alignClass = 'float-right ml-4 mb-2';
      } else if (state.imageAlignment === 'center') {
        wrapperStyle = 'text-align: center; margin: 1rem 0;';
      }
      
      // Build the image HTML
      let imageHTML = '';
      if (wrapperStyle) {
        imageHTML += `<div style="${wrapperStyle}">`;
      }
      
      imageHTML += `<img src="${state.imageUrl}" alt="${state.imageAlt || ''}" style="${style}" class="${alignClass}" />`;
      
      // Add caption if provided
      if (state.imageCaption) {
        imageHTML += `<figcaption class="text-sm text-center text-gray-500 mt-1">${state.imageCaption}</figcaption>`;
      }
      
      if (wrapperStyle) {
        imageHTML += `</div>`;
      }
      
      // Insert the HTML
      editor.clipboard.dangerouslyPasteHTML(range.index, imageHTML);
      editor.setSelection(range.index + 1);
      
      // Reset state
      updateState({
        imageUrl: '',
        imageAlt: '',
        imageCaption: '',
        imageWidth: '',
        imageHeight: '',
        imageAlignment: 'center',
        showImageUpload: false
      });
    } else {
      updateState({ showMediaAlert: true });
      setTimeout(() => updateState({ showMediaAlert: false }), 3000);
    }
  };
  
  const insertButton = () => {
    if (state.buttonConfig.text && state.buttonConfig.url && state.editorInstance) {
      const editor = state.editorInstance.getEditor();
      const range = editor.getSelection(true);
      
      const buttonHTML = `
        <a href="${state.buttonConfig.url}" 
           class="inline-block px-4 py-2 rounded-md font-medium text-white ${
             state.buttonConfig.style === 'primary' 
               ? 'bg-[#f24b7c] hover:bg-[#d22e5d]' 
               : state.buttonConfig.style === 'secondary' 
                 ? 'bg-gray-600 hover:bg-gray-700' 
                 : 'bg-green-600 hover:bg-green-700'
           }" 
           ${state.buttonConfig.newTab ? 'target="_blank" rel="noopener noreferrer"' : ''}
        >
          ${state.buttonConfig.text}
        </a>
      `;
      
      editor.clipboard.dangerouslyPasteHTML(range.index, buttonHTML);
      editor.setSelection(range.index + 1);
      
      updateState({
        buttonConfig: { text: '', url: '', style: 'primary', newTab: true },
        showButtonConfig: false
      });
    } else {
      updateState({ showMediaAlert: true });
      setTimeout(() => updateState({ showMediaAlert: false }), 3000);
    }
  };
  
  const insertLink = () => {
    if (state.linkConfig.url && state.editorInstance && state.editorSelection) {
      const editor = state.editorInstance.getEditor();
      editor.setSelection(state.editorSelection);
      
      // Build the link with the new attributes
      const linkAttributes = { 
        href: state.linkConfig.url,
        ...(state.linkConfig.title && { title: state.linkConfig.title }),
        ...(state.linkConfig.newTab && { target: '_blank', rel: 'noopener noreferrer' })
      };
      
      if (state.editorSelection.length > 0) {
        // User has selected text, apply link to selection with attributes
        const selectedText = editor.getText(state.editorSelection.index, state.editorSelection.length);
        editor.deleteText(state.editorSelection.index, state.editorSelection.length);
        
        const attributesStr = Object.entries(linkAttributes)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ');
        
        const linkHTML = `<a ${attributesStr}>${selectedText}</a>`;
        editor.clipboard.dangerouslyPasteHTML(state.editorSelection.index, linkHTML);
      } else {
        // No text selected, insert new link
        const displayText = state.linkConfig.text || state.linkConfig.url;
        editor.insertText(state.editorSelection.index, displayText);
        
        // Select the inserted text
        editor.setSelection(state.editorSelection.index, displayText.length);
        
        // Apply the link attributes
        const attributesStr = Object.entries(linkAttributes)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ');
        
        const linkHTML = `<a ${attributesStr}>${displayText}</a>`;
        editor.deleteText(state.editorSelection.index, displayText.length);
        editor.clipboard.dangerouslyPasteHTML(state.editorSelection.index, linkHTML);
      }
      
      // Set cursor position after the link
      editor.setSelection(state.editorSelection.index + (state.linkConfig.text || state.linkConfig.url).length);
      
      // Reset state
      updateState({
        linkConfig: { text: '', url: '', title: '', newTab: true },
        showLinkConfig: false
      });
    } else {
      updateState({ showMediaAlert: true });
      setTimeout(() => updateState({ showMediaAlert: false }), 3000);
    }
  };
  
  // Toolbar configuration
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        ['link', 'image', 'video'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['clean'],
        ['button'], // custom button
      ],
      handlers: {
        image: imageHandler,
        button: buttonHandler,
        link: linkHandler
      }
    }
  };
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    updateState({ isFullscreen: !state.isFullscreen });
  };
  
  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave();
      updateState({ lastSaved: new Date() });
    }
  };
  
  // Handle HTML source change
  const handleHtmlSourceChange = (newHtmlSource: string) => {
    updateState({ htmlSource: newHtmlSource });
    if (state.activeTab === 'html') {
      onChange(newHtmlSource);
    }
  };
  
  // Handle code snippet insertion
  const insertCodeSnippet = () => {
    if (state.snippetContent && state.editorInstance) {
      const editor = state.editorInstance.getEditor();
      const range = editor.getSelection(true);
      
      const codeHTML = `<pre class="p-4 bg-gray-100 rounded-md overflow-x-auto font-mono text-sm my-4"><code>${state.snippetContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
      
      editor.clipboard.dangerouslyPasteHTML(range.index, codeHTML);
      editor.setSelection(range.index + 1);
      
      updateState({
        snippetContent: '',
        showSnippetDialog: false
      });
    }
  };

  // Show loading if not mounted
  if (!state.mounted) {
    return (
      <div style={{ minHeight, backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '0.375rem', padding: '1rem' }}>
        Loading editor...
      </div>
    );
  }
  
  // Calculate container classes based on fullscreen state
  const containerClasses = `relative ${
    state.isFullscreen 
    ? 'fixed inset-0 z-50 bg-white p-4 overflow-auto' 
    : ''
  }`;
  
  return (
    <div className={containerClasses}>
      {/* Editor header with tabs */}
      <div className="mb-2 flex flex-col space-y-2">
        <Tabs value={state.activeTab} onValueChange={(tab) => updateState({ activeTab: tab as any })}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="visual" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Visual
              </TabsTrigger>
              {showHTMLTab && (
                <TabsTrigger value="html" className="flex items-center gap-1">
                  <Code className="h-4 w-4" />
                  HTML
                </TabsTrigger>
              )}
              {showPreviewTab && (
                <TabsTrigger value="preview" className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              )}
            </TabsList>
            
            <div className="flex gap-1">
              {onAutoSave && (
                <div className="flex items-center mr-2">
                  <Switch
                    checked={state.autoSaveEnabled}
                    onCheckedChange={(checked) => updateState({ autoSaveEnabled: checked })}
                    id="auto-save"
                    className="mr-2"
                  />
                  <Label htmlFor="auto-save" className="text-xs">Auto-save</Label>
                </div>
              )}
              
              {state.lastSaved && (
                <Badge variant="outline" className="px-2 h-7 text-xs">
                  Saved: {state.lastSaved.toLocaleTimeString()}
                </Badge>
              )}
              
              <div className="hidden sm:flex items-center gap-1 px-2 h-7 text-xs border rounded-md">
                <span>{state.wordCount} words</span>
                <Separator orientation="vertical" className="h-3 mx-1" />
                <span>{state.characterCount} chars</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="ml-2 p-0 w-8 h-8"
              >
                {state.isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <TabsContent value="visual" className="p-0 mt-2">
            <div className="border rounded-md">
              <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={showToolbar ? modules : { toolbar: false }}
                formats={[
                  'header',
                  'bold', 'italic', 'underline', 'strike', 'blockquote',
                  'list', 'bullet', 'indent',
                  'link', 'image', 'video',
                  'color', 'background',
                  'align'
                ]}
                placeholder={placeholder}
                readOnly={readOnly}
                ref={(el) => {
                  if (el) {
                    updateState({ editorInstance: el });
                  }
                }}
                style={{
                  height: 'auto',
                  minHeight: minHeight
                }}
              />
            </div>
          </TabsContent>
          
          {showHTMLTab && (
            <TabsContent value="html" className="p-0 mt-2">
              <div className="border rounded-md">
                <Textarea
                  value={state.htmlSource}
                  onChange={(e) => handleHtmlSourceChange(e.target.value)}
                  placeholder="HTML source code"
                  className="font-mono text-sm p-3 min-h-[400px] resize-y"
                />
              </div>
              <div className="flex justify-end mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    onChange(state.htmlSource);
                    updateState({ activeTab: 'visual' });
                  }}
                >
                  Update & Switch to Visual
                </Button>
              </div>
            </TabsContent>
          )}
          
          {showPreviewTab && (
            <TabsContent value="preview" className="p-0 mt-2">
              <div className="border rounded-md p-4 min-h-[400px] prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: value }} />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
      
      {/* Bottom toolbar */}
      <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => updateState({ showSnippetDialog: true })}
            className="text-xs h-7 px-2"
          >
            <Code className="h-3 w-3 mr-1" />
            Insert Code
          </Button>
          
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => {}}
            className="text-xs h-7 px-2"
          >
            <Info className="h-3 w-3 mr-1" />
            Format Help
          </Button>
        </div>
        
        <div className="flex sm:hidden items-center gap-1">
          <span>{state.wordCount} words</span>
          <Separator orientation="vertical" className="h-3 mx-1" />
          <span>{state.characterCount} chars</span>
        </div>
        
        {onSave && (
          <Button
            size="sm"
            onClick={handleSave}
            className="ml-auto h-7"
          >
            Save
          </Button>
        )}
      </div>
      
      {/* Media alert */}
      {state.showMediaAlert && (
        <Alert variant="destructive" className="absolute top-0 right-0 w-72 z-50 bg-white">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Please complete all required fields.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Image upload dialog */}
      {state.showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Insert Image</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => updateState({ showImageUpload: false })}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={state.imageUrl}
                  onChange={(e) => updateState({ imageUrl: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the URL of the image you want to insert
                </p>
              </div>
              
              {state.imageUrl && (
                <div className="border rounded-md p-3 bg-muted/30">
                  <div className="text-sm font-medium mb-2">Image Preview</div>
                  <div className="flex justify-center bg-checkerboard rounded-md p-2 mb-2">
                    <img 
                      src={state.imageUrl} 
                      alt="Preview"
                      className="max-h-40 object-contain"
                      onError={(e) => { 
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzk5OSI+SW1hZ2UgZXJyb3I8L3RleHQ+PC9zdmc+';
                      }}
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="image-alt">Alt Text</Label>
                  <Input
                    id="image-alt"
                    placeholder="Descriptive alt text"
                    value={state.imageAlt}
                    onChange={(e) => updateState({ imageAlt: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For accessibility and SEO
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="image-caption">Caption</Label>
                  <Input
                    id="image-caption"
                    placeholder="Optional caption"
                    value={state.imageCaption}
                    onChange={(e) => updateState({ imageCaption: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="image-width">Width</Label>
                  <Input
                    id="image-width"
                    placeholder="e.g. 500 or 100%"
                    value={state.imageWidth}
                    onChange={(e) => updateState({ imageWidth: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="image-height">Height</Label>
                  <Input
                    id="image-height"
                    placeholder="e.g. 300"
                    value={state.imageHeight}
                    onChange={(e) => updateState({ imageHeight: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label>Alignment</Label>
                <div className="flex gap-2 mt-2">
                  <Button 
                    type="button" 
                    variant={state.imageAlignment === 'left' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => updateState({ imageAlignment: 'left' })}
                    className="flex-1"
                  >
                    <AlignLeft className="h-4 w-4 mr-1" />
                    Left
                  </Button>
                  <Button 
                    type="button" 
                    variant={state.imageAlignment === 'center' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => updateState({ imageAlignment: 'center' })}
                    className="flex-1"
                  >
                    <AlignCenter className="h-4 w-4 mr-1" />
                    Center
                  </Button>
                  <Button 
                    type="button" 
                    variant={state.imageAlignment === 'right' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => updateState({ imageAlignment: 'right' })}
                    className="flex-1"
                  >
                    <AlignRight className="h-4 w-4 mr-1" />
                    Right
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => updateState({ showImageUpload: false })}
                >
                  Cancel
                </Button>
                <Button onClick={insertImage} disabled={!state.imageUrl}>Insert Image</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Button config dialog */}
      {state.showButtonConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Insert Button</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => updateState({ showButtonConfig: false })}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="button-text">Button Text</Label>
                <Input
                  id="button-text"
                  placeholder="Click Here"
                  value={state.buttonConfig.text}
                  onChange={(e) => updateState({ 
                    buttonConfig: {...state.buttonConfig, text: e.target.value}
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="button-url">Button URL</Label>
                <Input
                  id="button-url"
                  placeholder="https://example.com"
                  value={state.buttonConfig.url}
                  onChange={(e) => updateState({ 
                    buttonConfig: {...state.buttonConfig, url: e.target.value}
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="button-style">Button Style</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button 
                    type="button"
                    className={`${state.buttonConfig.style === 'primary' ? 'ring-2 ring-offset-2 ring-blue-500' : ''} bg-[#f24b7c] hover:bg-[#d22e5d]`}
                    onClick={() => updateState({ 
                      buttonConfig: {...state.buttonConfig, style: 'primary'}
                    })}
                  >
                    Primary
                  </Button>
                  <Button 
                    type="button"
                    variant="secondary"
                    className={state.buttonConfig.style === 'secondary' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                    onClick={() => updateState({ 
                      buttonConfig: {...state.buttonConfig, style: 'secondary'}
                    })}
                  >
                    Secondary
                  </Button>
                  <Button 
                    type="button"
                    className={`${state.buttonConfig.style === 'success' ? 'ring-2 ring-offset-2 ring-blue-500' : ''} bg-green-600 hover:bg-green-700`}
                    onClick={() => updateState({ 
                      buttonConfig: {...state.buttonConfig, style: 'success'}
                    })}
                  >
                    Success
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="button-new-tab"
                  checked={state.buttonConfig.newTab}
                  onCheckedChange={(checked) => updateState({ 
                    buttonConfig: {...state.buttonConfig, newTab: checked}
                  })}
                />
                <Label htmlFor="button-new-tab">Open in new tab</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => updateState({ showButtonConfig: false })}
                >
                  Cancel
                </Button>
                <Button onClick={insertButton}>Insert Button</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Link config dialog */}
      {state.showLinkConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Insert Link</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => updateState({ showLinkConfig: false })}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="link-text">Link Text</Label>
                <Input
                  id="link-text"
                  placeholder="Click here"
                  value={state.linkConfig.text}
                  onChange={(e) => updateState({ 
                    linkConfig: {...state.linkConfig, text: e.target.value}
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: If left blank, URL will be used for selected text
                </p>
              </div>
              
              <div>
                <Label htmlFor="link-url">Link URL</Label>
                <Input
                  id="link-url"
                  placeholder="https://example.com"
                  value={state.linkConfig.url}
                  onChange={(e) => updateState({ 
                    linkConfig: {...state.linkConfig, url: e.target.value}
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="link-title">Title (Tooltip)</Label>
                <Input
                  id="link-title"
                  placeholder="Learn more about this topic"
                  value={state.linkConfig.title}
                  onChange={(e) => updateState({ 
                    linkConfig: {...state.linkConfig, title: e.target.value}
                  })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="link-new-tab"
                  checked={state.linkConfig.newTab}
                  onCheckedChange={(checked) => updateState({ 
                    linkConfig: {...state.linkConfig, newTab: checked}
                  })}
                />
                <Label htmlFor="link-new-tab">Open in new tab</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => updateState({ showLinkConfig: false })}
                >
                  Cancel
                </Button>
                <Button onClick={insertLink}>Insert Link</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Code snippet dialog */}
      {state.showSnippetDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Insert Code Snippet</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => updateState({ showSnippetDialog: false })}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="snippet-content">Code</Label>
                <Textarea
                  id="snippet-content"
                  placeholder="Paste your code here..."
                  value={state.snippetContent}
                  onChange={(e) => updateState({ snippetContent: e.target.value })}
                  className="font-mono text-sm min-h-[200px]"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => updateState({ showSnippetDialog: false })}
                >
                  Cancel
                </Button>
                <Button onClick={insertCodeSnippet}>Insert Code</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;