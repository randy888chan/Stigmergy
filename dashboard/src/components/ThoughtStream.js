import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { ScrollArea } from './ui/scroll-area.jsx';

const ThoughtStream = ({ thoughts }) => {
  return (
    <Card className="h-full w-full flex flex-col">
      <CardHeader>
        <CardTitle>Live Thought Stream</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full w-full pr-4">
          <div className="space-y-3">
            {thoughts.length > 0 ? thoughts.map((thought, index) => (
              <div key={index} className="text-sm text-muted-foreground">
                <span className="font-mono text-xs mr-2">{new Date(thought.timestamp).toLocaleTimeString()}</span>
                <span>{thought.thought}</span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">Waiting for agent thoughts...</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ThoughtStream;