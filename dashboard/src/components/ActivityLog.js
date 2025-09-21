import React from 'react';
import './ActivityLog.css';

const ActivityLog = ({ logs, agentActivity }) => {
  const formatActivity = (item) => {
    switch (item.type) {
      case 'agent_start':
        return `[AGENT START] @${item.agent} | Prompt: ${item.prompt.substring(0, 100)}...`;
      case 'tool_start':
        return `[TOOL START] ${item.tool} | Args: ${JSON.stringify(item.args)}`;
      case 'tool_end':
        if (item.error) {
          return `[TOOL END] ${item.tool} | Error: ${item.error}`;
        }
        return `[TOOL END] ${item.tool} | Result: ${JSON.stringify(item.result)}`;
      default:
        return 'Unknown activity';
    }
  };

  // Combine and sort logs and activities by a timestamp if available, or just append
  const combinedFeed = [
    ...logs.map(log => ({ ...log, type: 'log' })),
    ...agentActivity.map(act => ({ ...act, type: 'activity' }))
  ];


  return (
    <div className="activity-log-container">
      <h2>Real-Time Activity Log</h2>
      <ul id="activity-log">
        {combinedFeed.length > 0 ? (
          combinedFeed.map((item, index) => (
            <li key={index} className={`log-entry log-${item.type}`}>
              {item.type === 'log' ? item.message : formatActivity(item)}
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