import React, { useState, useEffect } from 'react';
import './ClarificationHandler.css';

const ClarificationHandler = ({ ws }) => {
  const [clarification, setClarification] = useState(null);
  const [response, setResponse] = useState('');

  useEffect(() => {
    if (ws.data?.type === 'clarification_request') {
      setClarification(ws.data.payload);
    }
  }, [ws.data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (response.trim() && ws.sendMessage) {
      ws.sendMessage({
        type: 'clarification_response',
        payload: { 
          response: response.trim(),
          requestId: clarification?.requestId
        }
      });
      setClarification(null);
      setResponse('');
    }
  };

  const handleClose = () => {
    setClarification(null);
    setResponse('');
  };

  if (!clarification) return null;

  return (
    <div className="clarification-modal-overlay">
      <div className="clarification-modal">
        <div className="clarification-header">
          <h3>Agent Needs Clarification</h3>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        <div className="clarification-content">
          <p className="clarification-question">{clarification.question}</p>
          <form onSubmit={handleSubmit} className="clarification-form">
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Please provide your response..."
              className="clarification-input"
              autoFocus
            />
            <div className="clarification-actions">
              <button type="button" onClick={handleClose} className="cancel-button">
                Cancel
              </button>
              <button type="submit" className="submit-button" disabled={!response.trim()}>
                Send Response
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClarificationHandler;