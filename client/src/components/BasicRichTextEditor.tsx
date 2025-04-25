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
  
  return (
    <div style={{ minHeight }}>
      <ReactQuill
        ref={editorRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{ minHeight: 'calc(100% - 42px)' }} // 42px is the height of the toolbar
      />
    </div>
  );
};

export default BasicRichTextEditor;