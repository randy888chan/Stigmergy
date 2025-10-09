import React, { useState, useEffect } from 'react';
import { FiFolder, FiFile, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from './ui/resizable.jsx';
import { ScrollArea } from './ui/scroll-area.jsx';
import { Button } from './ui/button.jsx';
import { cn } from '../lib/utils.js';

const CodeBrowser = ({ activeProject }) => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeProject) {
      setFiles([]);
      setSelectedFile(null);
      setFileContent('');
      setError(null);
      return;
    }

    const fetchFiles = async () => {
      setListLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/files');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (Array.isArray(data)) {
          data.sort((a, b) => {
            const aIsFolder = a.name.endsWith('/');
            const bIsFolder = b.name.endsWith('/');
            if (aIsFolder && !bIsFolder) return -1;
            if (!aIsFolder && bIsFolder) return 1;
            return a.name.localeCompare(b.name);
          });
          setFiles(data);
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          setFiles([]);
        }
      } catch (e) {
        setError(`Failed to fetch files: ${e.message}`);
        setFiles([]);
      } finally {
        setListLoading(false);
      }
    };

    fetchFiles();
  }, [activeProject]);

  const handleFileSelect = async (file) => {
    if (file.name.endsWith('/')) return; // It's a folder

    setSelectedFile(file);
    setFileLoading(true);
    setFileContent('');

    try {
      const response = await fetch(`/api/file-content?path=${encodeURIComponent(file.name)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFileContent(data.content);
    } catch (e) {
      setFileContent(`Error loading file: ${e.message}`);
    } finally {
      setFileLoading(false);
    }
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full w-full">
      <ResizablePanel defaultSize={30} minSize={20}>
        <ScrollArea className="h-full p-2">
          {listLoading && <div className="flex items-center gap-2 p-2 text-muted-foreground"><FiLoader className="animate-spin" /><span>Loading tree...</span></div>}
          {error && <div className="flex items-center gap-2 p-2 text-destructive"><FiAlertCircle /><span>{error}</span></div>}
          {!listLoading && !error && files.map((item) => {
            const isFolder = item.name.endsWith('/');
            const isSelected = selectedFile?.name === item.name;
            return (
              <Button
                key={item.name}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 px-2",
                  isFolder ? "font-semibold" : "font-normal",
                  isSelected && "bg-accent"
                )}
                onClick={() => handleFileSelect(item)}
                disabled={isFolder}
              >
                {isFolder ? <FiFolder /> : <FiFile />}
                {item.name}
              </Button>
            );
          })}
        </ScrollArea>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={70} minSize={30}>
        <div className="flex flex-col h-full">
          {selectedFile && (
            <div className="p-2 border-b text-sm text-muted-foreground">
              {selectedFile.name}
            </div>
          )}
          <ScrollArea className="h-full">
            {fileLoading && <div className="flex items-center gap-2 p-4 text-muted-foreground"><FiLoader className="animate-spin" /><span>Loading content...</span></div>}
            {!fileLoading && fileContent && (
              <pre className="text-sm p-4 font-mono">
                <code>{fileContent}</code>
              </pre>
            )}
            {!selectedFile && !fileLoading && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a file to view its content.
              </div>
            )}
          </ScrollArea>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default CodeBrowser;