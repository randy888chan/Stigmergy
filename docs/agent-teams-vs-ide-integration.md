# Agent Teams vs IDE Integration - Clarification Guide

## Overview

There has been some confusion about the relationship between "agent teams" and IDE integration. This guide clarifies the difference and explains how each system works.

## Two Different Systems

### 1. Agent Teams (for Web UI Bundles)

**Purpose**: Agent teams are configurations used to build web-friendly agent bundles for ChatGPT/Claude/Gemini interfaces.

**Files**:
- Located in `.stigmergy-core/agent-teams/`
- YAML files like `team-all.yml`, `team-web-planners.yml`, etc.
- Used by the `npm run build` command

**Usage**:
```bash
npm run build  # Builds all agent teams into dist/ folder
```

**What they create**:
- Text bundles in `dist/` folder (e.g., `team-all.txt`)
- These bundles can be uploaded to ChatGPT/Claude as custom instructions
- Allow web-based AI to understand Stigmergy agent roles and workflows

**Example team structure**:
```yaml
bundle:
  name: "Team Web Planners"
  description: "Specialized team for web application planning"
  agents:
    - "dispatcher"
    - "analyst" 
    - "design-architect"
    - "ux-expert"
```

### 2. IDE Integration (for Roo Code)

**Purpose**: IDE integration connects Stigmergy to VS Code through Roo Code extension using MCP protocol.

**Files**:
- `.roomodes` (JSON agent configuration file in project root)
- `mcp-server.js` (MCP protocol server in Stigmergy directory)
- **Manual MCP server setup in Roo Code settings**

**Usage**:
```bash
# After installation + manual MCP setup, in Roo Code:
@system "create authentication system"
@system "setup neo4j"
@system "health check"
```

**What it creates**:
- Agent configuration in `.roomodes` (automatic)
- MCP server bridge (manual setup required)
- Real-time agent communication
- Access to all internal agents through @system gateway

**Configuration structure**:

`.roomodes` (auto-generated):
```json
{
  "agents": {
    "@system": {
      "name": "Stigmergy System Gateway",
      "tools": ["stigmergy_chat", "mcp_code_search"]
    }
  }
}
```

MCP Server (manual setup in Roo Code):
```json
{
  "stigmergy-chat": {
    "command": "node",
    "args": ["mcp-server.js"],
    "cwd": "/path/to/stigmergy"
  }
}
```

## Installation Process Fixed

### Before (Confusing)
- Installation asked users to "select agent teams for IDE"
- Created text-based `.roomodes` file with YAML filenames
- Agents didn't appear in Roo Code because format was wrong

### After (Correct)
- Installation automatically creates proper JSON `.roomodes` configuration
- No confusing team selection (teams are for web bundles only)
- @system agent appears immediately in Roo Code
- Clear instructions for usage

## How to Use Each System

### For Web UI Work (ChatGPT/Claude/Gemini)
1. Run `npm run build` in Stigmergy directory
2. Find agent bundles in `dist/` folder
3. Upload `team-web-planners.txt` (or other teams) to your preferred AI chat interface
4. Use the AI with Stigmergy agent knowledge for planning

### For IDE Work (VS Code + Roo Code)
1. Run `npx @randy888chan/stigmergy install` in your project
2. Copy `.env.stigmergy.example` to `.env` and configure API keys
3. Start Stigmergy: `npm run stigmergy:start` (in Stigmergy directory)
4. Open project in VS Code with Roo Code extension
5. Use @system agent: `@system "what can I do?"`

## Available Agents

### Through @system Gateway (IDE)
All internal agents are accessible through @system:
- `@dispatcher` - Orchestrates workflows
- `@analyst` - Research and analysis  
- `@dev` - Code implementation
- `@qa` - Quality assurance
- `@metis` - System optimization
- And many more...

### Through Web Bundles
Pre-configured teams for different use cases:
- **Team All**: Complete agent swarm
- **Team Web Planners**: Planning and design focused
- **Team Execution**: Implementation focused
- **Team Business Crew**: Business strategy focused
- **Team Maintenance**: Code maintenance focused

## Common Issues and Solutions

### "I don't see agents in Roo Code"
- Ensure Stigmergy is running: `npm run stigmergy:start`
- Check `.roomodes` file is JSON format (not text)
- Verify MCP server path points to Stigmergy directory
- Try: `@system "health check"`

### "Agent teams selection is confusing"
- Agent teams are for web UI bundles only
- IDE integration happens automatically
- You don't need to select teams for Roo Code

### "How do I know if it's working?"
```bash
# In Roo Code:
@system "what can I do?"
@system "health check"
@system "show available agents"
```

## Summary

- **Agent Teams** = Web UI bundles for ChatGPT/Claude/Gemini
- **IDE Integration** = Direct connection through @system agent in Roo Code
- **Installation** = Now automatically configures IDE integration correctly
- **No more confusion** = Clear separation of concerns

The installation process now creates the correct `.roomodes` configuration for immediate Roo Code integration, while agent teams remain available for building web UI bundles when needed.