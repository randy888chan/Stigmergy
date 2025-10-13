import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const ToolHealthMonitor = ({ healthData }) => {
  const tools = healthData?.metrics?.performance?.metrics?.tools || [];

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
            {tools.length > 0 ? (
              tools.map((tool) => (
                <TableRow key={tool.name}>
                  <TableCell>{tool.name}</TableCell>
                  <TableCell>{tool.frequency}</TableCell>
                  <TableCell>{tool.successRate}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="3" className="text-center">
                  No tool health data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ToolHealthMonitor;