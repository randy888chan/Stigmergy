import React, { useState } from 'react';
import { FiFolder, FiFile, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { ScrollArea } from './ui/scroll-area.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card.jsx';
import { cn } from '../lib/utils.js';

const CodeBrowser = ({ files, onFileSelect, selectedFile, isLoading: isTreeLoading, error: treeError }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');


  const handleFileClick = (file) => {
    if (file.type === 'folder') return;
    if (onFileSelect) {
      onFileSelect(file.name);
    }
  };

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
    <Card className="h-full flex flex-col">
        <CardHeader>
            <CardTitle>Code Intelligence</CardTitle>
            <div className="flex w-full items-center space-x-2 pt-2">
                <Input
                    type="text"
                    placeholder="Semantic search (e.g., 'user auth logic')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearchLoading}>
                    {isSearchLoading ? <FiLoader className="animate-spin" /> : 'Search'}
                </Button>
                {searchResults.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearSearch}>
                        Clear
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent className="flex-grow p-0">
            <ScrollArea className="h-full w-full p-2">
                {isSearchLoading && <div className="flex items-center gap-2 p-2 text-muted-foreground"><FiLoader className="animate-spin" /><span>Searching...</span></div>}
                {searchError && <div className="flex items-center gap-2 p-2 text-destructive"><FiAlertCircle /><span>{searchError}</span></div>}

                {searchResults.length > 0 ? (
                    searchResults.map((result, index) => (
                        <Button
                            key={index}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-2 px-2 text-left h-auto py-2",
                                selectedFile === result.node.source_file && "bg-accent"
                              )}
                            onClick={() => onFileSelect(result.node.source_file)}
                        >
                            <FiFile />
                            <div className="flex flex-col">
                                <span className="font-semibold">{result.node.name} ({result.node.type})</span>
                                <span className="text-xs text-muted-foreground">{result.node.source_file}</span>
                            </div>
                        </Button>
                    ))
                ) : (
                    <>
                        {isTreeLoading && <div className="flex items-center gap-2 p-2 text-muted-foreground"><FiLoader className="animate-spin" /><span>Loading tree...</span></div>}
                        {treeError && <div className="flex items-center gap-2 p-2 text-destructive"><FiAlertCircle /><span>{treeError}</span></div>}
                        {!isTreeLoading && !treeError && files.map((item) => {
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
                    </>
                )}
            </ScrollArea>
        </CardContent>
    </Card>
  );
};

export default CodeBrowser;