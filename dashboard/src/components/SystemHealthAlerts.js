import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Terminal } from 'lucide-react';

const SystemHealthAlerts = ({ healthData }) => {
  const alerts = healthData?.alerts || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health Alerts & Recommendations</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {alerts.length > 0 ? (
          alerts.map((alert, index) => (
            <Alert key={index}>
              <Terminal className="h-4 w-4" />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.description}</AlertDescription>
            </Alert>
          ))
        ) : (
          <div className="text-center text-muted-foreground">
            No system health alerts.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealthAlerts;