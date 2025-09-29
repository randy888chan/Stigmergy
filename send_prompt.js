const ws = new WebSocket("ws://localhost:3010/ws");

ws.onopen = () => {
  console.log("Connected to Stigmergy engine.");
  const prompt = {
    type: "user_chat_message",
    payload: {
      prompt: "Refactor the `testConnection` method in `services/code_intelligence_service.js`. The current implementation has complex nested `if/else` logic. Simplify it to be cleaner, more readable, and easier to maintain, without changing its external behavior.",
    },
  };
  ws.send(JSON.stringify(prompt));
  console.log("Sent prompt to the engine.");
  setTimeout(() => {
    ws.close();
  }, 2000); // Add a 2-second delay
};

ws.onmessage = (event) => {
  console.log("Received:", event.data);
};

ws.onclose = () => {
  console.log("Disconnected from Stigmergy engine.");
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error.message);
};