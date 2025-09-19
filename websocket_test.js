import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3010');

ws.on('open', function open() {
  console.log('connected');
  ws.send(JSON.stringify({ type: 'user_create_task', payload: { description: 'Test task from websocket', priority: 'high' } }));
});

ws.on('message', function message(data) {
  console.log('received: %s', data);
  ws.close();
});

ws.on('close', function close() {
  console.log('disconnected');
});

ws.on('error', function error(error) {
  console.error('WebSocket error:', error);
});
