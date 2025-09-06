#!/usr/bin/env node

// Test Roo Code connection to Stigmergy

import fs from 'fs';
import path from 'path';

async function testRooCodeConnection() {
  console.log('Testing Roo Code connection to Stigmergy...\n');
  
  try {
    // Check if Stigmergy is running
    console.log('1. Checking if Stigmergy is running...');
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execPromise = promisify(exec);
    
    try {
      const result = await execPromise('lsof -ti :3010');
      if (result.stdout.trim()) {
        console.log('✅ Stigmergy is running on port 3010');
      } else {
        console.log('❌ Stigmergy is not running on port 3010');
        console.log('   Please start Stigmergy with: npm run stigmergy:start');
        return;
      }
    } catch (error) {
      console.log('❌ Error checking if Stigmergy is running:', error.message);
      return;
    }
    
    // Check .roomodes file in gaming project
    console.log('\n2. Checking .roomodes file in gaming project...');
    const gamingRoomodesPath = path.join('/Users/user/Documents/GitHub/gaming', '.roomodes');
    
    if (fs.existsSync(gamingRoomodesPath)) {
      const roomodesContent = fs.readFileSync(gamingRoomodesPath, 'utf8');
      console.log('✅ .roomodes file found in gaming project');
      
      // Check if it's valid YAML
      try {
        const { default: yaml } = await import('js-yaml');
        const roomodesData = yaml.load(roomodesContent);
        
        if (roomodesData && roomodesData.customModes && Array.isArray(roomodesData.customModes)) {
          console.log('✅ .roomodes file is valid YAML');
          console.log('   - Found', roomodesData.customModes.length, 'agent mode(s)');
          
          const systemMode = roomodesData.customModes[0];
          console.log('   - Agent slug:', systemMode.slug);
          console.log('   - Agent name:', systemMode.name);
          console.log('   - Tools available:', systemMode.groups.join(', '));
        } else {
          console.log('❌ .roomodes file structure is incorrect');
        }
      } catch (error) {
        console.log('❌ Error parsing .roomodes file as YAML:', error.message);
      }
    } else {
      console.log('❌ .roomodes file not found in gaming project');
      console.log('   Please run: npx @randy888chan/stigmergy install in your gaming project directory');
    }
    
    // Check MCP server
    console.log('\n3. Checking MCP server...');
    const mcpServerPath = path.join('/Users/user/Documents/GitHub/Stigmergy', 'mcp-server.js');
    
    if (fs.existsSync(mcpServerPath)) {
      console.log('✅ MCP server file found');
    } else {
      console.log('❌ MCP server file not found');
    }
    
    // Check if we can connect to the Stigmergy API
    console.log('\n4. Testing connection to Stigmergy API...');
    try {
      const { default: fetch } = await import('node-fetch');
      const response = await fetch('http://localhost:3010/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: 'system',
          prompt: 'health check'
        })
      });
      
      if (response.ok) {
        console.log('✅ Successfully connected to Stigmergy API');
      } else {
        console.log('❌ Failed to connect to Stigmergy API:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ Error connecting to Stigmergy API:', error.message);
    }
    
    console.log('\n📋 Troubleshooting Tips:');
    console.log('1. Make sure Stigmergy is running: npm run stigmergy:start (in Stigmergy directory)');
    console.log('2. Verify .roomodes file exists in your gaming project');
    console.log('3. Configure MCP server in Roo Code settings:');
    console.log('   - Command: node');
    console.log('   - Arguments: ["/Users/user/Documents/GitHub/Stigmergy/mcp-server.js"]');
    console.log('   - Working Directory: /Users/user/Documents/GitHub/Stigmergy');
    console.log('4. Restart Roo Code after making configuration changes');
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.error(error);
  }
}

testRooCodeConnection().catch(console.error);