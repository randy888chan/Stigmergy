import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { ScrollArea } from "./ui/scroll-area.jsx";
import { Folder, FolderUp, Check } from "lucide-react";
import path from 'path-browserify';
import authenticatedFetch from '../lib/api'; // Import the wrapper

export const ProjectSelector = ({ onProjectSelect }) => {
  const [basePath, setBasePath] = useState('~');
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchFolders = useCallback(async (dir) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await authenticatedFetch(`/api/projects?basePath=${encodeURIComponent(dir)}`);
      if (data.error) {
          setError(data.error);
          setFolders([]);
      } else {
          setFolders(data);
      }
    } catch (err) {
      setError(err.message);
      setFolders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
      fetchFolders(basePath);
  }, []); // Initial fetch

  const navigateTo = (newPath) => {
      setBasePath(newPath);
      fetchFolders(newPath);
  };

  const goUp = () => {
      const parent = path.dirname(basePath);
      if (parent !== basePath) {
          navigateTo(parent);
      }
  };

  const selectCurrent = () => {
      if (onProjectSelect) {
          onProjectSelect(basePath);
      }
  };

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-lg bg-zinc-900/50 border-white/10">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Path..."
          value={basePath}
          onChange={(e) => setBasePath(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchFolders(basePath)}
          className="flex-grow font-mono text-xs bg-black/40"
        />
        <Button size="sm" onClick={() => fetchFolders(basePath)} disabled={isLoading} variant="secondary">
          Go
        </Button>
      </div>

      <ScrollArea className="h-[200px] rounded-md border border-white/5 bg-black/20 p-2">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 h-8 text-zinc-400 hover:text-white"
            onClick={goUp}
          >
            <FolderUp className="w-4 h-4" />
            ..
          </Button>

          {folders.map((folder) => (
            <Button
              key={folder}
              variant="ghost"
              size="sm"
              className="justify-start gap-2 h-8 text-zinc-300 hover:text-white"
              onClick={() => navigateTo(path.join(basePath, folder))}
            >
              <Folder className="w-4 h-4 text-blue-400" />
              {folder}
            </Button>
          ))}

          {folders.length === 0 && !isLoading && !error && (
            <div className="p-4 text-center text-xs text-zinc-500 italic">
              No subdirectories found
            </div>
          )}
        </div>
      </ScrollArea>

      {error && <p className="text-[10px] text-red-500 break-all">{error}</p>}

      <Button
        className="w-full gap-2 bg-green-600 hover:bg-green-500 text-white"
        onClick={selectCurrent}
        disabled={isLoading}
      >
        <Check className="w-4 h-4" />
        Select This Folder
      </Button>
    </div>
  );
};

export default ProjectSelector;
