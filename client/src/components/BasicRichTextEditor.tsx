import { useEffect, useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface BasicRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  readOnly?: boolean;
}

// Function to sanitize HTML content before it's used
const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  // Remove DOCTYPE, XML declarations, and comments that can cause issues
  return html
    .replace(/<!DOCTYPE[^>]*>/i, '')
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
};

const BasicRichTextEditor = ({
  value,
  onChange,
  placeholder = 'Start writing your content...',
  minHeight = '200px',
  readOnly = false
}: BasicRichTextEditorProps) => {
  // Store the editor instance in a ref to avoid re-renders
  const editorRef = useRef<ReactQuill | null>(null);
  
  // Standard toolbar configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      [{ 'align': [] }],
      ['clean']
    ]
  };

  // Wrap the onChange handler to sanitize content
  const handleChange = (content: string) => {
    const sanitizedContent = sanitizeHtml(content);
    onChange(sanitizedContent);
  };
  
  // Ensure initial value is sanitized
  useEffect(() => {
    if (value && !readOnly) {
      const sanitizedValue = sanitizeHtml(value);
      if (sanitizedValue !== value) {
        onChange(sanitizedValue);
      }
    }
  }, []);
  
  return (
    <div style={{ minHeight }}>
      <ReactQuill
        ref={editorRef}
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{ minHeight: 'calc(100% - 42px)' }} // 42px is the height of the toolbar
      />
    </div>
  );
};

export default BasicRichTextEditor;