# VS Code Integration Guide

## Quick Setup

1. Install the Continue extension from the VS Code marketplace
2. In your project directory, run:
   ```bash
   npx @randy888chan/stigmergy install
   ```
3. Start Stigmergy:
   ```bash
   npm run stigmergy:start
   ```
4. Configure Continue to use the MCP server at `./mcp-server.js`

## Detailed Instructions

### Prerequisites

- VS Code installed
- Node.js 18+ installed
- Continue extension installed

### Installation

1. Open your project in VS Code
2. Open the terminal (Ctrl+` or View > Terminal)
3. Run the installation command:
   ```bash
   npx @randy888chan/stigmergy install
   ```

This will:
- Install the universal MCP server in your project
- Add necessary npm scripts
- Create configuration templates

### Starting Stigmergy

In the terminal, start Stigmergy:
```bash
npm run stigmergy:start
```

The system will start on port 3010 by default.

### Configuring Continue

1. Open VS Code settings (Ctrl+, or Code > Preferences > Settings)
2. Search for "Continue"
3. Find the "Continue: Model Roles" setting
4. Add a new model role with these settings:
   - Title: "Stigmergy"
   - API Type: "OpenAI"
   - Model: "gpt-4" (this is just for Continue's internal use)
   - API Base: "http://localhost:3010/api"

### Using Stigmergy in VS Code

Once configured, you can use Stigmergy in several ways:

1. **Continue Chat Panel**: Open the Continue chat panel and use natural language commands
2. **Inline Commands**: Select code and use Continue's context menu to send to Stigmergy
3. **Custom Commands**: Create custom Continue commands that route to Stigmergy

### Example Commands

Try these commands in the Continue chat panel:

- "Setup Neo4j database for this project"
- "Create a REST API for user management"
- "Add authentication to this application"
- "Health check the Stigmergy system"
- "What can I do with Stigmergy?"

### Troubleshooting

If you encounter issues:

1. **Verify Stigmergy is Running**:
   ```bash
   npm run stigmergy:start
   ```

2. **Test MCP Connection**:
   ```bash
   npm run mcp:test
   ```

3. **Check Port Availability**:
   ```bash
   lsof -i :3010
   ```

4. **Restart VS Code** after making configuration changes

## Advanced Configuration

### Custom Environment Variables

Create a `.env` file in your project with custom settings:
```bash
GOOGLE_API_KEY=your_api_key_here
GITHUB_TOKEN=your_github_token_here
```

### Project-Specific Configuration

Create a `stigmergy.config.js` file to customize behavior:
```javascript
export default {
  model_tiers: {
    reasoning_tier: {
      model_name: "gemini-2.0-flash-thinking-exp"
    }
  }
};
```

## Tips and Tricks

1. **Use Context**: Include file context when asking questions for more relevant responses
2. **Iterate**: Stigmergy works best with iterative development - start small and build up
3. **Monitor Progress**: Use the Stigmergy dashboard to monitor agent activity
4. **Customize**: Tailor the configuration to your specific development workflow