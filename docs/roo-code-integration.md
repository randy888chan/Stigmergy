# Roo Code Integration Guide

## 🚀 Quick Setup for Roo Code Integration

This guide helps you integrate Stigmergy with Roo Code for seamless AI-powered development. Note that Stigmergy also supports VS Code and other IDEs through the same universal MCP integration.

### Step 1: Install Roo Code Extension
1. Open VS Code
2. Install the "Roo Code" extension from the marketplace
3. Restart VS Code

### Step 2: Install Stigmergy Globally

```bash
npm install -g @randy888chan/stigmergy
```

### Step 3: Start the Global Stigmergy Service

```bash
stigmergy start-service
```

### Step 4: Configure MCP Server in Roo Code

**Important**: MCP server configuration is separate from agent configuration and must be done manually in Roo Code settings.

Quick summary:
1. Open Roo Code settings in VS Code
2. Add MCP server configuration:

```json
{
  "stigmergy-chat": {
    "command": "node",
    "args": ["mcp-server.js"],
    "cwd": "/usr/local/lib/node_modules/@randy888chan/stigmergy",
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

3. Adjust the `cwd` path to match your global Stigmergy installation
4. Restart VS Code

### Step 5: Initialize Stigmergy in Your Project

```bash
cd /path/to/your/project
stigmergy init
```

### Step 6: Test the Integration

In Roo Code, try these commands:
- "help me get started"
- "setup everything I need"
- "what can I do?"
- "health check"

## 💬 Available Chat Commands

### 🔧 Setup & Configuration
```
"setup neo4j"              # Configure database
"configure environment"     # Setup API keys
"install dependencies"      # Install npm packages
"health check"             # System diagnostics
```

### 📚 Reference Pattern Management
```
"index github repos"        # Build reference library
"scan local codebase"       # Index current project
"update patterns"           # Refresh pattern database
```

### 🛠️ Development Tasks
```
"create authentication system"     # Build secure auth
"implement JWT middleware"         # Specific components
"create REST API for users"       # Full system components
"optimize database queries"       # Performance improvements
```

### 📊 System Management
```
"validate system"          # Check configuration
"show status"             # Current system state
"restart services"        # System restart
```

## 🎯 Features You Get

✅ **Natural Language Interface**: Chat naturally with @system agent instead of learning CLI commands
✅ **Universal Gateway**: The @system agent routes all requests to appropriate internal agents
✅ **Real-time Progress**: See progress updates and file changes in real-time
✅ **Intelligent Suggestions**: Get contextual command suggestions based on system state
✅ **Reference-First Development**: Leverage proven patterns from GitHub repositories
✅ **Quality Assurance**: Built-in TDD enforcement with 80% coverage requirements
✅ **Static Analysis**: Automatic ESLint checking with comprehensive rule sets
✅ **Multi-Agent Routing**: Automatic task routing to optimal execution agents (@dev, @qa, etc.)
✅ **Flexible LLM Configuration**: Choose between Google AI, OpenRouter, or local providers
✅ **Self-Improvement Loop**: @metis agent continuously optimizes system performance

### 🧠 Agent Architecture

Stigmergy uses a sophisticated multi-agent system:

- **@system**: Universal gateway for all IDE interactions
- **@dispatcher**: Orchestrates system-wide workflows 
- **@analyst**: Performs research and market analysis
- **@dev**: Executes development tasks with TDD enforcement
- **@qa**: Quality assurance with comprehensive testing
- **@metis**: Continuous system improvement and optimization
- **@reference-architect**: Manages code patterns and architecture decisions

### 🔧 Provider Flexibility

Configure your preferred AI providers in `.env`:

```bash
# Choose providers for different tiers
REASONING_PROVIDER=google     # or 'openrouter'
EXECUTION_PROVIDER=google     # or 'openrouter'

# Provider API keys
GOOGLE_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
```

## 🔍 Troubleshooting

### Connection Issues
1. Ensure Stigmergy is running: `npm run stigmergy:start`
2. Check the MCP server path in `.roomodes`
3. Verify Node.js version (18+ required)

### API Key Issues
1. Copy `.env.example` to `.env`
2. Add your OpenRouter API key
3. Run `npm run health-check` to verify

### Agent Not Responding
1. Check system status: "health check"
2. Restart system: "restart services"
3. Validate configuration: "validate system"

## 📈 Pro Tips

1. **Start with Setup**: Use "help me get started" for guided setup
2. **Use Natural Language**: Commands like "create a login system" work great
3. **Check Status Often**: Use "what can I do?" to see available options
4. **Build Reference Library**: Run "index github repos" for better code patterns
5. **Monitor Progress**: All commands provide real-time progress updates

## 🔄 Multi-IDE Support

Stigmergy now supports multiple IDEs through universal MCP integration:
- **Roo Code**: Native integration with automatic setup
- **VS Code**: Integration through Continue extension - see [VSCODE_SETUP.md](../VSCODE_SETUP.md)
- **Other IDEs**: Any IDE supporting MCP protocol

The same installation and setup process works for all IDEs.

## 🆘 Getting Help

In Roo Code, simply ask:
- "what can I do?"
- "help me get started"
- "show me available commands"
- "what's my system status?"

---

Happy coding with Stigmergy + Roo Code! 🚀