import React, { useState } from 'react';

const ControlPanel = ({ sendMessage, engineStatus }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      let finalPrompt = prompt.trim();
      const urlRegex = /^(https?:\/\/[^\s]+)/;
      if (urlRegex.test(finalPrompt)) {
        finalPrompt = `Analyze the content of this webpage for me: ${finalPrompt}`;
      }
      sendMessage({
        type: 'user_chat_message',
        payload: { prompt: finalPrompt },
      });
      setPrompt('');
    }
  };

  return (
    <div className="control-panel-container">
      <h3>Chat Interface</h3>
      <form onSubmit={handleSubmit} className="chat-form">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your command or goal..."
          className="chat-input"
        />
        <button type="submit" className="chat-submit">Send</button>
      </form>
      <div className="status">
        <strong>Status:</strong> {engineStatus}
      </div>
    </div>
  );
};

export default ControlPanel;
