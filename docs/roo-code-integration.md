# Roo Code Integration Guide

## 🚀 Quick Setup for Roo Code Integration

This guide helps you integrate Stigmergy with Roo Code for seamless AI-powered development.

### Step 1: Install Roo Code Extension
1. Open VS Code
2. Install the "Roo Code" extension from the marketplace
3. Restart VS Code

### Step 2: Configure MCP Server

Add this to your `.roomodes` file in your project root:

```json
{
  "mcpServers": {
    "stigmergy-chat": {
      "command": "node",
      "args": ["mcp-server.js"],
      "cwd": "/path/to/your/stigmergy/project",
      "env": {
        "NODE_ENV": "production"
      }
    }
  },
  "agents": {
    "@stigmergy": {
      "name": "Stigmergy Assistant",
      "description": "AI-powered development system with chat interface",
      "systemPrompt": "You are Stigmergy, an autonomous AI development system. Use the chat interface to help users with setup, development, and system management through natural language commands.",
      "tools": ["chat_interface.*", "mcp_code_search", "mcp_symbol_lookup"],
      "model": "gpt-4"
    }
  }
}
```

### Step 3: Start Stigmergy System

```bash
cd /path/to/your/stigmergy/project
npm run stigmergy:start
```

### Step 4: Test the Integration

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

✅ **Natural Language Interface**: Chat naturally instead of learning CLI commands
✅ **Real-time Progress**: See progress updates and file changes in real-time
✅ **Intelligent Suggestions**: Get contextual command suggestions
✅ **Reference-First Development**: Leverage proven patterns from GitHub
✅ **Quality Assurance**: Built-in TDD enforcement and static analysis
✅ **Multi-Agent Routing**: Automatic task routing to optimal execution agents

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

## 🆘 Getting Help

In Roo Code, simply ask:
- "what can I do?"
- "help me get started"
- "show me available commands"
- "what's my system status?"

---

Happy coding with Stigmergy + Roo Code! 🚀