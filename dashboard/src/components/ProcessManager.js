import React from 'react';

const ProcessManager = () => {
  return (
    <div className="process-manager">
      <h3>Process Manager</h3>
      <p>Monitor and manage system processes and resource usage.</p>
      <div className="process-stats">
        <div className="stat">
          <span className="stat-label">CPU Usage:</span>
          <span className="stat-value">42%</span>
        </div>
        <div className="stat">
          <span className="stat-label">Memory Usage:</span>
          <span className="stat-value">1.2 GB</span>
        </div>
        <div className="stat">
          <span className="stat-label">Active Processes:</span>
          <span className="stat-value">24</span>
        </div>
      </div>
      <div className="process-actions">
        <button className="action-button">View Details</button>
        <button className="action-button">Kill Process</button>
        <button className="action-button">Restart Service</button>
      </div>
    </div>
  );
};

export default ProcessManager;