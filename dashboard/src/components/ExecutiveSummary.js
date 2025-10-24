import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import useWebSocket from '../hooks/useWebSocket';

// Helper to format milliseconds into a readable string
const formatDuration = (ms) => {
  if (ms < 1000) return `${ms} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(2)} s`;
  const minutes = seconds / 60;
  return `${minutes.toFixed(2)} min`;
};

export default function ExecutiveSummary() {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    async function fetchSummary() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/executive-summary');
        if (!response.ok) {
          throw new Error(`Failed to fetch executive summary: ${response.statusText}`);
        }
        const data = await response.json();
        setSummary(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSummary();
    const interval = setInterval(fetchSummary, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data);
      if (message.type === 'cost_update' && summary) {
        setSummary(prevSummary => ({
          ...prevSummary,
          totalEstimatedCost: message.payload.total
        }));
      }
    }
  }, [lastMessage, summary]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading high-level metrics...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const kpis = [
    { label: 'Overall Success Rate', value: `${summary.overallSuccessRate}%` },
    { label: 'Avg. Task Completion Time', value: formatDuration(summary.averageTaskCompletionTime) },
    { label: 'Total Estimated Cost', value: `$${summary.totalEstimatedCost.toFixed(4)}` },
    { label: 'Total Tasks Processed', value: summary.totalTasks },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Executive Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {/* KPI Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Agent Reliability Table */}
        <h3 className="text-lg font-semibold mb-2">Agent Reliability Rankings</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent ID</TableHead>
              <TableHead className="text-right">Reliability</TableHead>
              <TableHead className="text-right">Tasks Handled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.agentReliabilityRankings && summary.agentReliabilityRankings.length > 0 ? (
              summary.agentReliabilityRankings.map((agent) => (
                <TableRow key={agent.agentId}>
                  <TableCell className="font-medium">{agent.agentId}</TableCell>
                  <TableCell className="text-right">{agent.reliability.toFixed(2)}%</TableCell>
                  <TableCell className="text-right">{agent.tasks}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">No agent data available yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
