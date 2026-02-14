import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = (path) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const pingInterval = useRef(null);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}${path}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WS Connected');
      setIsConnected(true);
      // Setup Heartbeat
      if (pingInterval.current) clearInterval(pingInterval.current);
      pingInterval.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send("ping");
        }
      }, 10000); // 10 seconds
    };

    ws.current.onmessage = (event) => {
      if (event.data === "pong") return; // Ignore heartbeats
      try {
        const parsed = JSON.parse(event.data);
        setData(parsed);
      } catch (e) {
        console.error('WS Parse Error', e);
      }
    };

    ws.current.onclose = () => {
      console.log('WS Disconnected. Reconnecting...');
      setIsConnected(false);
      if (pingInterval.current) clearInterval(pingInterval.current);
      setTimeout(connect, 3000); // Retry after 3s
    };

    ws.current.onerror = (err) => {
      console.error('WS Error:', err);
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
        console.warn("WS not open, cannot send:", msg);
    }
  };

  return { data, isConnected, sendMessage };
};

export default useWebSocket;
