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
  // Refs
  const autoSaveTimerRef = useRef<any>(null);
  
  // UI States
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'html' | 'preview'>('visual');
  const [htmlSource, setHtmlSource] = useState(value);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showMediaAlert, setShowMediaAlert] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSnippetDialog, setShowSnippetDialog] = useState(false);
  const [snippetContent, setSnippetContent] = useState('');
  
  // Media States
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageWidth, setImageWidth] = useState('');
  const [imageHeight, setImageHeight] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [imageAlignment, setImageAlignment] = useState<'left' | 'center' | 'right'>('center');
  
  // Button and Link States
  const [buttonConfig, setButtonConfig] = useState({ 
    text: '', 
    url: '', 
    style: 'primary',
    newTab: true
  });
  const [showButtonConfig, setShowButtonConfig] = useState(false);
  const [showLinkConfig, setShowLinkConfig] = useState(false);
  const [linkConfig, setLinkConfig] = useState({ 
    text: '', 
    url: '', 
    title: '',
    newTab: true
  });
  
  // Editor State
  const [editorSelection, setEditorSelection] = useState<any>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(enableAutoSave);

  // Wait for component to mount to avoid SSR issues with Quill
  useEffect(() => {
    setMounted(true);
    
    // Cleanup function to ensure proper resource management
    return () => {
      // Clear any pending auto-save timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, []);

  // Track word & character count - order of hooks matters
  useEffect(() => {
    // Strip HTML and count words
    if (value) {
      const textOnly = value.replace(/<[^>]*>/g, '');
      setCharacterCount(textOnly.length);
      setWordCount(textOnly.trim().split(/\s+/).filter(Boolean).length);
    } else {
      setCharacterCount(0);
      setWordCount(0);
    }
  }, [value]);

  // Custom toolbar handlers
  const imageHandler = () => {
    setShowImageUpload(true);
  };

  const buttonHandler = () => {
    setShowButtonConfig(true);
  };

  const linkHandler = () => {
    // Save current selection before showing link dialog
    if (editorInstance) {
      const selection = editorInstance.getEditor().getSelection();
      setEditorSelection(selection);
      setShowLinkConfig(true);
    }
  };

  const insertImage = () => {
    if (imageUrl && editorInstance) {
      const editor = editorInstance.getEditor();
      const range = editor.getSelection(true);
      
      // Create an enhanced image HTML with all parameters
      let style = '';
      if (imageWidth) style += `width: ${imageWidth.includes('%') ? imageWidth : `${imageWidth}px`}; `;
      if (imageHeight) style += `height: ${imageHeight}px; `;
      
      // Handle alignment
      let alignClass = '';
      let wrapperStyle = '';
      if (imageAlignment === 'left') {
        alignClass = 'float-left mr-4 mb-2';
      } else if (imageAlignment === 'right') {
        alignClass = 'float-right ml-4 mb-2';
      } else if (imageAlignment === 'center') {
        wrapperStyle = 'text-align: center; margin: 1rem 0;';
      }
      
      // Build the image HTML
      let imageHTML = '';
      if (wrapperStyle) {
        imageHTML += `<div style="${wrapperStyle}">`;
      }
      
      imageHTML += `<img src="${imageUrl}" alt="${imageAlt || ''}" style="${style}" class="${alignClass}" />`;
      
      // Add caption if provided
      if (imageCaption) {
        imageHTML += `<figcaption class="text-sm text-center text-gray-500 mt-1">${imageCaption}</figcaption>`;
      }
      
      if (wrapperStyle) {
        imageHTML += `</div>`;
      }
      
      // Insert the HTML
      editor.clipboard.dangerouslyPasteHTML(range.index, imageHTML);
      editor.setSelection(range.index + 1);
      
      // Reset state
      setImageUrl('');
      setImageAlt('');
      setImageCaption('');
      setImageWidth('');
      setImageHeight('');
      setImageAlignment('center');
      setShowImageUpload(false);
    } else {
      setShowMediaAlert(true);
      setTimeout(() => setShowMediaAlert(false), 3000);
    }
  };

  const insertButton = () => {
    if (buttonConfig.text && buttonConfig.url && editorInstance) {
      const editor = editorInstance.getEditor();
      const range = editor.getSelection(true);
      
      const buttonHTML = `
        <a href="${buttonConfig.url}" 
           class="inline-block px-4 py-2 rounded-md font-medium text-white ${
             buttonConfig.style === 'primary' 
               ? 'bg-[#f24b7c] hover:bg-[#d22e5d]' 
               : buttonConfig.style === 'secondary' 
                 ? 'bg-gray-600 hover:bg-gray-700' 
                 : 'bg-green-600 hover:bg-green-700'
           }" 
           ${buttonConfig.newTab ? 'target="_blank" rel="noopener noreferrer"' : ''}
        >
          ${buttonConfig.text}
        </a>
      `;
      
      editor.clipboard.dangerouslyPasteHTML(range.index, buttonHTML);
      editor.setSelection(range.index + 1);
      
      setButtonConfig({ text: '', url: '', style: 'primary', newTab: true });
      setShowButtonConfig(false);
    } else {
      setShowMediaAlert(true);
      setTimeout(() => setShowMediaAlert(false), 3000);
    }
  };

  const insertLink = () => {
    if (linkConfig.url && editorInstance && editorSelection) {
      const editor = editorInstance.getEditor();
      editor.setSelection(editorSelection);
      
      // Build the link with the new attributes
      const linkAttributes = { 
        href: linkConfig.url,
        ...(linkConfig.title && { title: linkConfig.title }),
        ...(linkConfig.newTab && { target: '_blank', rel: 'noopener noreferrer' })
      };
      
      if (editorSelection.length > 0) {
        // User has selected text, apply link to selection with attributes
        // Note: need to use custom HTML since Quill only supports href in its link format
        const selectedText = editor.getText(editorSelection.index, editorSelection.length);
        editor.deleteText(editorSelection.index, editorSelection.length);
        
        const attributesStr = Object.entries(linkAttributes)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ');
        
        const linkHTML = `<a ${attributesStr}>${selectedText}</a>`;
        editor.clipboard.dangerouslyPasteHTML(editorSelection.index, linkHTML);
      } else {
        // No text selected, insert new link
        const displayText = linkConfig.text || linkConfig.url;
        editor.insertText(editorSelection.index, displayText);
        
        // Select the inserted text
        editor.setSelection(editorSelection.index, displayText.length);
        
        // Apply the link attributes
        const attributesStr = Object.entries(linkAttributes)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ');
        
        const linkHTML = `<a ${attributesStr}>${displayText}</a>`;
        editor.deleteText(editorSelection.index, displayText.length);
        editor.clipboard.dangerouslyPasteHTML(editorSelection.index, linkHTML);
      }
      
      // Set cursor position after the link
      editor.setSelection(editorSelection.index + (linkConfig.text || linkConfig.url).length);
      
      // Reset state
      setLinkConfig({ text: '', url: '', title: '', newTab: true });
      setShowLinkConfig(false);
    } else {
      setShowMediaAlert(true);
      setTimeout(() => setShowMediaAlert(false), 3000);
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

  if (!mounted) {
    return <div style={{ minHeight, backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '0.375rem', padding: '1rem' }}>
      Loading editor...
    </div>;
  }

  // The word & character count useEffect has been moved earlier in the component to maintain hook order

  // Sync HTML source with editor value
  useEffect(() => {
    if (activeTab === 'visual') {
      setHtmlSource(value);
    }
  }, [value, activeTab]);

  // Handle HTML source change
  const handleHtmlSourceChange = (newHtmlSource: string) => {
    setHtmlSource(newHtmlSource);
    if (activeTab === 'html') {
      onChange(newHtmlSource);
    }
  };

  // Auto-save functionality
  useEffect(() => {
    // Always define the cleanup function to avoid conditional hooks
    const cleanup = () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
    
    if (autoSaveEnabled && onAutoSave && mounted) {
      cleanup(); // Clear previous timer
      
      autoSaveTimerRef.current = setTimeout(() => {
        if (mounted) { // Double-check component is still mounted
          onAutoSave(value);
          setLastSaved(new Date());
        }
      }, 10000); // Auto-save after 10 seconds of inactivity
    }

    return cleanup;
  }, [value, autoSaveEnabled, onAutoSave, mounted]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave();
      setLastSaved(new Date());
    }
  };

  // Handle code snippet insertion
  const insertCodeSnippet = () => {
    if (snippetContent && editorInstance) {
      const editor = editorInstance.getEditor();
      const range = editor.getSelection(true);
      
      const codeHTML = `<pre class="p-4 bg-gray-100 rounded-md overflow-x-auto font-mono text-sm my-4"><code>${snippetContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
      
      editor.clipboard.dangerouslyPasteHTML(range.index, codeHTML);
      editor.setSelection(range.index + 1);
      
      setSnippetContent('');
      setShowSnippetDialog(false);
    }
  };

  // Calculate container classes based on fullscreen state
  const containerClasses = `relative ${
    isFullscreen 
    ? 'fixed inset-0 z-50 bg-white p-4 overflow-auto' 
    : ''
  }`;

  // Create all needed components outside of conditionals to avoid hooks inside conditionals
  const mediaAlert = (
    <Alert variant="destructive" className="absolute top-0 right-0 w-72 z-50 bg-white">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Please complete all required fields.
      </AlertDescription>
    </Alert>
  );
  
  // Pre-create all dialog components to avoid conditional hooks
  const imageUploadDialog = (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Insert Image</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowImageUpload(false)}
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
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the URL of the image you want to insert
            </p>
          </div>
          
          {imageUrl && (
            <div className="border rounded-md p-3 bg-muted/30">
              <div className="text-sm font-medium mb-2">Image Preview</div>
              <div className="flex justify-center bg-checkerboard rounded-md p-2 mb-2">
                <img 
                  src={imageUrl} 
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
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
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
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="image-width">Width</Label>
              <Input
                id="image-width"
                placeholder="e.g. 500 or 100%"
                value={imageWidth}
                onChange={(e) => setImageWidth(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="image-height">Height</Label>
              <Input
                id="image-height"
                placeholder="e.g. 300"
                value={imageHeight}
                onChange={(e) => setImageHeight(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label>Alignment</Label>
            <div className="flex gap-2 mt-2">
              <Button 
                type="button" 
                variant={imageAlignment === 'left' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setImageAlignment('left')}
                className="flex-1"
              >
                <AlignLeft className="h-4 w-4 mr-1" />
                Left
              </Button>
              <Button 
                type="button" 
                variant={imageAlignment === 'center' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setImageAlignment('center')}
                className="flex-1"
              >
                <AlignCenter className="h-4 w-4 mr-1" />
                Center
              </Button>
              <Button 
                type="button" 
                variant={imageAlignment === 'right' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setImageAlignment('right')}
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
              onClick={() => setShowImageUpload(false)}
            >
              Cancel
            </Button>
            <Button onClick={insertImage} disabled={!imageUrl}>Insert Image</Button>
          </div>
        </div>
      </div>
    </div>
  );
  
  const buttonConfigDialog = (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Insert Button</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowButtonConfig(false)}
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
              value={buttonConfig.text}
              onChange={(e) => setButtonConfig({...buttonConfig, text: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="button-url">Button URL</Label>
            <Input
              id="button-url"
              placeholder="https://example.com"
              value={buttonConfig.url}
              onChange={(e) => setButtonConfig({...buttonConfig, url: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="button-style">Button Style</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button 
                type="button"
                className={`${buttonConfig.style === 'primary' ? 'ring-2 ring-offset-2 ring-blue-500' : ''} bg-[#f24b7c] hover:bg-[#d22e5d]`}
                onClick={() => setButtonConfig({...buttonConfig, style: 'primary'})}
              >
                Primary
              </Button>
              <Button 
                type="button"
                variant="secondary"
                className={buttonConfig.style === 'secondary' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                onClick={() => setButtonConfig({...buttonConfig, style: 'secondary'})}
              >
                Secondary
              </Button>
              <Button 
                type="button"
                className={`${buttonConfig.style === 'success' ? 'ring-2 ring-offset-2 ring-blue-500' : ''} bg-green-600 hover:bg-green-700`}
                onClick={() => setButtonConfig({...buttonConfig, style: 'success'})}
              >
                Success
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="button-new-tab"
              checked={buttonConfig.newTab}
              onCheckedChange={(checked) => setButtonConfig({...buttonConfig, newTab: checked})}
            />
            <Label htmlFor="button-new-tab">Open in new tab</Label>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowButtonConfig(false)}
            >
              Cancel
            </Button>
            <Button onClick={insertButton}>Insert Button</Button>
          </div>
        </div>
      </div>
    </div>
  );
  
  const linkConfigDialog = (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Insert Link</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowLinkConfig(false)}
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
              value={linkConfig.text}
              onChange={(e) => setLinkConfig({...linkConfig, text: e.target.value})}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional if text is already selected in the editor
            </p>
          </div>
          
          <div>
            <Label htmlFor="link-url">Link URL</Label>
            <Input
              id="link-url"
              placeholder="https://example.com"
              value={linkConfig.url}
              onChange={(e) => setLinkConfig({...linkConfig, url: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="link-title">Link Title</Label>
            <Input
              id="link-title"
              placeholder="Description for hovering"
              value={linkConfig.title}
              onChange={(e) => setLinkConfig({...linkConfig, title: e.target.value})}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional title attribute for the link
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="link-new-tab"
              checked={linkConfig.newTab}
              onCheckedChange={(checked) => setLinkConfig({...linkConfig, newTab: checked})}
            />
            <Label htmlFor="link-new-tab">Open in new tab</Label>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowLinkConfig(false)}
            >
              Cancel
            </Button>
            <Button onClick={insertLink}>Insert Link</Button>
          </div>
        </div>
      </div>
    </div>
  );
  
  const codeSnippetDialog = (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Insert Code Snippet</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSnippetDialog(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="code-snippet">Code</Label>
            <Textarea
              id="code-snippet"
              placeholder="Enter your code here..."
              value={snippetContent}
              onChange={(e) => setSnippetContent(e.target.value)}
              className="font-mono text-sm h-60"
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste your code snippet here. HTML tags will be automatically escaped.
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowSnippetDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={insertCodeSnippet}>Insert Code</Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={containerClasses}>
      {showMediaAlert && mediaAlert}
      
      <div className="mb-4 border rounded-md overflow-hidden">
        {/* Editor Tabs */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as 'visual' | 'html' | 'preview')}
            className="w-full"
          >
            <div className="flex justify-between items-center">
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
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {autoSaveEnabled && lastSaved && (
                  <span>
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="font-normal">
                    {wordCount} words
                  </Badge>
                  <Badge variant="outline" className="font-normal">
                    {characterCount} chars
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="ml-2 h-7 w-7 p-0"
                    title={isFullscreen ? "Exit fullscreen" : "Fullscreen mode"}
                  >
                    {isFullscreen ? (
                      <Minimize className="h-4 w-4" />
                    ) : (
                      <Maximize className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Tabs>
        </div>
        
        {/* Editor Content */}
        <div className="relative">
          <TabsContent value="visual" className="m-0">
            <ReactQuill
              theme="snow"
              value={value}
              onChange={onChange}
              modules={modules}
              placeholder={placeholder}
              style={{ minHeight }}
              readOnly={readOnly}
              ref={(el) => setEditorInstance(el)}
            />
          </TabsContent>
          
          <TabsContent value="html" className="m-0">
            <Textarea
              value={htmlSource}
              onChange={(e) => handleHtmlSourceChange(e.target.value)}
              className="w-full h-full resize-none font-mono text-sm"
              style={{ minHeight }}
              readOnly={readOnly}
            />
          </TabsContent>
          
          <TabsContent value="preview" className="m-0">
            <ScrollArea style={{ height: minHeight }} className="p-4">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: value }}
              />
            </ScrollArea>
          </TabsContent>
        </div>
        
        {/* Editor Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSnippetDialog(true)}
              className="text-xs"
            >
              <Code className="h-3 w-3 mr-1" />
              Insert Code
            </Button>
            
            {onAutoSave && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoSaveEnabled}
                  onCheckedChange={setAutoSaveEnabled}
                  id="auto-save"
                />
                <Label htmlFor="auto-save" className="text-xs cursor-pointer">
                  Auto-save
                </Label>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {onSave && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSave}
                className="text-xs"
              >
                Save Draft
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Image upload dialog */}
      {showImageUpload && imageUploadDialog}
      {showButtonConfig && buttonConfigDialog}
      {showLinkConfig && linkConfigDialog}
      {showSnippetDialog && codeSnippetDialog}
    </div>
  );
};

export default RichTextEditor;