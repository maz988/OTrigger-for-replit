import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Info, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = 'Start writing your content...', 
  minHeight = '400px' 
}: RichTextEditorProps) => {
  const [mounted, setMounted] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [buttonConfig, setButtonConfig] = useState({ 
    text: '', 
    url: '', 
    style: 'primary' 
  });
  const [showButtonConfig, setShowButtonConfig] = useState(false);
  const [showLinkConfig, setShowLinkConfig] = useState(false);
  const [linkConfig, setLinkConfig] = useState({ text: '', url: '' });
  const [editorSelection, setEditorSelection] = useState<any>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [showMediaAlert, setShowMediaAlert] = useState(false);

  // Wait for component to mount to avoid SSR issues with Quill
  useEffect(() => {
    setMounted(true);
  }, []);

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
      editor.insertEmbed(range.index, 'image', imageUrl, 'user');
      editor.setSelection(range.index + 1);
      setImageUrl('');
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
           target="_blank" rel="noopener noreferrer"
        >
          ${buttonConfig.text}
        </a>
      `;
      
      editor.clipboard.dangerouslyPasteHTML(range.index, buttonHTML);
      editor.setSelection(range.index + 1);
      
      setButtonConfig({ text: '', url: '', style: 'primary' });
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
      
      if (editorSelection.length > 0) {
        // User has selected text, apply link to selection
        editor.format('link', linkConfig.url);
      } else {
        // No text selected, insert new link
        editor.insertText(editorSelection.index, linkConfig.text || linkConfig.url);
        editor.setSelection(editorSelection.index, (linkConfig.text || linkConfig.url).length);
        editor.format('link', linkConfig.url);
      }
      
      editor.setSelection(editorSelection.index + (linkConfig.text || linkConfig.url).length);
      setLinkConfig({ text: '', url: '' });
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

  return (
    <div className="relative">
      {showMediaAlert && (
        <Alert variant="destructive" className="absolute top-0 right-0 w-72 z-50 bg-white">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Please complete all required fields.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mb-4">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          placeholder={placeholder}
          style={{ minHeight }}
          ref={(el) => setEditorInstance(el)}
        />
        
        <div className="text-xs text-gray-500 mt-1 flex items-center">
          <Info className="h-3 w-3 mr-1" />
          Use the toolbar to format text, add links, images, and more.
        </div>
      </div>
      
      {/* Image upload dialog */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
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
            
            <div className="space-y-4">
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
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowImageUpload(false)}
                >
                  Cancel
                </Button>
                <Button onClick={insertImage}>Insert Image</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Button configuration dialog */}
      {showButtonConfig && (
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
      )}
      
      {/* Link configuration dialog */}
      {showLinkConfig && (
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
      )}
    </div>
  );
};

export default RichTextEditor;