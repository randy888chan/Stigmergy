import React from 'react';
import { ScrollArea } from './ui/scroll-area.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';

const FileViewer = ({ filePath, content, isLoading }) => {
  return (
    <Card className="h-full w-full flex flex-col">
      <CardHeader>
        <CardTitle className="truncate">
          {isLoading ? 'Loading...' : filePath || 'Select a file to view'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full w-full">
          <pre className="text-sm p-4">
            <code>
              {isLoading ? 'Loading file content...' : content || 'No content to display.'}
            </code>
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FileViewer;