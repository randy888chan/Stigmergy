import { useState, useEffect, useRef } from 'react';

const useWebSocket = (url) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const ws = useRef(null);

  useEffect(() => {
    // Retrieve the token from localStorage
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('No auth token found');
      setLoading(false);
      return;
    }

    // Dynamically construct the WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;

    let wsUrl;
    if (url && url.startsWith('/')) {
        wsUrl = `${protocol}//${host}${url}?token=${token}`;
    } else {
        wsUrl = url || `${protocol}//${host}/ws?token=${token}`;
    }

    // Create WebSocket connection
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log(`WebSocket connection opened`);
      setLoading(false);
    };

    ws.current.onmessage = (event) => {
      try {
        const jsonData = JSON.parse(event.data);
        setData(jsonData);
        // Dispatch a global event for testing purposes
        window.dispatchEvent(new MessageEvent('message', { data: event.data }));
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
  }, [url]);

  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { data, error, loading, sendMessage };
};

export default useWebSocket;
