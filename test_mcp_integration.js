#!/usr/bin/env node

import { Engine } from './engine/server.js';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function testMCPIntegration() {
  console.log('Testing MCP Integration...\n');
  
  // Test 1: Check if MCP server starts correctly
  console.log('Test 1: Starting MCP Server...');
  try {
    const mcpProcess = spawn('node', ['mcp-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let serverStarted = false;
    let serverOutput = '';
    
    mcpProcess.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      if (output.includes('Stigmergy Code Search MCP Server started')) {
        serverStarted = true;
      }
    });
    
    mcpProcess.stderr.on('data', (data) => {
      console.error('MCP Server Error:', data.toString());
    });
    
    // Wait for 5 seconds to see if server starts
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    if (serverStarted) {
      console.log('✅ Test 1 PASSED: MCP Server started successfully');
    } else {
      console.log('❌ Test 1 FAILED: MCP Server did not start properly');
      console.log('Server output:', serverOutput);
    }
    
    // Kill the process
    mcpProcess.kill();
  } catch (error) {
    console.log('❌ Test 1 FAILED: Error starting MCP Server');
    console.error(error);
  }
  
  // Test 2: Check if engine initializes correctly
  console.log('\nTest 2: Initializing Stigmergy Engine...');
  try {
    const engine = new Engine();
    const success = await engine.initialize();
    
    if (success) {
      console.log('✅ Test 2 PASSED: Engine initialized successfully');
    } else {
      console.log('❌ Test 2 FAILED: Engine initialization failed');
    }
  } catch (error) {
    console.log('❌ Test 2 FAILED: Error initializing engine');
    console.error(error);
  }
  
  // Test 3: Check agent definitions
  console.log('\nTest 3: Checking agent definitions...');
  try {
    const systemAgentPath = path.join('.stigmergy-core', 'agents', 'system.md');
    const dispatcherAgentPath = path.join('.stigmergy-core', 'agents', 'dispatcher.md');
    
    if (fs.existsSync(systemAgentPath) && fs.existsSync(dispatcherAgentPath)) {
      console.log('✅ Test 3 PASSED: Agent definitions found');
    } else {
      console.log('❌ Test 3 FAILED: Agent definitions missing');
    }
  } catch (error) {
    console.log('❌ Test 3 FAILED: Error checking agent definitions');
    console.error(error);
  }
  
  // Test 4: Check tool permissions
  console.log('\nTest 4: Testing tool permissions...');
  try {
    // This would require importing the tool executor and testing it
    // For now, we'll just check if the file exists
    const toolExecutorPath = path.join('engine', 'tool_executor.js');
    if (fs.existsSync(toolExecutorPath)) {
      console.log('✅ Test 4 PASSED: Tool executor found');
    } else {
      console.log('❌ Test 4 FAILED: Tool executor missing');
    }
  } catch (error) {
    console.log('❌ Test 4 FAILED: Error testing tool permissions');
    console.error(error);
  }
  
  console.log('\nMCP Integration Test Complete!');
}

// Run the test
testMCPIntegration().catch(console.error);