import WebSocket from 'ws';

const serverUrl = "ws://localhost:3010/ws";
const ws = new WebSocket(serverUrl);

console.log("Attempting to connect to Stigmergy engine...");

// Set a timeout for the entire script to avoid hanging indefinitely
const SCRIPT_TIMEOUT = 180000; // 3 minutes
const timeout = setTimeout(() => {
  console.error("❌ Script timed out. The engine did not report EXECUTION_COMPLETE in time.");
  ws.close();
  process.exit(1); // Exit with an error code
}, SCRIPT_TIMEOUT);

ws.on('open', () => {
  console.log("✅ Connected to Stigmergy engine.");
  const prompt = {
    type: "user_chat_message",
    payload: {
      prompt: "Refactor the `testConnection` method in `services/code_intelligence_service.js`. The current implementation has complex nested `if/else` logic. Simplify it to be cleaner, more readable, and easier to maintain, without changing its external behavior.",
    },
  };
  ws.send(JSON.stringify(prompt));
  console.log("🚀 Sent prompt to the engine. Waiting for completion...");
});

ws.on('message', (message) => {
  try {
    const data = JSON.parse(message.toString());
    if (data.type === 'state_update' && data.payload && data.payload.project_status) {
        const status = data.payload.project_status;
        console.log(`[Engine] Status update: ${status}`);
        if (status === 'EXECUTION_COMPLETE') {
            console.log("✅ Task completed successfully!");
            clearTimeout(timeout);
            ws.close();
        } else if (status === 'ERROR') {
            console.error("❌ Engine reported an error:", data.payload.message || 'No details provided.');
            clearTimeout(timeout);
            ws.close();
            process.exit(1);
        }
    }
  } catch (e) {
    // It's possible to receive non-JSON messages, we can log and ignore them
    console.log("[Client] Received non-JSON message:", message.toString());
  }
});

ws.on('close', () => {
  console.log("🔌 Disconnected from Stigmergy engine.");
  clearTimeout(timeout); // Ensure timeout is cleared on close
});

ws.on('error', (error) => {
  console.error("❌ WebSocket error:", error.message);
  clearTimeout(timeout);
  process.exit(1); // Exit with an error code
});