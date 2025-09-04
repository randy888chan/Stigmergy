import path from 'path';
import { fileURLToPath } from 'url';
import { setupMCPServer } from '../../scripts/setup-mcp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CLI command to set up MCP server integration
 */
export async function setupMCP(targetDir = process.cwd()) {
  console.log(`🔧 Setting up Stigmergy MCP server integration...`);
  
  try {
    const result = await setupMCPServer(targetDir);
    
    if (result.success) {
      console.log(`\n✅ MCP server setup completed successfully!`);
      console.log(`📁 Project: ${result.project}`);
      console.log(`📍 Location: ${result.location}`);
      console.log(`🔗 MCP Server: ${result.mcp_server}`);
      
      console.log(`\n🎯 Quick Start:`);
      console.log(`1. cd ${targetDir}`);
      console.log(`2. npm run stigmergy:start`);
      console.log(`3. Configure your IDE to use: ./mcp-server.js`);
      
      return true;
    } else {
      console.error(`❌ MCP setup failed: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ MCP setup error:`, error.message);
    return false;
  }
}