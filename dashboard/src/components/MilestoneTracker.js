import React, { useState, useEffect } from 'react';

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
    return <p>{error}</p>;
  }

  return (
    <div>
      <h2>Milestone Progress</h2>
      {milestones.length === 0 ? (
        <p>No milestones defined in the current plan.</p>
      ) : (
        <div>
          {milestones.map((milestone) => (
            <div key={milestone.name}>
              <div>
                <span>{milestone.name}</span>
                <span>{milestone.progress}%</span>
              </div>
              <progress value={milestone.progress} max="100" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MilestoneTracker;
