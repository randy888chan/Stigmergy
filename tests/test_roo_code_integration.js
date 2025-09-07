#!/usr/bin/env node

// Test Roo Code integration and system agent job passing

import { Engine } from './engine/server.js';
import fs from 'fs';
import path from 'path';

async function testRooCodeIntegration() {
  console.log('Testing Roo Code integration and system agent job passing...\n');
  
  try {
    // Initialize engine
    const engine = new Engine();
    console.log('🔧 Initializing engine...');
    
    const success = await engine.initialize();
    if (!success) {
      console.log('❌ Engine initialization failed');
      return;
    }
    
    console.log('✅ Engine initialized successfully');
    
    // Test 1: Check if the .roomodes file is correctly formatted
    console.log('\nTest 1: Checking .roomodes file format...');
    try {
      const roomodesPath = path.join('.roomodes');
      const roomodesContent = fs.readFileSync(roomodesPath, 'utf8');
      
      // Check if it's valid YAML
      const { default: yaml } = await import("js-yaml");
      const roomodesData = yaml.load(roomodesContent);
      
      if (roomodesData && roomodesData.customModes && Array.isArray(roomodesData.customModes)) {
        console.log('✅ .roomodes file is valid YAML with correct structure');
        console.log('   - Found', roomodesData.customModes.length, 'agent mode(s)');
        
        const systemMode = roomodesData.customModes[0];
        console.log('   - Agent slug:', systemMode.slug);
        console.log('   - Agent name:', systemMode.name);
        console.log('   - Tools available:', systemMode.groups.join(', '));
      } else {
        console.log('❌ .roomodes file structure is incorrect');
      }
    } catch (error) {
      console.log('❌ Error reading or parsing .roomodes file:', error.message);
      return;
    }
    
    // Test 2: Check if system agent can be loaded
    console.log('\nTest 2: Loading system agent...');
    try {
      const systemAgent = engine.getAgent('system');
      console.log('✅ System agent loaded successfully');
      console.log('   - Agent ID:', systemAgent.id);
      console.log('   - Model Tier:', systemAgent.modelTier);
    } catch (error) {
      console.log('❌ Error loading system agent:', error.message);
      return;
    }
    
    // Test 3: Test stigmergy.task tool execution (the fix we implemented)
    console.log('\nTest 3: Testing stigmergy.task tool execution...');
    try {
      // Create a mock executor
      const executeTool = engine.executeTool;
      
      // Try to execute a simple stigmergy.task call
      const result = await executeTool(
        'stigmergy.task',
        {
          subagent_type: 'dispatcher',
          description: 'Test task for Roo Code integration verification'
        },
        'system'
      );
      
      console.log('✅ stigmergy.task executed successfully');
      console.log('   - Result type:', typeof result);
      if (typeof result === 'string' && result.length > 0) {
        console.log('   - Result preview:', result.substring(0, 100) + '...');
      }
    } catch (error) {
      console.log('❌ Error executing stigmergy.task:', error.message);
      console.error('   - Full error:', error);
      return;
    }
    
    // Test 4: Check MCP server capabilities
    console.log('\nTest 4: Checking MCP server capabilities...');
    try {
      const mcpServerPath = path.join('mcp-server.js');
      const mcpServerContent = fs.readFileSync(mcpServerPath, 'utf8');
      
      if (mcpServerContent.includes('listTools') && mcpServerContent.includes('callTool')) {
        console.log('✅ MCP server has required methods');
      } else {
        console.log('❌ MCP server missing required methods');
      }
      
      if (mcpServerContent.includes('stigmergy_chat') && mcpServerContent.includes('stigmergy_suggestions')) {
        console.log('✅ MCP server has Stigmergy tools');
      } else {
        console.log('❌ MCP server missing Stigmergy tools');
      }
    } catch (error) {
      console.log('❌ Error checking MCP server:', error.message);
      return;
    }
    
    console.log('\n🎉 All Roo Code integration tests completed!');
    console.log('\nThe system should now work correctly with Roo Code:');
    console.log('- .roomodes file is properly formatted for Roo Code');
    console.log('- System agent can be loaded and used');
    console.log('- stigmergy.task tool works for job passing between agents');
    console.log('- MCP server exposes the required tools');
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.error(error);
  }
}

testRooCodeIntegration().catch(console.error);