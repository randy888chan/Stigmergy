import { useState, useEffect, useRef } from 'react';

const useWebSocket = (url) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = () => {
    // Retrieve the token from localStorage
    const token = localStorage.getItem('authToken') || 'default-token';

    // Dynamically construct the WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;

    let wsUrl;
    if (url && url.startsWith('/')) {
        wsUrl = `${protocol}//${host}${url}?token=${token}`;
    } else {
        wsUrl = url || `${protocol}//${host}/ws?token=${token}`;
    }

    console.log(`[WS] Connecting to ${wsUrl}`);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = (event) => {
      console.log(`[WS] Connection opened to ${wsUrl}`, event);
      setIsConnected(true);
      setLoading(false);
      setError(null);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const jsonData = JSON.parse(event.data);
        console.log(`[WS] Message received:`, jsonData);
        setData(jsonData);
        // Dispatch a global event for testing purposes
        window.dispatchEvent(new MessageEvent('message', { data: event.data }));
      } catch (err) {
        console.error('[WS] Error parsing WebSocket message:', err, event.data);
        setError('Error parsing WebSocket message');
      }
    };

    ws.current.onerror = (err) => {
      console.error('[WS] WebSocket error:', err);
      setError('WebSocket connection error');
      setLoading(false);
      setIsConnected(false);
    };

    ws.current.onclose = (event) => {
      console.log(`[WS] WebSocket connection closed (Code: ${event.code}, Reason: ${event.reason || 'none'}, Clean: ${event.wasClean})`);
      setIsConnected(false);
      // Attempt reconnection after 3 seconds
      if (!reconnectTimeoutRef.current) {
        console.log('[WS] Attempting reconnection in 3 seconds...');
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connect();
        }, 3000);
      }
    };
  };

  useEffect(() => {
    connect();

    // Clean up function
    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [url]);

  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { data, error, loading, isConnected, sendMessage };
};

export default useWebSocket;
