import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Terminal } from 'lucide-react';

const alerts = [
  {
    title: 'Low Success Rate: @debugger',
    description: "Recommendation: Enhance @debugger's protocol to include an automated code review step using `qwen_integration.reviewCode` before attempting a fix.",
  },
  {
    title: 'High Failure Rate: shell.execute',
    description: 'Analysis: Failures correlated with long-running processes. Recommendation: Update `shell.execute` documentation to enforce backgrounding of services.',
  },
];

const SystemHealthAlerts = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health Alerts & Recommendations</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {alerts.map((alert, index) => (
          <Alert key={index}>
            <Terminal className="h-4 w-4" />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};

export default SystemHealthAlerts;