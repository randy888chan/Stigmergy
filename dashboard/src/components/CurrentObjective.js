import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card.jsx';
import { Badge } from './ui/badge.jsx';

const CurrentObjective = ({ objective }) => {
  if (!objective) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Objective</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Waiting for a new mission to begin...</p>
        </CardContent>
      </Card>
    );
  }

  const { agent, task, thought } = objective;

  return (
    <Card className="bg-secondary">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Current Objective</span>
          <Badge>{agent || '@system'}</Badge>
        </CardTitle>
        <CardDescription>The agent swarm is currently focused on the following task:</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm mb-1">Task:</h4>
          <p className="text-sm text-foreground bg-background/50 p-3 rounded-md">{task}</p>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-1">Thought:</h4>
          <p className="text-sm text-muted-foreground italic p-3 rounded-md">{thought}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentObjective;