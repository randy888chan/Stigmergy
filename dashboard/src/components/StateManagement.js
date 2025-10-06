import React, { useState, useEffect } from 'react';

const StateManagement = ({ state }) => {
  const [expandedSections, setExpandedSections] = useState({
    project: true,
    tasks: false,
    history: false,
    performance: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const renderObject = (obj, path = '') => {
    if (typeof obj !== 'object' || obj === null) {
      return <span className="state-value">{formatValue(obj)}</span>;
    }

    return (
      <div className="state-object">
        {Object.entries(obj).map(([key, value]) => (
          <div key={`${path}.${key}`} className="state-property">
            <span className="state-key">{key}:</span>
            {typeof value === 'object' && value !== null ? (
              <div className="state-nested">
                {renderObject(value, `${path}.${key}`)}
              </div>
            ) : (
              <span className="state-value">{formatValue(value)}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!state) {
    return (
      <div className="state-management-container">
        <h2>State Management</h2>
        <p>No state data available</p>
      </div>
    );
  }

  return (
    <div className="state-management-container">
      
      <div className="state-section">
        <div className="state-section-header" onClick={() => toggleSection('project')}>
          <h3>Project Information {expandedSections.project ? '▼' : '▶'}</h3>
        </div>
        {expandedSections.project && (
          <div className="state-section-content">
            <div className="state-property">
              <span className="state-key">Project Name:</span>
              <span className="state-value">{state.project_name}</span>
            </div>
            <div className="state-property">
              <span className="state-key">Project Status:</span>
              <span className="state-value">{state.project_status}</span>
            </div>
            <div className="state-property">
              <span className="state-key">Fallback Mode:</span>
              <span className="state-value">{state.fallback_mode ? 'Yes' : 'No'}</span>
            </div>
            {state.fallback_mode && (
              <div className="state-property">
                <span className="state-key">Fallback Reason:</span>
                <span className="state-value">{state.fallback_reason}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="state-section">
        <div className="state-section-header" onClick={() => toggleSection('tasks')}>
          <h3>Tasks ({state.project_manifest?.tasks?.length || 0}) {expandedSections.tasks ? '▼' : '▶'}</h3>
        </div>
        {expandedSections.tasks && (
          <div className="state-section-content">
            {state.project_manifest?.tasks?.length > 0 ? (
              state.project_manifest.tasks.map((task, index) => (
                <div key={index} className="task-item">
                  <div className="state-property">
                    <span className="state-key">ID:</span>
                    <span className="state-value">{task.id}</span>
                  </div>
                  <div className="state-property">
                    <span className="state-key">Description:</span>
                    <span className="state-value">{task.description}</span>
                  </div>
                  <div className="state-property">
                    <span className="state-key">Status:</span>
                    <span className="state-value">{task.status}</span>
                  </div>
                  <div className="state-property">
                    <span className="state-key">Assigned Agent:</span>
                    <span className="state-value">{task.assigned_agent || 'Unassigned'}</span>
                  </div>
                </div>
              ))
            ) : (
              <p>No tasks available</p>
            )}
          </div>
        )}
      </div>

      <div className="state-section">
        <div className="state-section-header" onClick={() => toggleSection('history')}>
          <h3>History ({state.history?.length || 0}) {expandedSections.history ? '▼' : '▶'}</h3>
        </div>
        {expandedSections.history && (
          <div className="state-section-content">
            {state.history?.length > 0 ? (
              state.history.slice().reverse().map((entry, index) => (
                <div key={index} className="history-item">
                  <div className="state-property">
                    <span className="state-key">Timestamp:</span>
                    <span className="state-value">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="state-property">
                    <span className="state-key">Agent:</span>
                    <span className="state-value">{entry.agent_id}</span>
                  </div>
                  <div className="state-property">
                    <span className="state-key">Message:</span>
                    <span className="state-value">{entry.message}</span>
                  </div>
                </div>
              ))
            ) : (
              <p>No history available</p>
            )}
          </div>
        )}
      </div>

      <div className="state-section">
        <div className="state-section-header" onClick={() => toggleSection('performance')}>
          <h3>Performance Data {expandedSections.performance ? '▼' : '▶'}</h3>
        </div>
        {expandedSections.performance && (
          <div className="state-section-content">
            {state.performance ? (
              renderObject(state.performance)
            ) : (
              <p>No performance data available</p>
            )}
          </div>
        )}
      </div>

      <div className="state-actions">
        <button className="state-action-button">Export State</button>
        <button className="state-action-button">Reset State</button>
        <button className="state-action-button">Save Snapshot</button>
      </div>
    </div>
  );
};

export default StateManagement;