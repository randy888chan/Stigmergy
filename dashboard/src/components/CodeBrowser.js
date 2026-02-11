import React, { useState } from 'react';
import { FiFile, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { ScrollArea } from './ui/scroll-area.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card.jsx';
import { cn } from '../lib/utils.js';
import FileTree from './FileTree.js';

const CodeBrowser = ({ files, onFileSelect, selectedFile, isLoading: isTreeLoading, error: treeError }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');


  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchLoading(true);
    setSearchError('');
    setSearchResults([]);
    try {
        const response = await fetch(`/api/coderag/search?query=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Search failed');
        }
        const data = await response.json();
        setSearchResults(data);
    } catch (err) {
        setSearchError(err.message);
    } finally {
        setIsSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError('');
  }

  return (
    <Card className="h-full flex flex-col border-none bg-transparent rounded-none">
        <CardHeader className="px-4 py-3 shrink-0 space-y-2 border-b border-white/5">
            <CardTitle className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Explorer</CardTitle>
            <div className="flex w-full items-center space-x-2">
                <Input
                    type="text"
                    placeholder="Search files..."
                    className="h-7 bg-zinc-900/50 border-white/5 text-[11px] focus-visible:ring-1 focus-visible:ring-blue-500/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                {searchResults.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={clearSearch}>
                        Clear
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-0">
            <ScrollArea className="h-full">
                {isSearchLoading && <div className="flex items-center gap-2 p-4 text-muted-foreground"><FiLoader className="animate-spin" /><span>Searching...</span></div>}
                {searchError && <div className="flex items-center gap-2 p-4 text-destructive"><FiAlertCircle /><span>{searchError}</span></div>}

                {searchResults.length > 0 ? (
                    <div className="p-2 space-y-1">
                         {searchResults.map((result, index) => (
                            <Button
                                key={index}
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start gap-2 px-2 text-left h-auto py-2 hover:bg-zinc-800",
                                    selectedFile === result.node.source_file && "bg-zinc-800 text-blue-400"
                                )}
                                onClick={() => onFileSelect(result.node.source_file)}
                            >
                                <FiFile size={14} />
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-semibold text-xs truncate">{result.node.name}</span>
                                    <span className="text-[10px] text-zinc-500 truncate">{result.node.source_file}</span>
                                </div>
                            </Button>
                        ))}
                    </div>
                ) : (
                    <>
                        {isTreeLoading && <div className="flex items-center gap-2 p-4 text-muted-foreground"><FiLoader className="animate-spin" /><span>Loading tree...</span></div>}
                        {treeError && <div className="flex items-center gap-2 p-4 text-destructive"><FiAlertCircle /><span>{treeError}</span></div>}
                        {!isTreeLoading && !treeError && files && (
                            <FileTree files={files} onFileSelect={onFileSelect} />
                        )}
                    </>
                )}
            </ScrollArea>
        </CardContent>
    </Card>
  );
};

export default CodeBrowser;
