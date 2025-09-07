#!/usr/bin/env node

// Test agent job passing functionality

import { Engine } from './engine/server.js';
import fs from 'fs';
import path from 'path';

async function testAgentJobPassing() {
  console.log('Testing agent job passing functionality...\n');
  
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
    
    // Test 1: Check if system agent can be loaded
    console.log('\nTest 1: Loading system agent...');
    try {
      const systemAgent = engine.getAgent('system');
      console.log('✅ System agent loaded successfully');
      console.log('   - Agent ID:', systemAgent.id);
      console.log('   - Model Tier:', systemAgent.modelTier);
    } catch (error) {
      console.log('❌ Error loading system agent:', error.message);
      return;
    }
    
    // Test 2: Check if dispatcher agent can be loaded
    console.log('\nTest 2: Loading dispatcher agent...');
    try {
      const dispatcherAgent = engine.getAgent('dispatcher');
      console.log('✅ Dispatcher agent loaded successfully');
      console.log('   - Agent ID:', dispatcherAgent.id);
      console.log('   - Model Tier:', dispatcherAgent.modelTier);
    } catch (error) {
      console.log('❌ Error loading dispatcher agent:', error.message);
      return;
    }
    
    // Test 3: Check system agent permissions
    console.log('\nTest 3: Checking system agent permissions...');
    try {
      const systemAgentPath = path.join('.stigmergy-core', 'agents', 'system.md');
      const systemAgentContent = fs.readFileSync(systemAgentPath, 'utf8');
      
      if (systemAgentContent.includes('stigmergy.task')) {
        console.log('✅ System agent has stigmergy.task permission');
      } else {
        console.log('❌ System agent missing stigmergy.task permission');
      }
      
      if (systemAgentContent.includes('system.*')) {
        console.log('✅ System agent has system.* permission');
      } else {
        console.log('❌ System agent missing system.* permission');
      }
    } catch (error) {
      console.log('❌ Error checking system agent permissions:', error.message);
      return;
    }
    
    // Test 4: Check dispatcher agent permissions
    console.log('\nTest 4: Checking dispatcher agent permissions...');
    try {
      const dispatcherAgentPath = path.join('.stigmergy-core', 'agents', 'dispatcher.md');
      const dispatcherAgentContent = fs.readFileSync(dispatcherAgentPath, 'utf8');
      
      if (dispatcherAgentContent.includes('swarm_intelligence.*')) {
        console.log('✅ Dispatcher agent has swarm_intelligence.* permission');
      } else {
        console.log('❌ Dispatcher agent missing swarm_intelligence.* permission');
      }
    } catch (error) {
      console.log('❌ Error checking dispatcher agent permissions:', error.message);
      return;
    }
    
    // Test 5: Test stigmergy.task tool execution
    console.log('\nTest 5: Testing stigmergy.task tool execution...');
    try {
      // Create a mock executor
      const executeTool = engine.executeTool;
      
      // Try to execute a simple stigmergy.task call
      const result = await executeTool(
        'stigmergy.task',
        {
          subagent_type: 'dispatcher',
          description: 'Test task for verification'
        },
        'system'
      );
      
      console.log('✅ stigmergy.task executed successfully');
      console.log('   - Result:', result.substring(0, 100) + '...');
    } catch (error) {
      console.log('❌ Error executing stigmergy.task:', error.message);
      console.error('   - Full error:', error);
      return;
    }
    
    console.log('\n🎉 All agent job passing tests completed!');
    console.log('\nThe system should now be able to:');
    console.log('- Load system and dispatcher agents');
    console.log('- Verify agent permissions');
    console.log('- Execute stigmergy.task to pass jobs between agents');
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.error(error);
  }
}

testAgentJobPassing().catch(console.error);