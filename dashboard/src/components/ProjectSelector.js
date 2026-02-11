import React, { useState, useEffect, useRef } from 'react';
import { Button } from "./ui/button.jsx";
import { Folder, ArrowUp, Check, Loader2, ChevronDown } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area.jsx";
import { cn } from "../lib/utils.js";

export function ProjectSelector({ onProjectSelect }) {
  const [currentPath, setCurrentPath] = useState("~");
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-zinc-900/50 border-white/10 hover:bg-zinc-800 text-xs h-9 px-3 min-w-[200px] max-w-[300px] justify-between"
      >
        <div className="flex items-center gap-2 truncate">
          <Folder className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="truncate font-mono text-zinc-300">
            {currentPath === "~" ? "Select Project..." : currentPath.split(/[/\\]/).pop() || currentPath}
          </span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-11 left-0 w-[400px] flex flex-col gap-2 bg-zinc-950 border border-white/20 rounded-lg shadow-2xl z-[100] p-3 animate-in fade-in zoom-in-95 duration-100">
          {/* Header / Current Path */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goUp} disabled={loading} className="h-8 w-8 shrink-0">
              <ArrowUp className="w-4 h-4" />
            </Button>
            <div className="text-[10px] font-mono truncate bg-black p-2 rounded flex-grow text-zinc-400 border border-white/5" title={currentPath}>
              {currentPath}
            </div>
          </div>

          {/* Folder List */}
          <div className="border border-white/10 rounded-md bg-zinc-900/50 h-[300px] flex flex-col overflow-hidden">
            {loading ? (
                <div className="flex items-center justify-center h-full text-zinc-500 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </div>
            ) : error ? (
                <div className="p-4 text-red-400 text-xs">{error}</div>
            ) : (
                <ScrollArea className="flex-grow">
                    <div className="p-1">
                        {folders.length === 0 && <div className="p-2 text-zinc-500 text-xs">No folders found.</div>}
                        {folders.map(folder => (
                            <button
                                key={folder}
                                onClick={() => navigateTo(folder)}
                                className="flex items-center gap-2 w-full p-2 hover:bg-white/10 rounded text-left text-sm text-zinc-300 transition-colors group"
                            >
                                <Folder className="w-4 h-4 text-blue-500/70 group-hover:text-blue-400 shrink-0" />
                                <span className="truncate">{folder}</span>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            )}
          </div>

          {/* Select Button */}
          <Button
            onClick={() => {
                onProjectSelect(currentPath);
                setIsOpen(false);
            }}
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white gap-2 font-semibold"
          >
            <Check className="w-4 h-4" />
            Select This Project
          </Button>
        </div>
      )}
    </div>
  );
}

export default ProjectSelector;
