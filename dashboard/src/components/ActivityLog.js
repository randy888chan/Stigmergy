import React from 'react';
import './ActivityLog.css';

const ActivityLog = ({ state }) => {
  const activityLog = state.history || [];

  return (
    <div className="activity-log-container">
      <h2>Agent Activity Log</h2>
      <ul id="activity-log">
        {activityLog.length > 0 ? (
          [...activityLog].reverse().map((logEntry, index) => (
            <li key={index}>
              <span className="log-msg">[{logEntry.agent_id}] {logEntry.message}</span>
              <span className="log-meta">{new Date(logEntry.timestamp).toLocaleTimeString()}</span>
            </li>
          ))
        ) : (
          <li>No activity yet.</li>
        )}
      </ul>
    </div>
  );
};

export default ActivityLog;