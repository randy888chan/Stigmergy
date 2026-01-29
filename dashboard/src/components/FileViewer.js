import React, { useState, useEffect } from 'react';
import Editor from "@monaco-editor/react";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Button } from './ui/button.jsx';
import { Save } from 'lucide-react';

const FileViewer = ({ filePath, content: initialContent, isLoading }) => {
  const [content, setContent] = useState(initialContent || "");
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when a new file is loaded
  useEffect(() => {
    setContent(initialContent || "");
  }, [initialContent]);

  const handleSave = async () => {
    if (!filePath) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/file-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content })
      });
      if (!response.ok) throw new Error('Save failed');
      alert('File saved successfully!');
    } catch (e) {
      alert('Error saving file: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Simple extension mapper
  const getLanguage = (path) => {
     if (!path) return "plaintext";
     if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
     if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
     if (path.endsWith(".json")) return "json";
     if (path.endsWith(".html")) return "html";
     if (path.endsWith(".css")) return "css";
     if (path.endsWith(".md")) return "markdown";
     return "plaintext";
  };

  return (
    <Card className="h-full w-full flex flex-col border-white/10 bg-black/40 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between py-3 border-b border-white/10">
        <CardTitle className="text-sm font-mono text-zinc-300 truncate">
          {isLoading ? 'Loading...' : filePath || 'No file selected'}
        </CardTitle>
        {filePath && (
            <Button size="sm" onClick={handleSave} disabled={isSaving || isLoading} className="gap-2 bg-blue-600 hover:bg-blue-500">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
            </Button>
        )}
      </CardHeader>
      <CardContent className="flex-grow p-0 overflow-hidden">
         {isLoading ? (
             <div className="flex items-center justify-center h-full text-zinc-500">Loading editor...</div>
         ) : (
            <Editor
              height="100%"
              language={getLanguage(filePath)}
              value={content}
              theme="vs-dark"
              onChange={(value) => setContent(value)}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
         )}
      </CardContent>
    </Card>
  );
};

export default FileViewer;
