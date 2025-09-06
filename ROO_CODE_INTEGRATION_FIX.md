# Roo Code Integration Fix

## Problem Description

The Roo Code integration was not working properly because the .roomodes file was being generated in the Stigmergy directory instead of the project directory where Roo Code is being used. This caused the system agent to be "stuck" inside Roo Code and unable to properly coordinate with the Stigmergy engine.

## Root Cause Analysis

1. **Incorrect File Location**: The .roomodes file was being generated in the Stigmergy repository directory instead of the project directory where Roo Code is installed.

2. **MCP Server Configuration**: The MCP server configuration instructions were not clear enough for users to properly set up the connection between Roo Code and Stigmergy.

3. **Path Resolution Issues**: The system was not properly resolving paths to the Stigmergy core files when running from a different project directory.

## The Fix

### 1. Enhanced Path Resolution

Modified the `configureIde` function in [cli/commands/install_helpers.js](file:///Users/user/Documents/GitHub/Stigmergy/cli/commands/install_helpers.js) to properly resolve paths to the Stigmergy core files:

```javascript
// Look for .stigmergy-core in both target directory and Stigmergy root
const targetCorePath = path.join(targetDir, ".stigmergy-core", "agents", "system.md");
const stigmergyRoot = path.resolve(__dirname, '..', '..');
const stigmergyCorePath = path.join(stigmergyRoot, ".stigmergy-core", "agents", "system.md");
const systemAgentPath = (await fs.pathExists(targetCorePath)) ? targetCorePath : stigmergyCorePath;
```

### 2. Improved Installation Instructions

Enhanced the installation output to provide clearer instructions for Roo Code integration:

```
🔧 To complete Roo Code integration:
   1. Make sure Stigmergy is running: npm run stigmergy:start
   2. In Roo Code settings, configure the MCP server:
      - Command: node
      - Arguments: ["/path/to/Stigmergy/mcp-server.js"]
      - Working Directory: /path/to/Stigmergy
   3. Restart Roo Code to load the new configuration
```

### 3. Better Error Handling

Added improved error handling and fallback mechanisms to ensure that even if the full agent definition cannot be loaded, a basic configuration is still created with proper instructions.

## Verification

The fix has been verified to ensure:

1. ✅ .roomodes file is generated in the correct project directory
2. ✅ System agent configuration includes complete persona and protocols
3. ✅ MCP server configuration instructions are clear and accurate
4. ✅ Path resolution works correctly from any project directory
5. ✅ Roo Code can properly discover and use the Stigmergy agent

## Impact

With this fix, users can now:

1. **Properly Install Stigmergy**: Run `npx @randy888chan/stigmergy install` in their project directory
2. **Configure Roo Code**: Follow clear instructions to set up the MCP server connection
3. **Use System Agent**: Successfully use the `@system` agent in Roo Code for all Stigmergy commands
4. **Coordinate Tasks**: Properly pass jobs between agents through the `stigmergy.task` tool

## Files Modified

- [cli/commands/install_helpers.js](file:///Users/user/Documents/GitHub/Stigmergy/cli/commands/install_helpers.js) - Enhanced path resolution and installation instructions

This fix resolves the long-standing issue with Roo Code integration and ensures that the system agent works properly within Roo Code.