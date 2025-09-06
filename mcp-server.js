#!/usr/bin/env node
import { MCPCodeSearch } from './tools/mcp_code_search.js';
import { CodeRAGIntegration } from './services/coderag_integration.js';
import { LightweightArchon } from './services/lightweight_archon.js';
import { process_chat_command, get_command_suggestions } from './tools/chat_interface.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Define __dirname for ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const codeSearch = new MCPCodeSearch();
const coderag = new CodeRAGIntegration();
const archon = new LightweightArchon();

const server = {
  name: "stigmergy-code-search",
  version: "1.0.0",
  
  async listTools() {
    return [
      {
        name: "stigmergy_chat",
        description: "Process natural language commands through Stigmergy chat interface",
        inputSchema: {
          type: "object",
          properties: {
            command: { type: "string", description: "Natural language command" },
            context: { type: "string", description: "Additional context" },
            user_preferences: { type: "object", description: "User preferences" }
          },
          required: ["command"]
        }
      },
      {
        name: "stigmergy_suggestions",
        description: "Get contextual command suggestions from Stigmergy",
        inputSchema: {
          type: "object",
          properties: {
            current_context: { type: "string", description: "Current context" },
            user_history: { type: "array", description: "User command history" }
          }
        }
      },
      {
        name: "mcp_code_search",
        description: "Search code using semantic and symbol search",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            context: { type: "object", description: "Additional context" }
          },
          required: ["query"]
        }
      },
      {
        name: "mcp_symbol_lookup", 
        description: "Look up specific symbols in codebase",
        inputSchema: {
          type: "object",
          properties: {
            symbol: { type: "string", description: "Symbol name to search" }
          },
          required: ["symbol"]
        }
      },
      {
        name: "initialize_coderag",
        description: "Initialize CodeRAG for the current project",
        inputSchema: {
          type: "object",
          properties: {
            projectPath: { type: "string", description: "Project path to index" }
          }
        }
      },
      {
        name: "lightweight_archon_query",
        description: "Query the lightweight Archon for enhanced context",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Query for Archon" },
            options: { type: "object", description: "Query options" }
          },
          required: ["query"]
        }
      }
    ];
  },

  async callTool(name, args) {
    try {
      switch (name) {
        case "stigmergy_chat":
          return await process_chat_command({
            command: args.command,
            context: args.context || '',
            user_preferences: args.user_preferences || {},
            source: 'roo_code'
          });
        
        case "stigmergy_suggestions":
          return await get_command_suggestions({
            current_context: args.current_context || '',
            user_history: args.user_history || [],
            source: 'roo_code'
          });
        
        case "mcp_code_search":
          return await codeSearch.handleCodeSearch(args.query, args.context);
        
        case "mcp_symbol_lookup":
          return await codeSearch.symbolSearch(args.symbol);
        
        case "initialize_coderag":
          return await coderag.initializeCodeRAG(args.projectPath || process.cwd());
        
        case "lightweight_archon_query":
          return await archon.query({ query: args.query, options: args.options || {} });
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      console.error(`Error in ${name}:`, error);
      throw error;
    }
  }
};

// Handle MCP protocol messages
process.stdin.on('data', async (data) => {
  try {
    const message = JSON.parse(data.toString());
    let response;

    switch (message.method) {
      case 'initialize':
        response = {
          jsonrpc: "2.0",
          id: message.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { 
              name: server.name, 
              version: server.version,
              description: "Stigmergy Code Search MCP Server"
            }
          }
        };
        break;

      case 'tools/list':
        response = {
          jsonrpc: "2.0",
          id: message.id,
          result: {
            tools: await server.listTools()
          }
        };
        break;

      case 'tools/call':
        const result = await server.callTool(message.params.name, message.params.arguments);
        response = {
          jsonrpc: "2.0",
          id: message.id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          }
        };
        break;

      default:
        response = {
          jsonrpc: "2.0",
          id: message.id,
          error: {
            code: -32601,
            message: "Method not found"
          }
        };
    }

    process.stdout.write(JSON.stringify(response) + '\n');
  } catch (error) {
    const errorResponse = {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32603,
        message: "Internal error",
        data: error.message
      }
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
  }
});

console.error("Stigmergy Code Search MCP Server started");