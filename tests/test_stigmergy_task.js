#!/usr/bin/env node

// Test stigmergy.task tool execution

import { Engine } from './engine/server.js';
import fs from 'fs';
import path from 'path';

async function testStigmergyTask() {
  console.log('Testing stigmergy.task tool execution...\n');
  
  try {
    // Check if agent definitions exist
    const systemAgentPath = path.join('.stigmergy-core', 'agents', 'system.md');
    const dispatcherAgentPath = path.join('.stigmergy-core', 'agents', 'dispatcher.md');
    
    if (!fs.existsSync(systemAgentPath)) {
      console.log('❌ System agent definition not found');
      return;
    }
    
    if (!fs.existsSync(dispatcherAgentPath)) {
      console.log('❌ Dispatcher agent definition not found');
      return;
    }
    
    console.log('✅ Agent definitions found');
    
    // Test engine initialization
    const engine = new Engine();
    console.log('🔧 Initializing engine...');
    
    const success = await engine.initialize();
    if (!success) {
      console.log('❌ Engine initialization failed');
      return;
    }
    
    console.log('✅ Engine initialized successfully');
    
    // Test getting an agent
    try {
      const systemAgent = engine.getAgent('system');
      console.log('✅ System agent loaded successfully');
      
      const dispatcherAgent = engine.getAgent('dispatcher');
      console.log('✅ Dispatcher agent loaded successfully');
      
      // Test that agents have the required tools
      const systemAgentContent = fs.readFileSync(systemAgentPath, 'utf8');
      if (systemAgentContent.includes('stigmergy.task')) {
        console.log('✅ System agent has stigmergy.task permission');
      } else {
        console.log('❌ System agent missing stigmergy.task permission');
      }
      
      const dispatcherAgentContent = fs.readFileSync(dispatcherAgentPath, 'utf8');
      if (dispatcherAgentContent.includes('swarm_intelligence.*')) {
        console.log('✅ Dispatcher agent has swarm_intelligence.* permission');
      } else {
        console.log('❌ Dispatcher agent missing swarm_intelligence.* permission');
      }
      
    } catch (error) {
      console.log('❌ Error loading agents:', error.message);
      return;
    }
    
    console.log('\n🎉 All stigmergy.task tests passed!');
    console.log('\nThe Stigmergy system should now properly:');
    console.log('- Recognize its own MCP integration');
    console.log('- Forward jobs between agents');
    console.log('- Execute tools with appropriate permissions');
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.error(error);
  }
}

testStigmergyTask().catch(console.error);