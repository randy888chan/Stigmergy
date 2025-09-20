import React from 'react';
import useWebSocket from '../hooks/useWebSocket.js';
import './ActivityLog.css';

const ActivityLog = () => {
  const { data: state, loading, error } = useWebSocket();
  const activityLog = state?.history || [];

  if (loading) return <p>Connecting to WebSocket...</p>;
  if (error) return <p>WebSocket Error: {error}</p>;

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