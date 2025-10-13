import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const agents = [
  { name: '@dispatcher', successRate: '95%', tasks: 120, avgTime: '2.5m' },
  { name: '@executor', successRate: '88%', tasks: 115, avgTime: '4.1m' },
  { name: '@debugger', successRate: '60%', tasks: 25, avgTime: '7.8m' },
  { name: '@metis', successRate: '99%', tasks: 10, avgTime: '1.2m' },
];

const AgentPerformanceMonitor = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Success Rate</TableHead>
              <TableHead>Total Tasks</TableHead>
              <TableHead>Avg. Completion Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent.name}>
                <TableCell>{agent.name}</TableCell>
                <TableCell>{agent.successRate}</TableCell>
                <TableCell>{agent.tasks}</TableCell>
                <TableCell>{agent.avgTime}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AgentPerformanceMonitor;