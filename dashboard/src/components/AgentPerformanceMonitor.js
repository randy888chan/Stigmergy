import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const AgentPerformanceMonitor = ({ healthData }) => {
  const agents = healthData?.metrics?.performance?.metrics?.agents || [];

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
            {agents.length > 0 ? (
              agents.map((agent) => (
                <TableRow key={agent.name}>
                  <TableCell>{agent.name}</TableCell>
                  <TableCell>{agent.successRate}</TableCell>
                  <TableCell>{agent.tasks}</TableCell>
                  <TableCell>{agent.avgTime}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="4" className="text-center">
                  No agent performance data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AgentPerformanceMonitor;