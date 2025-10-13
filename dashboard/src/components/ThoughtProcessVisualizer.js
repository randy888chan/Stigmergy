import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { ScrollArea } from './ui/scroll-area.jsx';

const ThoughtProcessVisualizer = ({ thoughts }) => {
  if (!thoughts || thoughts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Thought Process</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No thoughts to display. Waiting for agent activity...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Thought Process</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 pr-4">
          <div className="space-y-4">
            {thoughts.map((thought, index) => (
              <div key={index} className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-semibold">{thought.agent} says:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{thought.thought}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ThoughtProcessVisualizer;