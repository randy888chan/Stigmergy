import React from 'react';
import { FiFolder, FiFile, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { ScrollArea } from './ui/scroll-area.jsx';
import { Button } from './ui/button.jsx';
import { cn } from '../lib/utils.js';

const CodeBrowser = ({ files, onFileSelect, selectedFile, isLoading, error }) => {

  const handleFileClick = (file) => {
    if (file.type === 'folder') return;
    if (onFileSelect) {
      onFileSelect(file.name);
    }
  };

  return (
    <ScrollArea className="h-full w-full p-2">
      {isLoading && <div className="flex items-center gap-2 p-2 text-muted-foreground"><FiLoader className="animate-spin" /><span>Loading tree...</span></div>}
      {error && <div className="flex items-center gap-2 p-2 text-destructive"><FiAlertCircle /><span>{error}</span></div>}
      {!isLoading && !error && files.map((item) => {
        const isFolder = item.type === 'folder';
        const isSelected = selectedFile === item.name;
        return (
          <Button
            key={item.name}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 px-2",
              isFolder ? "font-semibold" : "font-normal",
              isSelected && "bg-accent"
            )}
            onClick={() => handleFileClick(item)}
            disabled={isFolder}
          >
            {isFolder ? <FiFolder /> : <FiFile />}
            {item.name}
          </Button>
        );
      })}
    </ScrollArea>
  );
};

export default CodeBrowser;