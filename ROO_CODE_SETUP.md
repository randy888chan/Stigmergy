# Roo Code Integration Setup

To properly connect Roo Code with Stigmergy, follow these steps:

## 1. Ensure Stigmergy is Running

First, make sure the Stigmergy engine is running:

```bash
npm run stigmergy:start
```

The engine should be available at `http://localhost:3010`.

## 2. Configure MCP Server in Roo Code

In Roo Code, you need to configure the MCP server to connect to Stigmergy:

1. Open Roo Code settings
2. Navigate to the MCP server configuration section
3. Add a new MCP server with the following configuration:

```
Server Name: Stigmergy
Command: node
Arguments: ["mcp-server.js"]
Working Directory: /path/to/stigmergy/directory
```

Replace `/path/to/stigmergy/directory` with the actual path to your Stigmergy directory.

## 3. Using the @system Agent

Once the MCP server is configured, you can use the @system agent in Roo Code:

1. In any chat window, type `@system` to activate the Stigmergy agent
2. You can then use commands like:
   - "setup neo4j"
   - "health check"
   - "create authentication system"
   - "what can I do?"

## 4. Troubleshooting

If you're having connection issues:

1. Make sure the Stigmergy engine is running (`npm run stigmergy:start`)
2. Check that the MCP server path is correct in Roo Code settings
3. Verify that the `.roomodes` file exists in your project directory
4. Restart Roo Code after making configuration changes

## 5. Testing the Connection

To test if the connection is working:

1. In Roo Code, open a chat window
2. Type `@system health check`
3. You should receive a response with system status information

If you don't receive a response, check the Stigmergy logs for any errors.