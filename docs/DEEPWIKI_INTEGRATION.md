# DeepWiki MCP Integration

This document describes the DeepWiki Model Context Protocol (MCP) integration in Stigmergy, which provides access to public repository documentation and AI-powered question answering capabilities.

## Overview

The DeepWiki MCP integration allows Stigmergy agents to access documentation and ask questions about GitHub repositories through the DeepWiki service. This integration enhances the context available to agents when working with open-source projects.

## Features

1. **Documentation Access**: Retrieve documentation structure and content for GitHub repositories
2. **AI-Powered Q&A**: Ask context-grounded questions about repositories
3. **Automatic Integration**: Lightweight Archon automatically gathers DeepWiki context for relevant queries
4. **Tool Executor Access**: Agents can directly call DeepWiki tools when they have proper permissions
5. **MCP Server Integration**: IDEs that support the Model Context Protocol can access DeepWiki tools

## Components

### 1. DeepWiki MCP Service (`services/deepwiki_mcp.js`)

The core service that communicates with the DeepWiki MCP server:

- `DeepWikiMCP` class for direct usage
- Convenience function `query_deepwiki` for simple queries
- Methods for structure retrieval, content access, and question answering

### 2. Lightweight Archon Enhancement (`services/lightweight_archon.js`)

Enhanced with automatic DeepWiki context gathering:

- Automatic GitHub repository extraction from queries
- DeepWiki context gathering for documentation and research queries
- Integration of DeepWiki insights into responses

### 3. Tool Executor Integration (`engine/tool_executor.js`)

The DeepWiki tool is available as `deepwiki.query` for agents with proper permissions.

### 4. MCP Server Integration (`mcp-server.js`)

Three new tools are available through the MCP server:

- `deepwiki_query`: Query DeepWiki for repository documentation and Q&A
- `deepwiki_structure`: Get documentation structure for repositories
- `deepwiki_contents`: Get specific documentation contents

## Usage Examples

### Direct Service Usage

```javascript
import { DeepWikiMCP } from './services/deepwiki_mcp.js';

const deepwiki = new DeepWikiMCP();

// Get documentation structure
const structure = await deepwiki.readWikiStructure('facebook/react');

// Get specific documentation content
const content = await deepwiki.readWikiContents('facebook/react', 'README.md');

// Ask a question
const answer = await deepwiki.askQuestion('facebook/react', 'How do I create a custom hook?');

// Perform a comprehensive search
const result = await deepwiki.comprehensiveSearch('facebook/react', 'State management patterns');
```

### Convenience Function

```javascript
import { query_deepwiki } from './services/deepwiki_mcp.js';

const result = await query_deepwiki({
  repository: 'microsoft/typescript',
  question: 'How do I set up a new project?'
});
```

### Lightweight Archon Integration

```javascript
import { LightweightArchon } from './services/lightweight_archon.js';

const archon = new LightweightArchon();
const result = await archon.query({
  query: 'How do I use github.com/facebook/react hooks?'
});
// The Archon will automatically gather context from DeepWiki
```

### Tool Executor Usage

Agents with proper permissions can call:

```
deepwiki.query({
  repository: 'facebook/react',
  question: 'How do I optimize performance?'
})
```

### MCP Server Usage

IDEs with MCP support can access these tools:

- `deepwiki_query`: Query DeepWiki for repository documentation and Q&A
- `deepwiki_structure`: Get documentation structure for repositories
- `deepwiki_contents`: Get specific documentation contents

## Configuration

The DeepWiki MCP integration uses the following default configuration:

- **Server URL**: `https://mcp.deepwiki.com`
- **Protocol**: `sse` (Server-Sent Events)
- **Endpoint Paths**: 
  - SSE: `/sse/tools/call`
  - MCP: `/mcp/tools/call`

Custom configuration can be provided when instantiating the `DeepWikiMCP` class:

```javascript
const deepwiki = new DeepWikiMCP({
  serverUrl: 'https://custom.deepwiki.com',
  protocol: 'mcp'  // or 'sse'
});
```

## Testing

To verify the integration is working correctly:

```bash
cd /path/to/stigmergy
node scripts/test-deepwiki.js
```

To see usage examples:

```bash
cd /path/to/stigmergy
node scripts/deepwiki-example.js
```

## Benefits

1. **Enhanced Documentation Access**: Agents can access official GitHub repository documentation
2. **Context-Grounded Answers**: Questions are answered with context from actual documentation
3. **Improved Research Capabilities**: The Lightweight Archon includes DeepWiki context for relevant queries
4. **IDE Integration**: MCP server exposes DeepWiki capabilities to compatible IDEs
5. **Flexible Tool Access**: Agents can access DeepWiki functionality through the tool executor

## Troubleshooting

If you encounter issues with the DeepWiki integration:

1. **Check Network Connectivity**: Ensure the system can reach `https://mcp.deepwiki.com`
2. **Verify Dependencies**: Make sure `axios` is installed (`npm install axios`)
3. **Check Permissions**: Ensure agents have proper permissions to use the `deepwiki.*` tools
4. **Review Logs**: Check console output for error messages

## Future Enhancements

Potential future improvements:

1. **Caching**: Implement caching for frequently accessed documentation
2. **Rate Limiting**: Add rate limiting to prevent overwhelming the DeepWiki server
3. **Offline Support**: Provide offline access to cached documentation
4. **Enhanced Error Handling**: Improve error handling and recovery mechanisms