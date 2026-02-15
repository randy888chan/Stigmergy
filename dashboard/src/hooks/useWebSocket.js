import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = (path) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false); // Local state for this hook
  const ws = useRef(null);
  const pingInterval = useRef(null);

  const connect = useCallback(() => {
    // Prevent multiple connections
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:3010' : window.location.host; // Handle port diffs in dev
    const wsUrl = `${protocol}//${host}${path}`;

    console.log("Connecting to WS:", wsUrl);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WS Connected (Client)');
      setIsConnected(true);

      // Heartbeat
      if (pingInterval.current) clearInterval(pingInterval.current);
      pingInterval.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send("ping");
        }
      }, 5000);
    };

    ws.current.onmessage = (event) => {
      if (event.data === "pong") return;
      try {
        const parsed = JSON.parse(event.data);
        setData(parsed);
      } catch (e) {
        console.warn('WS Non-JSON message:', event.data);
      }
    };

    ws.current.onclose = () => {
      console.log('WS Disconnected (Client)');
      setIsConnected(false);
      if (pingInterval.current) clearInterval(pingInterval.current);
      // Auto-reconnect
      setTimeout(() => connect(), 3000);
    };

    ws.current.onerror = (err) => {
      // Don't log full event object to reduce noise
      console.warn('WS Error occurred, will retry...');
      ws.current.close();
    };
  }, [path]);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) ws.current.close();
      if (pingInterval.current) clearInterval(pingInterval.current);
    };
  }, [connect]);

  const sendMessage = (msg) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    } else {
        console.warn("Cannot send, WS not open.");
    }
  };

  return { data, sendMessage, isConnected };
};

export default useWebSocket;
