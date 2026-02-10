import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button.jsx";
import { Folder, ArrowUp, Check, Loader2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area.jsx";

export function ProjectSelector({ onProjectSelect }) {
  const [currentPath, setCurrentPath] = useState("~");
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFolders = async (path) => {
    setLoading(true);
    setError(null);
    try {
      // Use encodeURIComponent to handle slashes correctly
      const res = await fetch(`/api/projects?basePath=${encodeURIComponent(path)}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load");

      setCurrentPath(data.currentPath);
      setFolders(data.folders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders(currentPath);
  }, []); // Run once on mount

  const navigateTo = (folderName) => {
    // If it's absolute, use it. Otherwise join.
    const separator = currentPath.includes('\\') ? '\\' : '/';
    const newPath = currentPath.endsWith(separator)
        ? `${currentPath}${folderName}`
        : `${currentPath}${separator}${folderName}`;
    fetchFolders(newPath);
  };

  const goUp = () => {
    const separator = currentPath.includes('\\') ? '\\' : '/';
    const parts = currentPath.split(separator);
    parts.pop(); // Remove last folder
    const parent = parts.join(separator) || separator; // Handle root
    fetchFolders(parent);
  };

  return (
    <div className="w-[300px] flex flex-col gap-2">
      {/* Header / Current Path */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={goUp} disabled={loading}>
          <ArrowUp className="w-4 h-4" />
        </Button>
        <div className="text-xs font-mono truncate bg-zinc-900 p-2 rounded flex-grow text-zinc-400 border border-white/10" title={currentPath}>
          {currentPath}
        </div>
      </div>

      {/* Folder List */}
      <div className="border border-white/10 rounded-md bg-zinc-900/50 h-[300px] flex flex-col">
        {loading ? (
            <div className="flex items-center justify-center h-full text-zinc-500 gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
        ) : error ? (
            <div className="p-4 text-red-400 text-xs">{error}</div>
        ) : (
            <ScrollArea className="flex-grow p-1">
                {folders.length === 0 && <div className="p-2 text-zinc-500 text-xs">No folders found.</div>}
                {folders.map(folder => (
                    <button
                        key={folder}
                        onClick={() => navigateTo(folder)}
                        className="flex items-center gap-2 w-full p-2 hover:bg-white/5 rounded text-left text-sm text-zinc-300 transition-colors"
                    >
                        <Folder className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="truncate">{folder}</span>
                    </button>
                ))}
            </ScrollArea>
        )}
      </div>

      {/* Select Button */}
      <Button
        onClick={() => onProjectSelect(currentPath)}
        className="w-full bg-green-600 hover:bg-green-500 text-white gap-2"
      >
        <Check className="w-4 h-4" />
        Select This Project
      </Button>
    </div>
  );
}

export default ProjectSelector;
