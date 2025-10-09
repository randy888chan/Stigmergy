import React, { useState } from 'react';
import { Input } from './ui/input.jsx';
import { Button } from './ui/button.jsx';

// These are the states where the engine is actively working and cannot accept new goals.
const BUSY_STATUSES = [
  'ENRICHMENT_PHASE',
  'PLANNING_PHASE',
  'CODING_PHASE',
  'TESTING_PHASE',
  'DEBUGGING_PHASE',
  'EXECUTING',
  'Running', // A general busy state
];

const ChatInterface = ({ sendMessage, engineStatus, activeProject }) => {
  const [goal, setGoal] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (goal.trim() && activeProject) {
      // Send a 'start_mission' event, which is what the engine expects for new goals.
      sendMessage({ type: 'start_mission', payload: { goal, project_path: activeProject } });
      setGoal('');
    }
  };

  const isBusy = BUSY_STATUSES.includes(engineStatus);
  const canSubmit = goal.trim() && activeProject && !isBusy;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-1">
        {/* Placeholder for future chat messages */}
        <div className="text-center text-sm text-muted-foreground pt-4">
          Define a new mission for the selected project.
        </div>
      </div>
      <form onSubmit={handleSend} className="flex items-center gap-2 p-1">
        <Input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder={!activeProject ? "Set a project first..." : "Enter your mission objective..."}
          disabled={!activeProject || isBusy}
          className="flex-grow"
        />
        <Button type="submit" disabled={!canSubmit}>
          {isBusy ? 'Engine Busy' : 'Start Mission'}
        </Button>
      </form>
    </div>
  );
};

export default ChatInterface;