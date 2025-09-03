# MCP Server Setup for Roo Code Integration

## Overview

The MCP (Model Context Protocol) server provides the bridge between Roo Code and Stigmergy's backend services. This setup needs to be done manually in Roo Code settings.

## Manual MCP Server Configuration

### Step 1: Locate Roo Code Settings

1. Open VS Code with Roo Code extension installed
2. Go to Settings (Cmd/Ctrl + ,)
3. Search for "MCP" or find Roo Code settings
4. Look for "MCP Servers" configuration

### Step 2: Add Stigmergy MCP Server

Add this configuration to your Roo Code MCP servers:

```json
{
  "stigmergy-chat": {
    "command": "node",
    "args": ["mcp-server.js"],
    "cwd": "/path/to/your/stigmergy/installation",
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

**Important**: Replace `/path/to/your/stigmergy/installation` with the actual path where you installed Stigmergy.

### Step 3: Find Your Stigmergy Installation Path

If you're not sure where Stigmergy is installed, run:

```bash
# If installed globally
npm list -g @randy888chan/stigmergy

# If using npm link
which stigmergy

# Or find the path manually
find /usr/local -name "stigmergy" 2>/dev/null
```

### Step 4: Restart Roo Code

After adding the MCP server configuration:
1. Restart VS Code
2. Open your project with the `.roomodes` file
3. The @system agent should now be available

## Example Complete Configuration

For reference, here's what your complete MCP server configuration might look like:

```json
{
  "stigmergy-chat": {
    "command": "node",
    "args": ["mcp-server.js"],
    "cwd": "/Users/username/Documents/GitHub/Stigmergy",
    "env": {
      "NODE_ENV": "production"
    }
  },
  "other-mcp-server": {
    "command": "python",
    "args": ["-m", "other_mcp_server"],
    "cwd": "/path/to/other/server"
  }
}
```

## Available MCP Tools

Once configured, the following tools are available through the MCP server:

- **stigmergy_chat**: Process natural language commands
- **stigmergy_suggestions**: Get contextual command suggestions  
- **mcp_code_search**: Search code using semantic search
- **mcp_symbol_lookup**: Look up specific symbols in codebase
- **initialize_coderag**: Initialize CodeRAG for the project
- **lightweight_archon_query**: Query enhanced context system

## Troubleshooting

### MCP Server Not Found
- Verify the `cwd` path points to your Stigmergy installation
- Check that `mcp-server.js` exists in that directory
- Ensure Node.js is available in your PATH

### Permission Issues
- Make sure the Stigmergy directory is readable
- Check file permissions on `mcp-server.js`
- Verify Node.js version compatibility (v18+ recommended)

### Agent Not Responding
1. Check Stigmergy is running: `npm run stigmergy:start`
2. Verify MCP server logs in Roo Code
3. Test with simple command: `@system "health check"`

## Verification

To verify the setup is working:

1. Open a project with `.roomodes` file in VS Code
2. Type `@system` in Roo Code
3. Try: `@system "what can I do?"`
4. You should see a response with available commands

## Alternative: Global MCP Configuration

If you prefer, you can configure the MCP server globally in Roo Code settings rather than per-project. This allows the @system agent to be available in all projects where Stigmergy is installed.

## Security Considerations

- The MCP server runs locally and doesn't expose external ports
- All communication happens through local file system and process communication
- API keys are read from environment variables and not exposed through MCP
- Consider firewall settings if using remote development environments

---

For more help, refer to:
- [Roo Code Documentation](https://roocode.ai/docs)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Stigmergy Documentation](../README.md)