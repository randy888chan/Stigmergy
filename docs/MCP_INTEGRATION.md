# 🤖 Stigmergy Universal MCP Integration

This guide explains how to set up Stigmergy integration for **any project** without requiring manual configuration edits.

## 🚀 Quick Setup

### Option 1: Full Installation with MCP (Recommended)

1. **Install Stigmergy with MCP integration**:
   ```bash
   npx @randy888chan/stigmergy install --with-mcp
   ```
   
   Or install everything by default:
   ```bash
   npx @randy888chan/stigmergy install
   ```

2. **Start Stigmergy**:
   ```bash
   npm run stigmergy:start
   ```

3. **Configure Roo Code** MCP server to point to: `./mcp-server.js`

That's it! 🎉

### Option 2: MCP Server Only

If you already have Stigmergy core installed and just need MCP integration:

```bash
npx @randy888chan/stigmergy mcp
```

Or for a specific project:
```bash
npx @randy888chan/stigmergy mcp --project /path/to/project
```

### Option 3: Manual Setup (Legacy)

For advanced users who prefer manual control:

## 🔧 CLI Commands

### Installation Commands
```bash
# Full installation with MCP (default)
npx @randy888chan/stigmergy install

# Full installation with explicit MCP setup  
npx @randy888chan/stigmergy install --with-mcp

# Install only MCP server (if core already exists)
npx @randy888chan/stigmergy install --mcp-only

# Install MCP server for specific project
npx @randy888chan/stigmergy mcp --project /path/to/project

# Install MCP server in current directory
npx @randy888chan/stigmergy mcp
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

### Architecture
```
Roo Code IDE
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
2. **Missing environment**: Ensure global Stigmergy is configured with `stigmergy install`
3. **Connection failed**: Verify Stigmergy is running with `npm run stigmergy:start`

## 📊 Validation

Run comprehensive validation to ensure everything works:

```bash
cd /Users/user/Documents/GitHub/Stigmergy
npm run validate:comprehensive
```

## 🎯 Usage Examples

Once set up, use these commands in Roo Code through MCP:

- **"Analyze project structure"** - Get comprehensive project analysis
- **"Enrich documentation"** - Improve project documentation
- **"Coordinate development tasks"** - AI-powered task coordination  
- **"Review and optimize code"** - Code quality improvements

## ✨ Benefits

- ✅ **Universal**: Works in any project without manual config
- ✅ **Zero maintenance**: Auto-updating, self-configuring
- ✅ **Smart coordination**: Intelligent agent delegation
- ✅ **IDE integration**: Seamless Roo Code workflow
- ✅ **Environment inheritance**: Global + project-specific settings
- ✅ **Robust error handling**: Graceful fallbacks and debugging info

---

**Note**: This replaces project-specific MCP servers. You can safely delete any manually created `mcp-server.js` files from individual projects and use this universal approach instead.