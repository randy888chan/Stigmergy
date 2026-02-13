import React, { useMemo, useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react';
import { cn } from "../lib/utils.js";
import { ScrollArea } from "./ui/scroll-area.jsx";

const TreeItem = ({ name, data, depth, onFileSelect, selectedFile, pathPrefix }) => {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const isFolder = typeof data === 'object' && data !== null;
  const fullPath = pathPrefix ? `${pathPrefix}/${name}` : name;
  const isSelected = selectedFile === fullPath;

  if (!isFolder) {
    return (
      <div
        onClick={() => onFileSelect(fullPath)}
        className={cn(
          "flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-white/5 text-sm transition-colors",
          isSelected ? "bg-blue-600/20 text-blue-400" : "text-zinc-400"
        )}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        <File className="w-3 h-3 shrink-0" />
        <span className="truncate">{name}</span>
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-white/5 text-sm text-zinc-300 font-medium",
        )}
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <Folder className="w-3 h-3 text-yellow-500/80" />
        <span className="truncate">{name}</span>
      </div>
      {isOpen && (
        <div>
          {Object.entries(data).map(([childName, childData]) => (
            <TreeItem
              key={childName}
              name={childName}
              data={childData}
              depth={depth + 1}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              pathPrefix={fullPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CodeBrowser = ({ files, onFileSelect, selectedFile, isLoading }) => {
  const fileTree = useMemo(() => {
    const tree = {};
    // SAFETY: Ensure files is an array
    const safeFiles = Array.isArray(files) ? files : [];

    safeFiles.forEach(filePath => {
      // SAFETY: Ensure filePath is a string
      if (typeof filePath !== 'string') return;

      const parts = filePath.split('/');
      let current = tree;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = true;
        } else {
          current[part] = current[part] || {};
          current = current[part];
        }
      });
    });
    return tree;
  }, [files]);

  if (isLoading) return <div className="p-4 text-xs text-zinc-500 animate-pulse">Scanning...</div>;
  if (!files || files.length === 0) return <div className="p-4 text-xs text-zinc-500">No files found.</div>;

  return (
    <ScrollArea className="h-full">
      <div className="py-2">
        {Object.entries(fileTree).map(([name, data]) => (
          <TreeItem
            key={name}
            name={name}
            data={data}
            depth={0}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
            pathPrefix=""
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default CodeBrowser;
