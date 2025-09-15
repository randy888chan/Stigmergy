# Stigmergy Self-Contained Development System User Guide

## Introduction

Stigmergy is now a fully self-contained development system that works independently of any specific IDE. This guide will help you understand how to use Stigmergy in various development environments, with a focus on its universal compatibility.

## System Independence

Stigmergy has been designed to work as a standalone development system with the following capabilities:

1. **Universal MCP Integration**: Works with any IDE that supports the Model-Context Protocol (MCP)
2. **CLI-Based Operation**: Full functionality available through command-line interface
3. **Chat Interface**: Natural language commands for all system operations
4. **Dashboard UI**: Web-based interface for system monitoring and management

## Installation Options

### Universal Installation (Recommended)

Install Stigmergy with full IDE integration:

```bash
# Install in your project directory
cd /path/to/your/project
npx @randy888chan/stigmergy install
```

This will:
- Copy core Stigmergy files to your project
- Set up the universal MCP server
- Configure environment templates
- Add convenient npm scripts

### Lightweight Installation

For minimal setup, install only the MCP server:

```bash
npx @randy888chan/stigmergy mcp
```

## IDE Integration

### VS Code Integration

1. Install the Continue extension from the VS Code marketplace
2. Run the installation command in your project:
   ```bash
   npx @randy888chan/stigmergy install
   ```
3. Start Stigmergy:
   ```bash
   npm run stigmergy:start
   ```
4. Configure Continue to use the MCP server at `./mcp-server.js`

### Roo Code Integration

1. Run the installation command:
   ```bash
   npx @randy888chan/stigmergy install
   ```
2. Start Stigmergy:
   ```bash
   npm run stigmergy:start
   ```
3. In Roo Code settings, configure the MCP server to use `./mcp-server.js`

### Other IDEs

Any IDE that supports the Model-Context Protocol can integrate with Stigmergy:

1. Install Stigmergy in your project:
   ```bash
   npx @randy888chan/stigmergy install
   ```
2. Start Stigmergy:
   ```bash
   npm run stigmergy:start
   ```
3. Configure your IDE's MCP settings to point to `./mcp-server.js`

## Using Stigmergy

### Starting the System

To start Stigmergy for your project:

```bash
npm run stigmergy:start
```

This command will:
- Start the Stigmergy server on port 3010
- Initialize all agents and services
- Make the system available through MCP

### Chat Commands

Once Stigmergy is running, you can use natural language commands through your IDE:

- `"setup neo4j"` - Configure Neo4j database
- `"index github repos"` - Build reference pattern library
- `"create authentication system"` - Generate authentication components
- `"health check"` - Run system diagnostics
- `"what can I do?"` - Get contextual suggestions

### CLI Commands

All Stigmergy functionality is available through CLI commands:

```bash
# System management
npx stigmergy start        # Start the system
npx stigmergy validate     # Validate system configuration
npx stigmergy restore      # Restore core files

# Installation
npx stigmergy install      # Install in current project
npx stigmergy mcp          # Install MCP server only

# Development tasks
npx stigmergy build        # Build web dashboard
```

## Project Integration

### Adding to Existing Projects

To add Stigmergy to an existing project:

1. Navigate to your project directory:
   ```bash
   cd /path/to/your/project
   ```

2. Install Stigmergy:
   ```bash
   npx @randy888chan/stigmergy install
   ```

3. Configure environment variables:
   ```bash
   cp .env.stigmergy.example .env
   # Edit .env to add your API keys
   ```

4. Start Stigmergy:
   ```bash
   npm run stigmergy:start
   ```

5. Configure your IDE to use the MCP server at `./mcp-server.js`

### Working with Multiple Projects

Stigmergy supports working with multiple projects simultaneously:

1. Install Stigmergy in each project:
   ```bash
   cd /project1
   npx @randy888chan/stigmergy install
   
   cd /project2
   npx @randy888chan/stigmergy install
   ```

2. Start Stigmergy for each project:
   ```bash
   # In project1 directory
   npm run stigmergy:start
   
   # In project2 directory
   npm run stigmergy:start
   ```

Each project will run on a different port (3011, 3012, etc.) automatically.

## Configuration

### Environment Variables

Stigmergy uses environment variables for configuration. After installation, you'll have a `.env.stigmergy.example` file that you can copy to `.env`:

```bash
cp .env.stigmergy.example .env
```

Key variables include:
- `GOOGLE_API_KEY` - Required for AI operations
- `GITHUB_TOKEN` - For indexing GitHub repositories
- `NEO4J_URI` - Database connection (optional)

### Custom Configuration

You can customize Stigmergy behavior by creating a `stigmergy.config.js` file in your project:

```javascript
export default {
  model_tiers: {
    reasoning_tier: {
      model_name: "gemini-2.0-flash-thinking-exp"
    },
    execution_tier: {
      model_name: "gemini-1.5-flash"
    }
  }
};
```

## Troubleshooting

### Common Issues

1. **MCP Server Not Connecting**
   - Ensure Stigmergy is running: `npm run stigmergy:start`
   - Check that the MCP server file exists: `ls mcp-server.js`
   - Verify port availability: `lsof -i :3010`

2. **API Key Issues**
   - Verify your `.env` file contains valid API keys
   - Check that the environment is loaded correctly

3. **Installation Problems**
   - Ensure Node.js 18+ is installed
   - Check npm permissions
   - Try running with `sudo` if permission errors occur

### Testing Integration

To test your IDE integration:

```bash
npm run mcp:test
```

This will verify that the MCP server is working correctly.

## Best Practices

1. **Start with Chat Commands**: Use natural language to explore Stigmergy's capabilities
2. **Index Relevant Repositories**: Build a library of reference patterns for your domain
3. **Use TDD Workflow**: Let Stigmergy enforce test-driven development
4. **Monitor System Status**: Use the dashboard or chat commands to check system health
5. **Customize Configuration**: Tailor model selection to your specific needs

## Conclusion

Stigmergy is now a fully self-contained development system that works independently of any specific IDE. With universal MCP integration, CLI access, and natural language interface, you can use Stigmergy with any development environment while enjoying its powerful autonomous development capabilities.