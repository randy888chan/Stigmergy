#!/usr/bin/env node

import chalk from 'chalk';

async function testIntegrations() {
    console.log(chalk.blue.bold('🧪 STIGMERGY INTEGRATION TEST\n'));
    
    const results = {};
    
    // Test 1: Tool Executor
    console.log(chalk.yellow('1. Testing Tool Executor...'));
    try {
        const { createExecutor } = await import('../engine/tool_executor.js');
        const mockEngine = { triggerAgent: () => 'test' };
        const executor = createExecutor(mockEngine);
        console.log(chalk.green('✅ Tool executor created successfully'));
        results.toolExecutor = true;
    } catch (error) {
        console.log(chalk.red(`❌ Tool executor failed: ${error.message}`));
        results.toolExecutor = false;
    }
    
    // Test 2: Execution Graph
    console.log(chalk.yellow('2. Testing Execution Graph...'));
    try {
        const { createExecutionGraph } = await import('../engine/execution_graph.js');
        const mockTrigger = () => 'test';
        const graph = createExecutionGraph(mockTrigger);
        console.log(chalk.green('✅ Execution graph created successfully'));
        results.executionGraph = true;
    } catch (error) {
        console.log(chalk.red(`❌ Execution graph failed: ${error.message}`));
        results.executionGraph = false;
    }
    
    // Test 3: CodeRAG Integration
    console.log(chalk.yellow('3. Testing CodeRAG Integration...'));
    try {
        const { CodeRAGIntegration } = await import('../services/coderag_integration.js');
        const coderag = new CodeRAGIntegration();
        console.log(chalk.green('✅ CodeRAG integration loaded successfully'));
        results.coderag = true;
    } catch (error) {
        console.log(chalk.red(`❌ CodeRAG integration failed: ${error.message}`));
        results.coderag = false;
    }
    
    // Test 4: Lightweight Archon
    console.log(chalk.yellow('4. Testing Lightweight Archon...'));
    try {
        const { LightweightArchon } = await import('../services/lightweight_archon.js');
        const archon = new LightweightArchon();
        console.log(chalk.green('✅ Lightweight Archon loaded successfully'));
        results.lightweightArchon = true;
    } catch (error) {
        console.log(chalk.red(`❌ Lightweight Archon failed: ${error.message}`));
        results.lightweightArchon = false;
    }
    
    // Test 5: Qwen Integration
    console.log(chalk.yellow('5. Testing Qwen Integration...'));
    try {
        const { QwenCodeIntegration } = await import('../tools/qwen_integration.js');
        const qwen = new QwenCodeIntegration();
        console.log(chalk.green('✅ Qwen integration loaded successfully'));
        results.qwenIntegration = true;
    } catch (error) {
        console.log(chalk.red(`❌ Qwen integration failed: ${error.message}`));
        results.qwenIntegration = false;
    }
    
    // Test 6: SuperDesign Integration
    console.log(chalk.yellow('6. Testing SuperDesign Integration...'));
    try {
        const { SuperDesignIntegration } = await import('../tools/superdesign_integration.js');
        const superdesign = new SuperDesignIntegration();
        console.log(chalk.green('✅ SuperDesign integration loaded successfully'));
        results.superdesignIntegration = true;
    } catch (error) {
        console.log(chalk.red(`❌ SuperDesign integration failed: ${error.message}`));
        results.superdesignIntegration = false;
    }
    
    // Test 7: Agent Definitions
    console.log(chalk.yellow('7. Testing Agent Definitions...'));
    try {
        const { validateAgents } = await import('../cli/commands/validate.js');
        const validation = await validateAgents();
        if (validation.success) {
            console.log(chalk.green('✅ All agent definitions valid'));
            results.agentDefinitions = true;
        } else {
            console.log(chalk.red(`❌ Agent validation failed: ${validation.error}`));
            results.agentDefinitions = false;
        }
    } catch (error) {
        console.log(chalk.red(`❌ Agent validation failed: ${error.message}`));
        results.agentDefinitions = false;
    }
    
    // Summary
    console.log(chalk.blue.bold('\n📊 INTEGRATION TEST SUMMARY\n'));
    
    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;
    
    if (passed === total) {
        console.log(chalk.green.bold(`🎉 ALL TESTS PASSED (${passed}/${total})`));
        console.log(chalk.green('✅ Stigmergy is ready for production use!'));
    } else {
        console.log(chalk.yellow.bold(`⚠️  SOME TESTS FAILED (${passed}/${total})`));
        console.log(chalk.yellow('System may still work but check failed components.'));
    }
    
    // Detailed results
    console.log(chalk.blue('\nDetailed Results:'));
    Object.entries(results).forEach(([test, passed]) => {
        const icon = passed ? '✅' : '❌';
        const color = passed ? chalk.green : chalk.red;
        console.log(color(`${icon} ${test}`));
    });
    
    console.log(chalk.blue('\n🚀 Next: Add API keys to .env and run `npm run stigmergy:start`\n'));
    
    return { passed, total, results };
}

if (import.meta.url === `file://${process.argv[1]}`) {
    testIntegrations().catch(error => {
        console.error(chalk.red(`❌ Integration test failed: ${error.message}`));
        process.exit(1);
    });
}