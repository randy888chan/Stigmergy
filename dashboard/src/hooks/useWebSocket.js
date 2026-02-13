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

    try {
        ws.current = new WebSocket(wsUrl);
    } catch (e) {
        console.error(`[WS] Failed to create WebSocket instance:`, e);
        setError(`Failed to create WebSocket: ${e.message}`);
        setLoading(false);
        return;
    }

    ws.current.onopen = (event) => {
      console.log(`[WS] Connection opened successfully to ${wsUrl}`);
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

        // Handle heartbeat silently
        if (jsonData.type === 'heartbeat') return;

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
      // In development, React Strict Mode or HMR can cause connections to close or fail quickly.
      // We only log a full error if the connection was established and then failed unexpectedly.
      // We use numeric readyState values for maximum compatibility: 2 (CLOSING), 3 (CLOSED).
      const readyState = ws.current?.readyState;
      if (readyState === 2 /* CLOSING */ || readyState === 3 /* CLOSED */) {
          // Silent in this case as it's often a side effect of a controlled close or re-render
          return;
      }

      console.error('[WS] WebSocket error observed:', err);

      const errorMsg = 'WebSocket connection error';
      setError(errorMsg);
      setLoading(false);
      setIsConnected(false);
    };

    ws.current.onclose = (event) => {
      console.log(`[WS] WebSocket connection closed (Code: ${event.code}, Reason: ${event.reason || 'none'}, Clean: ${event.wasClean})`);

      if (event.code === 1006) {
          console.warn('[WS] Abnormal closure (1006). This often happens if the server drops the connection or if there is a protocol mismatch.');
      }

      setIsConnected(false);
      // Attempt reconnection after 3 seconds
      if (!reconnectTimeoutRef.current) {
        console.log('[WS] Scheduling reconnection in 3 seconds...');
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
