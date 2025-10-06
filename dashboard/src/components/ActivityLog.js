import React from 'react';

const ActivityLog = ({ logs, agentActivity }) => {
  // CORRECTED: This no longer overwrites the original event type
  const combinedFeed = [
      ...logs.map(log => ({ ...log, source: 'log' })),
      ...agentActivity.map(act => ({ ...act, source: 'activity' }))
  ];

  const formatActivity = (item) => {
    switch (item.type) {
      case 'agent_start':
        return `[AGENT START] @${item.agent} | Prompt: ${(item.prompt || '').substring(0, 100)}...`;
      case 'tool_start':
        return `[TOOL START] ${item.tool} | Args: ${JSON.stringify(item.args)}`;
      case 'tool_end':
        if (item.error) {
          return `[TOOL END] ${item.tool} | Error: ${item.error}`;
        }
        return `[TOOL END] ${item.tool} | Result: ${JSON.stringify(item.result)}`;
      default:
        // Use the original item type for better debugging
        return `[${item.type || 'UNKNOWN'}] ${JSON.stringify(item)}`;
    }
  };

  return (
    <div className="activity-log-container">
      <ul id="activity-log">
          {combinedFeed.length > 0 ? (
            combinedFeed.map((item, index) => (
              <li key={index} className={`log-entry log-${item.source}`}>
                {/* CORRECTED: Check the source to decide how to format */}
                {item.source === 'log' ? item.message : formatActivity(item)}
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