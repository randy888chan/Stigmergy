import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.jsx';
import { Button } from './ui/button.jsx';
import { ScrollArea } from './ui/scroll-area.jsx';

const StateManagement = ({ state }) => {
  if (!state) {
    return (
      <div className="p-4 text-muted-foreground">
        No state data available
      </div>
    );
  }

  const renderValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      return (
        <pre className="text-xs p-2 bg-muted rounded-md overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    return <span className="text-sm">{String(value)}</span>;
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow">
        <Accordion type="multiple" defaultValue={['project']} className="w-full p-2">

          <AccordionItem value="project">
            <AccordionTrigger>Project Information</AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Project Name</TableCell>
                    <TableCell>{state.project_name || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Status</TableCell>
                    <TableCell>{state.project_status || 'N/A'}</TableCell>
                  </TableRow>
                   <TableRow>
                    <TableCell className="font-medium">Goal</TableCell>
                    <TableCell>{state.goal || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Fallback Mode</TableCell>
                    <TableCell>{state.fallback_mode ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                  {state.fallback_mode && (
                    <TableRow>
                      <TableCell className="font-medium">Fallback Reason</TableCell>
                      <TableCell>{state.fallback_reason}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tasks">
            <AccordionTrigger>Tasks ({state.project_manifest?.tasks?.length || 0})</AccordionTrigger>
            <AccordionContent>
              {state.project_manifest?.tasks?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.project_manifest.tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-mono">{task.id}</TableCell>
                        <TableCell>{task.description}</TableCell>
                        <TableCell>{task.status}</TableCell>
                        <TableCell>{task.assigned_agent || 'Unassigned'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="p-4 text-muted-foreground">No tasks available</p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="history">
            <AccordionTrigger>History ({state.history?.length || 0})</AccordionTrigger>
            <AccordionContent>
              {state.history?.length > 0 ? (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Agent</TableHead>
                            <TableHead>Message</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {state.history.slice().reverse().map((entry, index) => (
                            <TableRow key={index}>
                                <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                                <TableCell>{entry.agent_id}</TableCell>
                                <TableCell>{entry.message}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
              ) : (
                <p className="p-4 text-muted-foreground">No history available</p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="performance">
            <AccordionTrigger>Performance Data</AccordionTrigger>
            <AccordionContent>
                {state.performance ? (
                    renderValue(state.performance)
                ) : (
                    <p className="p-4 text-muted-foreground">No performance data available</p>
                )}
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </ScrollArea>
      <div className="p-2 border-t flex items-center gap-2">
        <Button variant="outline" size="sm">Export State</Button>
        <Button variant="outline" size="sm">Save Snapshot</Button>
        <Button variant="destructive" size="sm">Reset State</Button>
      </div>
    </div>
  );
};

export default StateManagement;