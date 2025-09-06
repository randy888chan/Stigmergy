#!/usr/bin/env node

// Debug stigmergy.task tool execution

import { Engine } from './engine/server.js';
import fs from 'fs';
import path from 'path';

async function debugStigmergyTask() {
  console.log('Debugging stigmergy.task tool execution...\n');
  
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
    
    // Test the stigmergy.task tool directly
    console.log('\nTesting stigmergy.task tool directly...');
    
    // Mock the toolbelt stigmergy.task function to see what's happening
    const mockStigmergyTask = async ({ subagent_type, description }) => {
      console.log('   🔄 stigmergy.task called with:');
      console.log('      - subagent_type:', subagent_type);
      console.log('      - description:', description);
      
      if (!subagent_type || !description) {
        throw new Error("The 'subagent_type' and 'description' are required for stigmergy.task");
      }
      
      console.log('   🔄 Calling engine.getAgent to get agent object for:', subagent_type);
      try {
        const agent = engine.getAgent(subagent_type);
        console.log('   🔄 Calling engine.triggerAgent with agent:', agent.id);
        const result = await engine.triggerAgent(agent, description);
        console.log('   ✅ engine.triggerAgent returned successfully');
        return result;
      } catch (error) {
        console.log('   ❌ engine.triggerAgent failed with error:', error.message);
        throw error;
      }
    };
    
    // Test with dispatcher agent
    console.log('\nTest 1: Calling stigmergy.task with dispatcher agent...');
    try {
      const result = await mockStigmergyTask({
        subagent_type: 'dispatcher',
        description: 'Test task for debugging'
      });
      console.log('✅ stigmergy.task with dispatcher succeeded');
    } catch (error) {
      console.log('❌ stigmergy.task with dispatcher failed:', error.message);
    }
    
    // Test with system agent
    console.log('\nTest 2: Calling stigmergy.task with system agent...');
    try {
      const result = await mockStigmergyTask({
        subagent_type: 'system',
        description: 'Test task for debugging'
      });
      console.log('✅ stigmergy.task with system succeeded');
    } catch (error) {
      console.log('❌ stigmergy.task with system failed:', error.message);
    }
    
    console.log('\n🎉 Debugging complete!');
    
  } catch (error) {
    console.log('❌ Debug failed with error:', error.message);
    console.error(error);
  }
}

debugStigmergyTask().catch(console.error);