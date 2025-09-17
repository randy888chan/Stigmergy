# 🤖 Stigmergy Universal MCP Integration

This guide explains how to set up Stigmergy integration for **any project** without requiring manual configuration edits. Works with VS Code, Roo Code, and any IDE that supports the Model-Context Protocol.

## 🚀 Quick Setup

### Option 1: Global Installation (Recommended)

1. **Install Stigmergy globally**:
   ```bash
   npm install -g @randy888chan/stigmergy
   ```

2. **Initialize Stigmergy in your project**:
   ```bash
   cd /path/to/your/project
   stigmergy init
   ```

3. **Start the global Stigmergy service**:
   ```bash
   stigmergy start-service
   ```

4. **Configure your IDE** MCP server to point to the global Stigmergy installation
   - For Roo Code: Point MCP server to the global Stigmergy installation
   - For VS Code: See [VSCODE_SETUP.md](../VSCODE_SETUP.md) for detailed instructions

That's it! 🎉

### Option 2: Project Initialization Only

If you already have Stigmergy installed globally and just need to initialize it in a project:

```bash
stigmergy init
```

Or for a specific project:
```bash
stigmergy init --project /path/to/project
```

### Option 3: Manual Setup (Legacy)

For advanced users who prefer manual control:

## 🔧 CLI Commands

### Installation Commands
```bash
# Global installation (one-time setup)
npm install -g @randy888chan/stigmergy

# Initialize Stigmergy in a project directory (lightweight)
stigmergy init

# Interactive initialization with guided setup
stigmergy init --interactive

# Setup MCP server for specific project
stigmergy mcp --project /path/to/project

# Setup MCP server in current directory
stigmergy mcp
```

### Management Commands
```bash
# Start Stigmergy (auto-added to package.json)
npm run stigmergy:start

# Stop Stigmergy
npm run stigmergy:stop

# Test MCP server
npm run mcp:test

# Validate entire system
npx @randy888chan/stigmergy validate
```

## 📁 What Gets Created

The setup automatically creates:

- **`mcp-server.js`** - Universal MCP server that auto-detects project context
- **`.env.stigmergy.example`** - Project-specific configuration template  
- **npm scripts** - Convenient commands for Stigmergy management
- **README section** - Integration documentation

## 🌐 How It Works

### Universal Compatibility
- **Auto-detection**: Automatically detects project name, type, and location
- **Smart routing**: Uses port 3011 for projects, 3010 for main Stigmergy
- **Environment inheritance**: Inherits from global Stigmergy config with project overrides
- **Zero config**: Works out-of-box without manual edits
- **Multi-IDE Support**: Works with VS Code, Roo Code, and any MCP-compatible IDE

### Architecture
```
IDE (VS Code, Roo Code, etc.)
    ↓ (MCP Protocol)
Project MCP Server (./mcp-server.js)
    ↓ (HTTP API)
Stigmergy Engine (localhost:3011)
    ↓ (Agent Coordination)
Specialized AI Agents
```

## 🔍 Troubleshooting

### Check Stigmergy Status
```bash
npm run stigmergy:start  # Start Stigmergy
curl http://localhost:3011  # Test API (projects)
curl http://localhost:3010  # Test API (main Stigmergy)
```

### Test MCP Server
```bash
npm run mcp:test
```

### Common Issues

1. **Port conflicts**: Stigmergy uses intelligent port selection (3010/3011)
2. **Missing environment**: Ensure global Stigmergy is configured with `stigmergy init`
3. **Connection failed**: Verify Stigmergy is running with `stigmergy start-service`

## 📊 Validation

Run comprehensive validation to ensure everything works:

```bash
cd /Users/user/Documents/GitHub/Stigmergy
npm run validate:comprehensive
```

## 🎯 Usage Examples

Once set up, use these commands in your IDE through MCP:

- **"Analyze project structure"** - Get comprehensive project analysis
- **"Enrich documentation"** - Improve project documentation
- **"Coordinate development tasks"** - AI-powered task coordination  
- **"Review and optimize code"** - Code quality improvements

## ✨ Benefits

- ✅ **Universal**: Works in any project without manual config
- ✅ **Zero maintenance**: Auto-updating, self-configuring
- ✅ **Smart coordination**: Intelligent agent delegation
- ✅ **IDE integration**: Seamless integration with VS Code, Roo Code, and other IDEs
- ✅ **Environment inheritance**: Global + project-specific settings
- ✅ **Robust error handling**: Graceful fallbacks and debugging info
- ✅ **Multi-IDE support**: Works with any IDE supporting MCP protocol

---

**Note**: This replaces project-specific MCP servers. You can safely delete any manually created `mcp-server.js` files from individual projects and use this universal approach instead.