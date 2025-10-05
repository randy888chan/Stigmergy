import { useState, useEffect, useRef } from 'react';

const useWebSocket = (url) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const ws = useRef(null);

  useEffect(() => {
    const wsUrl = url || process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3010/ws';
    // Create WebSocket connection
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log(`WebSocket connection opened to ${url}`);
      setLoading(false);
    };

    ws.current.onmessage = (event) => {
      try {
        const jsonData = JSON.parse(event.data);
        setData(jsonData);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
        setError('Error parsing WebSocket message');
      }
    };

    ws.current.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('WebSocket connection error');
      setLoading(false);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Clean up function
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { data, error, loading, sendMessage };
};

export default useWebSocket;