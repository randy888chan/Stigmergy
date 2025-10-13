import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const tools = [
  { name: 'file_system.readFile', frequency: 250, successRate: '99%' },
  { name: 'file_system.writeFile', frequency: 150, successRate: '97%' },
  { name: 'shell.execute', frequency: 80, successRate: '92%' },
  { name: 'qwen_integration.reviewCode', frequency: 45, successRate: '85%' },
  { name: 'guardian.propose_change', frequency: 10, successRate: '100%' },
];

const ToolHealthMonitor = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tool Health</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Success Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tools.map((tool) => (
              <TableRow key={tool.name}>
                <TableCell>{tool.name}</TableCell>
                <TableCell>{tool.frequency}</TableCell>
                <TableCell>{tool.successRate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ToolHealthMonitor;