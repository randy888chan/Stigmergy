import React from 'react';
import useWebSocket from '../hooks/useWebSocket.js';
import './ProjectStatus.css';

const ProjectStatus = () => {
  const { data: state, loading, error } = useWebSocket();

  const getStatusClass = (status) => {
    switch(status) {
      case 'EXECUTION_IN_PROGRESS':
        return 'status-running';
      case 'PAUSED_BY_USER':
        return 'status-paused';
      case 'EXECUTION_HALTED':
      case 'EXECUTION_FAILED':
        return 'status-stopped';
      default:
        return 'status-default';
    }
  };

  if (loading) return <p>Connecting to WebSocket...</p>;
  if (error) return <p>WebSocket Error: {error}</p>;

  return (
    <div className="project-status-container">
      <h2>Project Status</h2>
      <div className="project-info">
        <p><strong>Project:</strong> <span id="project-name">{state?.project_name || 'N/A'}</span></p>
        <p><strong>Status:</strong> 
          <span id="project-status" className={`status-badge ${getStatusClass(state?.project_status)}`}>
            {state?.project_status || 'UNKNOWN'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default ProjectStatus;