# Stigmergy VS Code Integration Setup

This guide explains how to set up Stigmergy with VS Code using the Model Context Protocol (MCP).

## Prerequisites

1. VS Code installed
2. Stigmergy server running (npm run start or npm run stigmergy:start)
3. Node.js 18+ installed

## Setup Instructions

### 1. Install the Continue Extension

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)
3. Search for "Continue" and install the extension by Continue
4. Reload VS Code if prompted

### 2. Configure Continue to Use Stigmergy MCP Server

1. Open VS Code settings (Ctrl+, or Cmd+,)
2. Search for "continue config"
3. Click "Edit in settings.json"
4. Add the following configuration:

```json
{
  "continue.config": {
    "models": [
      {
        "title": "Stigmergy System",
        "provider": "openai",
        "model": "gpt-4",
        "apiBase": "http://localhost:3010/api"
      }
    ],
    "customCommands": [
      {
        "name": "Stigmergy Chat",
        "prompt": "Process this command through Stigmergy: {{command}}",
        "description": "Send command to Stigmergy system"
      }
    ]
  }
}
```

### 3. Configure MCP Server Connection

1. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
2. Type "Continue: Configure MCP Server"
3. Select "Add New MCP Server"
4. Enter the following details:
   - Name: Stigmergy
   - Command: `node /path/to/Stigmergy/mcp-server.js`
   - Working Directory: `/path/to/Stigmergy`

Replace `/path/to/Stigmergy` with the actual path to your Stigmergy repository.

### 4. Start Using Stigmergy

1. Open the Continue sidebar (Ctrl+Shift+I or Cmd+Shift+I)
2. Select "Stigmergy" from the model dropdown
3. Start chatting with commands like:
   - "Create a new React component called Button"
   - "Set up authentication with JWT"
   - "Run health check on the system"
   - "What can I do with Stigmergy?"

## Testing the Connection

You can test if the connection is working by running the test script:

```bash
node test-vscode-connection.js
```

## Troubleshooting

1. **Connection Issues**: Ensure the Stigmergy server is running on port 3010
2. **Permission Issues**: Make sure the mcp-server.js file has execute permissions
3. **Path Issues**: Verify the path to mcp-server.js is correct in your configuration

## Additional Resources

- [Stigmergy Documentation](https://github.com/StigmergyAI/Stigmergy)
- [Continue Extension Documentation](https://continue.dev/docs)
- [Model Context Protocol](https://modelcontextprotocol.io)