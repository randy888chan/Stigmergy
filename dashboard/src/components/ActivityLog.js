import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { ScrollArea } from './ui/scroll-area.jsx';
import { Badge } from './ui/badge.jsx';

const ActivityLog = ({ agentActivity }) => {
  const formatContent = (item) => {
    switch (item.type) {
      case 'agent_start':
        return `Prompt: ${(item.prompt || '').substring(0, 200)}...`;
      case 'tool_start':
        return `Args: ${JSON.stringify(item.args)}`;
      case 'tool_end':
        if (item.error) {
          return `Error: ${item.error}`;
        }
        return `Result: ${JSON.stringify(item.result)}`;
      default:
        return JSON.stringify(item);
    }
  };

  const getBadgeVariant = (type) => {
    if (type.includes('start')) return 'default';
    if (type.includes('end') && !type.includes('error')) return 'secondary';
    if (type.includes('error')) return 'destructive';
    return 'outline';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Agent</TableHead>
                <TableHead className="w-[150px]">Event</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentActivity.length > 0 ? (
                agentActivity.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">@{item.agent}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(item.type)}>
                        {item.tool ? `${item.type} (${item.tool})` : item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatContent(item)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan="3" className="h-24 text-center">
                    No agent activity yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityLog;