const WebSocket = require('ws');
const path = require('path');
const os = require('os');
const { promises: fs } = require('fs');

/**
 * Connects to the gemini-cli-ui backend via WebSocket to execute a command.
 * Assumes the gemini-cli-ui server is running on localhost:4008.
 */
async function execute({ prompt, projectPath }) {
  // Use the default gemini-cli-ui port. This can be made configurable if needed.
  const GEMINI_UI_PORT = 4008;
  const wsUrl = `ws://localhost:${GEMINI_UI_PORT}/ws`;

  return new Promise((resolve, reject) => {
    console.log(`[Stigmergy -> Gemini] Connecting to Gemini CLI UI at ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    let finalResponse = "";

    ws.on('open', () => {
      console.log('[Stigmergy -> Gemini] Connection open. Sending command.');
      const commandPayload = {
        type: 'gemini-command',
        command: prompt,
        options: {
          projectPath: projectPath,
          cwd: projectPath,
          // YOLO mode is enabled for full autonomy, as Stigmergy has its own approval gates.
          toolsSettings: { skipPermissions: true, selectedModel: 'gemini-2.5-pro' }
        }
      };
      ws.send(JSON.stringify(commandPayload));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data);
      if (message.type === 'gemini-response') {
        const content = message.data?.message?.content || '';
        finalResponse += content + "\n";
        console.log(`[Gemini -> Stigmergy] Progress: ${content.substring(0, 100)}...`);
      } else if (message.type === 'gemini-complete') {
        console.log('[Stigmergy -> Gemini] Execution complete.');
        ws.close();
        resolve(finalResponse.trim());
      } else if (message.type === 'gemini-error') {
        console.error('[Stigmergy -> Gemini] Received error:', message.error);
        ws.close();
        reject(new Error(message.error));
      }
    });

    ws.on('error', (error) => {
      console.error('[Stigmergy -> Gemini] WebSocket error:', error.message);
      reject(new Error(`Failed to connect to the Gemini CLI UI backend. Please ensure it is running on port ${GEMINI_UI_PORT}.`));
    });

    ws.on('close', (code) => {
      if (code !== 1000) {
        // 1000 is a normal closure. Anything else might be an issue.
        console.log(`[Stigmergy -> Gemini] Connection closed with code: ${code}`);
      }
    });
  });
}

module.exports = {
  execute,
};
