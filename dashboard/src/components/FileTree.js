import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react';
import { cn } from '../lib/utils';

const FileTreeItem = ({ item, onFileSelect, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = item.type === 'folder';

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onFileSelect(item.path);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center py-1 px-2 hover:bg-zinc-800 cursor-pointer text-sm transition-colors group",
          !isFolder && "text-zinc-400 hover:text-white"
        )}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
        onClick={handleClick}
      >
        <span className="mr-1 text-zinc-500 group-hover:text-zinc-300">
          {isFolder ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="w-3.5" />
          )}
        </span>
        <span className="mr-2 text-blue-400/70 group-hover:text-blue-400">
          {isFolder ? <Folder size={14} className="fill-current opacity-50" /> : <File size={14} />}
        </span>
        <span className="truncate">{item.name}</span>
      </div>
      {isFolder && isOpen && (
        <div>
          {Object.values(item.children)
            .sort((a, b) => {
              if (a.type === b.type) return a.name.localeCompare(b.name);
              return a.type === 'folder' ? -1 : 1;
            })
            .map((child) => (
              <FileTreeItem
                key={child.path}
                item={child}
                onFileSelect={onFileSelect}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
};

const FileTree = ({ files, onFileSelect }) => {
  if (!files || !Array.isArray(files)) return null;

  const buildTree = (paths) => {
    const root = {};
    paths.forEach((path) => {
      const parts = path.split('/');
      let current = root;
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            type: index === parts.length - 1 ? 'file' : 'folder',
            children: {},
          };
        }
        current = current[part].children;
      });
    });
    return root;
  };

  const tree = buildTree(files);

  return (
    <div className="py-2 select-none">
      {Object.values(tree)
        .sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'folder' ? -1 : 1;
        })
        .map((item) => (
          <FileTreeItem key={item.path} item={item} onFileSelect={onFileSelect} />
        ))}
    </div>
  );
};

export default FileTree;
