import React, { useState } from 'react';

const ChatInterface = ({ sendMessage, engineStatus }) => {
  const [message, setMessage] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage({ type: 'user_message', payload: { message } });
      setMessage('');
    }
  };

  return (
    <div className="chat-interface-container">
      <div className="chat-messages">
        {/* Messages would be displayed here. This part needs to be implemented based on state. */}
      </div>
      <form onSubmit={handleSend} className="chat-form">
        <input
          type="text"
          className="chat-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={engineStatus !== 'Running'}
        />
        <button type="submit" className="chat-submit" disabled={engineStatus !== 'Running'}>
          Send
        </button>
      </form>
      <div className="status">
        Engine Status: <strong>{engineStatus}</strong>
      </div>
    </div>
  );
};

export default ChatInterface;