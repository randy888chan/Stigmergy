#!/usr/bin/env node

/**
 * Test script to verify VS Code can connect to Stigmergy MCP server
 * This script simulates the MCP protocol initialization
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the MCP server
const mcpServerPath = resolve(__dirname, 'mcp-server.js');

console.log('🧪 Testing VS Code connection to Stigmergy MCP server...');
console.log(`📍 Server path: ${mcpServerPath}`);

// Spawn the MCP server process
const mcpProcess = spawn('node', [mcpServerPath], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe']
});

let receivedResponse = false;
let testCompleted = false;

// Send initialization message
const initMessage = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "vscode-test",
      version: "1.0.0"
    }
  }
};

console.log('📤 Sending initialization message...');

// Handle server stdout
mcpProcess.stdout.on('data', (data) => {
  try {
    const response = JSON.parse(data.toString());
    console.log('📥 Received response:', JSON.stringify(response, null, 2));
    
    if (response.id === 1 && response.result) {
      receivedResponse = true;
      console.log('✅ SUCCESS: VS Code can connect to Stigmergy MCP server');
      console.log('📋 Server info:', response.result.serverInfo);
      
      // Test listing tools
      const toolsMessage = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list"
      };
      
      console.log('📤 Requesting tool list...');
      mcpProcess.stdin.write(JSON.stringify(toolsMessage) + '\n');
    }
    
    if (response.id === 2 && response.result?.tools) {
      console.log('✅ Tool listing successful');
      console.log(`📋 Available tools: ${response.result.tools.map(t => t.name).join(', ')}`);
      testCompleted = true;
      cleanup();
    }
  } catch (error) {
    console.log('📝 Server output:', data.toString());
  }
});

// Handle server stderr
mcpProcess.stderr.on('data', (data) => {
  console.error('❌ Server error:', data.toString());
});

// Handle process exit
mcpProcess.on('close', (code) => {
  if (!testCompleted) {
    console.log(`❌ MCP server process exited with code ${code}`);
  }
});

// Handle process error
mcpProcess.on('error', (error) => {
  console.error('❌ Failed to start MCP server process:', error.message);
  process.exit(1);
});

// Send initialization message after a short delay
setTimeout(() => {
  mcpProcess.stdin.write(JSON.stringify(initMessage) + '\n');
}, 1000);

// Timeout function
setTimeout(() => {
  if (!receivedResponse) {
    console.log('❌ TIMEOUT: No response from MCP server');
    console.log('🔧 Troubleshooting tips:');
    console.log('   1. Ensure Stigmergy server is not already running on port 3010');
    console.log('   2. Check that all dependencies are installed (npm install)');
    console.log('   3. Verify mcp-server.js exists and has proper permissions');
  }
  
  if (!testCompleted) {
    cleanup();
  }
}, 10000);

function cleanup() {
  console.log('🧹 Cleaning up...');
  mcpProcess.kill();
  process.exit(receivedResponse && testCompleted ? 0 : 1);
}

// Handle Ctrl+C
process.on('SIGINT', cleanup);