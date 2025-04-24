import { useEffect, useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Code,
  FileText,
  Eye,
  Maximize,
  Minimize 
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  readOnly?: boolean;
}

const SimpleRichTextEditor = ({
  value,
  onChange,
  placeholder = 'Start writing your content...',
  minHeight = '400px',
  readOnly = false
}: RichTextEditorProps) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'html' | 'preview'>('visual');
  const [htmlSource, setHtmlSource] = useState(value);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Use refs instead of state for editor instances to avoid re-renders
  const quillRef = useRef<ReactQuill | null>(null);
  
  // Sync HTML source with editor content
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
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // Standard toolbar configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'image'],
      [{ 'align': [] }],
      ['clean']
    ]
  };
  
  // Calculate container classes based on fullscreen state
  const containerClasses = `relative ${
    isFullscreen 
      ? 'fixed inset-0 z-50 bg-white p-4 overflow-auto' 
      : ''
  }`;
  
  return (
    <div className={containerClasses}>
      {/* Editor header with tabs */}
      <div className="mb-2 flex flex-col space-y-2">
        <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as any)}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="visual" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Visual
              </TabsTrigger>
              <TabsTrigger value="html" className="flex items-center gap-1">
                <Code className="h-4 w-4" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleFullscreen}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <TabsContent value="visual" className="p-0 border-0">
            <div className="border rounded-md">
              <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={[
                  'header',
                  'bold', 'italic', 'underline', 'strike',
                  'list', 'bullet',
                  'link', 'image',
                  'align'
                ]}
                placeholder={placeholder}
                readOnly={readOnly}
                ref={quillRef}
                style={{
                  height: 'auto',
                  minHeight: minHeight
                }}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="html" className="p-0 border-0">
            <div className="border rounded-md p-4">
              <Label htmlFor="html-source" className="sr-only">HTML Source</Label>
              <Input
                id="html-source"
                as="textarea"
                value={htmlSource}
                onChange={(e) => handleHtmlSourceChange(e.target.value)}
                className="font-mono text-sm h-[400px] min-h-[400px]"
                style={{ minHeight }}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="p-0 border-0">
            <div 
              className="border rounded-md p-6 prose dark:prose-invert max-w-none overflow-auto"
              style={{ minHeight }}
              dangerouslySetInnerHTML={{ __html: value }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SimpleRichTextEditor;