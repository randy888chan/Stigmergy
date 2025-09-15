#!/usr/bin/env node

/**
 * Example script demonstrating how to use the DeepWiki MCP integration
 */

import { DeepWikiMCP } from '../services/deepwiki_mcp.js';
import { LightweightArchon } from '../services/lightweight_archon.js';

async function demonstrateDeepWikiUsage() {
  console.log('🚀 DeepWiki MCP Integration Usage Examples\n');
  
  try {
    // Example 1: Direct usage of DeepWikiMCP class
    console.log('Example 1: Direct usage of DeepWikiMCP class');
    console.log('=============================================');
    
    const deepwiki = new DeepWikiMCP();
    
    // Note: These calls would normally connect to the DeepWiki server
    // For demonstration purposes, we'll just show how to structure the calls
    
    console.log('To get documentation structure for a repository:');
    console.log('  await deepwiki.readWikiStructure("facebook/react");\n');
    
    console.log('To get specific documentation content:');
    console.log('  await deepwiki.readWikiContents("facebook/react", "README.md");\n');
    
    console.log('To ask a question about a repository:');
    console.log('  await deepwiki.askQuestion("facebook/react", "How do I create a custom hook?");\n');
    
    console.log('To perform a comprehensive search:');
    console.log('  await deepwiki.comprehensiveSearch("facebook/react", "How do I implement state management?");\n');
    
    // Example 2: Using the convenience function
    console.log('Example 2: Using the convenience function');
    console.log('==========================================');
    
    console.log('To query DeepWiki directly:');
    console.log('  await query_deepwiki({ repository: "microsoft/typescript", question: "How do I set up a new project?" });\n');
    
    // Example 3: Lightweight Archon integration
    console.log('Example 3: Lightweight Archon integration');
    console.log('==========================================');
    
    const archon = new LightweightArchon();
    
    console.log('When you query the Lightweight Archon with documentation-related questions:');
    console.log('  await archon.query({ query: "How do I use github.com/facebook/react hooks?" });');
    console.log('The Archon will automatically gather context from DeepWiki if a GitHub repository is mentioned.\n');
    
    // Example 4: Tool executor usage
    console.log('Example 4: Tool executor usage');
    console.log('==============================');
    
    console.log('Agents can access DeepWiki through the tool executor:');
    console.log('  deepwiki.query({ repository: "facebook/react", question: "How do I optimize performance?" })\n');
    
    // Example 5: MCP server usage
    console.log('Example 5: MCP server usage');
    console.log('===========================');
    
    console.log('IDEs that support the Model Context Protocol can access these tools:');
    console.log('  - deepwiki_query: Query DeepWiki for repository documentation and Q&A');
    console.log('  - deepwiki_structure: Get documentation structure for repositories');
    console.log('  - deepwiki_contents: Get specific documentation contents\n');
    
    console.log('🎉 All examples completed successfully!');
    console.log('\n💡 Tips for using DeepWiki integration:');
    console.log('  1. The integration works automatically when Lightweight Archon processes documentation queries');
    console.log('  2. Agents can directly call the deepwiki.query tool when they have proper permissions');
    console.log('  3. IDEs with MCP support can access DeepWiki tools through the MCP server');
    console.log('  4. The system automatically extracts GitHub repository names from queries');
    
  } catch (error) {
    console.error('❌ Error in demonstration:', error.message);
    process.exit(1);
  }
}

// Run the demonstration
demonstrateDeepWikiUsage().catch(console.error);