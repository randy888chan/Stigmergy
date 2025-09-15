import React, { useState, useEffect } from 'react';
import './ProcessManager.css';

const ProcessManager = () => {
  const [processes, setProcesses] = useState([]);
  const [command, setCommand] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Simulate process data for demonstration
  useEffect(() => {
    const mockProcesses = [
      {
        id: 1,
        command: 'npm start',
        status: 'running',
        pid: 12345,
        startTime: new Date(Date.now() - 3600000),
        cpu: '2.3%',
        memory: '128MB'
      },
      {
        id: 2,
        command: 'node server.js',
        status: 'running',
        pid: 12346,
        startTime: new Date(Date.now() - 7200000),
        cpu: '1.8%',
        memory: '96MB'
      },
      {
        id: 3,
        command: 'webpack --watch',
        status: 'finished',
        pid: 12347,
        startTime: new Date(Date.now() - 1800000),
        endTime: new Date(Date.now() - 1700000),
        exitCode: 0
      }
    ];
    
    setProcesses(mockProcesses);
    setIsConnected(true);
  }, []);

  const handleStartProcess = () => {
    if (!command.trim()) return;
    
    const newProcess = {
      id: processes.length + 1,
      command: command,
      status: 'running',
      pid: Math.floor(Math.random() * 10000) + 10000,
      startTime: new Date(),
      cpu: '0.0%',
      memory: '0MB'
    };
    
    setProcesses([...processes, newProcess]);
    setCommand('');
  };

  const handleStopProcess = (processId) => {
    setProcesses(processes.map(p => {
      if (p.id === processId) {
        return { ...p, status: 'stopped', endTime: new Date() };
      }
      return p;
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'status-running';
      case 'finished': return 'status-finished';
      case 'stopped': return 'status-stopped';
      case 'error': return 'status-error';
      default: return '';
    }
  };

  const formatDuration = (startTime, endTime = null) => {
    const end = endTime || new Date();
    const duration = end - startTime;
    const seconds = Math.floor(duration / 1000) % 60;
    const minutes = Math.floor(duration / 60000) % 60;
    const hours = Math.floor(duration / 3600000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="process-manager">
      <div className="process-manager-header">
        <h3>Process Manager</h3>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      
      <div className="process-controls">
        <div className="command-input">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter command to execute..."
            onKeyPress={(e) => e.key === 'Enter' && handleStartProcess()}
          />
          <button onClick={handleStartProcess} className="start-button">
            Start
          </button>
        </div>
      </div>
      
      <div className="process-list">
        <table className="process-table">
          <thead>
            <tr>
              <th>Command</th>
              <th>Status</th>
              <th>PID</th>
              <th>CPU</th>
              <th>Memory</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((process) => (
              <tr key={process.id}>
                <td className="command-cell">{process.command}</td>
                <td>
                  <span className={`status-badge ${getStatusColor(process.status)}`}>
                    {process.status}
                  </span>
                </td>
                <td>{process.pid || '-'}</td>
                <td>{process.cpu || '-'}</td>
                <td>{process.memory || '-'}</td>
                <td>{formatDuration(process.startTime, process.endTime)}</td>
                <td>
                  {process.status === 'running' && (
                    <button 
                      onClick={() => handleStopProcess(process.id)}
                      className="stop-button"
                    >
                      Stop
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="process-summary">
        <div className="summary-item">
          <span className="summary-label">Total:</span>
          <span className="summary-value">{processes.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Running:</span>
          <span className="summary-value">
            {processes.filter(p => p.status === 'running').length}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Finished:</span>
          <span className="summary-value">
            {processes.filter(p => p.status === 'finished').length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProcessManager;