import React from 'react';
import './ControlPanel.css';

const ControlPanel = ({ sendMessage, engineStatus }) => {
  const handleCommand = (command) => {
    sendMessage({
      type: 'user_command',
      payload: command,
    });
  };

  return (
    <div className="control-panel-container">
      <h3>Engine Controls</h3>
      <div className="controls">
        <button onClick={() => handleCommand('pause')}>Pause</button>
        <button onClick={() => handleCommand('resume')}>Resume</button>
        <button onClick={() => handleCommand('approve')}>Approve</button>
      </div>
      <div className="status">
        <strong>Status:</strong> {engineStatus}
      </div>
    </div>
  );
};

export default ControlPanel;
