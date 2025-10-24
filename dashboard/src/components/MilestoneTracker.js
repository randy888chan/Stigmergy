import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress'; // Assuming a Progress component exists

const MilestoneTracker = () => {
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMilestoneProgress = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/executive-summary');
        if (!response.ok) {
          throw new Error('Failed to fetch milestone data.');
        }
        const data = await response.json();
        setMilestones(data.milestoneProgress || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMilestoneProgress();
    const interval = setInterval(fetchMilestoneProgress, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <p>Loading milestones...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Milestone Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <p>No milestones defined in the current plan.</p>
        ) : (
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div key={milestone.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{milestone.name}</span>
                  <span className="text-sm text-muted-foreground">{milestone.progress}%</span>
                </div>
                <Progress value={milestone.progress} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MilestoneTracker;
