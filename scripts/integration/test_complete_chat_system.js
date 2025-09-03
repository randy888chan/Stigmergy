#!/usr/bin/env node
// Complete Chat System Test for Stigmergy
import { process_chat_command, get_command_suggestions } from '../../tools/chat_interface.js';
import { verify_comprehensive_quality, run_static_analysis } from '../../tools/qa_tools.js';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

console.log(chalk.blue.bold('🚀 Complete Chat System Test Suite\n'));

async function testChatCommands() {
  console.log(chalk.yellow('💬 Testing Chat Command Processing...'));
  
  const testCommands = [
    {
      command: 'setup neo4j',
      description: 'Setup database'
    },
    {
      command: 'configure environment',
      description: 'Environment setup'
    },
    {
      command: 'index github repos',
      description: 'Repository indexing'
    },
    {
      command: 'health check',
      description: 'System diagnostics'
    },
    {
      command: 'create authentication system',
      description: 'Development task'
    }
  ];
  
  const results = [];
  
  for (const testCase of testCommands) {
    try {
      console.log(chalk.blue(`   Testing: "${testCase.command}"`));
      
      const result = await process_chat_command({
        command: testCase.command,
        context: 'Test environment',
        user_preferences: {}
      });
      
      const success = result && result.status && result.message;
      results.push({
        command: testCase.command,
        success,
        status: result?.status,
        message: result?.message?.substring(0, 50) + '...'
      });
      
      console.log(chalk.green(`   ✅ ${testCase.description}: ${result?.status || 'processed'}`));
      
    } catch (error) {
      console.log(chalk.red(`   ❌ ${testCase.description}: ${error.message}`));
      results.push({
        command: testCase.command,
        success: false,
        error: error.message
      });
    }
  }
  
  return {
    success: results.every(r => r.success),
    results,
    commands_tested: testCommands.length
  };
}

async function testCommandSuggestions() {
  console.log(chalk.yellow('\n💡 Testing Command Suggestions System...'));
  
  try {
    const suggestions = await get_command_suggestions({
      current_context: 'New user setup',
      user_history: []
    });
    
    console.log(chalk.green(`   ✅ Generated ${suggestions.suggestions?.length || 0} suggestions`));
    
    if (suggestions.suggestions && suggestions.suggestions.length > 0) {
      console.log(chalk.blue('   Top suggestions:'));
      suggestions.suggestions.slice(0, 3).forEach((suggestion, index) => {
        console.log(`      ${index + 1}. "${suggestion.command}" - ${suggestion.description}`);
      });
    }
    
    return {
      success: true,
      suggestion_count: suggestions.suggestions?.length || 0,
      status: suggestions.status
    };
    
  } catch (error) {
    console.log(chalk.red(`   ❌ Suggestion system failed: ${error.message}`));
    return { success: false, error: error.message };
  }
}

async function testStructuredResponses() {
  console.log(chalk.yellow('\n📋 Testing Structured Response Format...'));
  
  try {
    // Test that responses contain required fields
    const testResponse = await process_chat_command({
      command: 'test structured response',
      context: 'Testing format'
    });
    
    const requiredFields = ['status', 'message', 'progress'];
    const hasRequiredFields = requiredFields.every(field => 
      testResponse && testResponse.hasOwnProperty(field)
    );
    
    const isValidStatus = testResponse?.status && 
      ['thinking', 'executing', 'awaiting_input', 'complete', 'error'].includes(testResponse.status);
    
    const isValidProgress = typeof testResponse?.progress === 'number' && 
      testResponse.progress >= 0 && testResponse.progress <= 100;
    
    console.log(chalk.green(`   ✅ Required fields present: ${hasRequiredFields}`));
    console.log(chalk.green(`   ✅ Valid status format: ${isValidStatus}`));
    console.log(chalk.green(`   ✅ Valid progress format: ${isValidProgress}`));
    
    return {
      success: hasRequiredFields && isValidStatus && isValidProgress,
      structure_valid: hasRequiredFields,
      status_valid: isValidStatus,
      progress_valid: isValidProgress
    };
    
  } catch (error) {
    console.log(chalk.red(`   ❌ Structured response test failed: ${error.message}`));
    return { success: false, error: error.message };
  }
}

async function testQualityAssurance() {
  console.log(chalk.yellow('\n🛡️ Testing Enhanced QA System...'));
  
  try {
    // Create test files for QA testing
    const testCode = `
// Simple test function
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

module.exports = { calculateTotal };
`;

    const testFile = `
const { calculateTotal } = require('./calculator');

describe('Calculator', () => {
  test('should calculate total correctly', () => {
    const items = [{ price: 10 }, { price: 20 }];
    expect(calculateTotal(items)).toBe(30);
  });
});
`;

    const tempDir = path.join(process.cwd(), 'temp');
    await fs.ensureDir(tempDir);
    
    const sourceFile = path.join(tempDir, 'calculator.js');
    const testFileContent = path.join(tempDir, 'calculator.test.js');
    
    await fs.writeFile(sourceFile, testCode);
    await fs.writeFile(testFileContent, testFile);
    
    console.log(chalk.blue('   Testing static analysis...'));
    const staticResult = await run_static_analysis({ filePaths: [sourceFile] });
    
    console.log(chalk.blue('   Testing comprehensive quality check...'));
    const qualityResult = await verify_comprehensive_quality({
      sourceFile,
      testFile: testFileContent,
      requirements: 'Calculate total of item prices'
    });
    
    console.log(chalk.green(`   ✅ Static analysis: ${staticResult.success ? 'PASS' : 'FAIL'}`));
    console.log(chalk.green(`   ✅ Quality verification: ${qualityResult.overall_pass ? 'PASS' : 'FAIL'}`));
    
    // Cleanup
    await fs.remove(tempDir);
    
    return {
      success: staticResult.success && qualityResult.overall_pass !== false,
      static_analysis: staticResult.success,
      quality_verification: qualityResult.overall_pass
    };
    
  } catch (error) {
    console.log(chalk.red(`   ❌ QA test failed: ${error.message}`));
    return { success: false, error: error.message };
  }
}

async function testIntegrationWorkflow() {
  console.log(chalk.yellow('\n🔄 Testing Complete Integration Workflow...'));
  
  try {
    // Simulate a complete user workflow
    const steps = [
      { command: 'health check', expected: 'complete' },
      { command: 'setup environment', expected: 'thinking' },
      { command: 'create simple component', expected: 'thinking' }
    ];
    
    const stepResults = [];
    
    for (const step of steps) {
      const result = await process_chat_command({
        command: step.command,
        context: 'Integration test workflow'
      });
      
      stepResults.push({
        command: step.command,
        status: result?.status,
        success: result?.status !== 'error'
      });
    }
    
    const allStepsSuccessful = stepResults.every(step => step.success);
    
    console.log(chalk.green(`   ✅ Workflow steps completed: ${stepResults.length}`));
    console.log(chalk.green(`   ✅ All steps successful: ${allStepsSuccessful}`));
    
    return {
      success: allStepsSuccessful,
      steps_completed: stepResults.length,
      step_results: stepResults
    };
    
  } catch (error) {
    console.log(chalk.red(`   ❌ Integration workflow failed: ${error.message}`));
    return { success: false, error: error.message };
  }
}

async function runCompleteTestSuite() {
  console.log(chalk.bold('🧪 Complete Chat System Test Suite\n'));
  
  const results = {
    chat_commands: await testChatCommands(),
    command_suggestions: await testCommandSuggestions(),
    structured_responses: await testStructuredResponses(),
    quality_assurance: await testQualityAssurance(),
    integration_workflow: await testIntegrationWorkflow()
  };
  
  const allPassed = Object.values(results).every(r => r.success);
  
  console.log(chalk.blue('\n📊 Complete Test Results Summary:'));
  console.log(`${results.chat_commands.success ? '✅' : '❌'} Chat Command Processing - ${results.chat_commands.success ? 'PASS' : 'FAIL'}`);
  console.log(`${results.command_suggestions.success ? '✅' : '❌'} Command Suggestions - ${results.command_suggestions.success ? 'PASS' : 'FAIL'}`);
  console.log(`${results.structured_responses.success ? '✅' : '❌'} Structured Responses - ${results.structured_responses.success ? 'PASS' : 'FAIL'}`);
  console.log(`${results.quality_assurance.success ? '✅' : '❌'} Quality Assurance - ${results.quality_assurance.success ? 'PASS' : 'FAIL'}`);
  console.log(`${results.integration_workflow.success ? '✅' : '❌'} Integration Workflow - ${results.integration_workflow.success ? 'PASS' : 'FAIL'}`);
  
  if (allPassed) {
    console.log(chalk.green.bold('\n🎉 ALL TESTS PASSED! Complete Chat System is Ready!'));
    
    console.log(chalk.blue('\n🚀 How to Use the Chat Interface:'));
    console.log('1. Start Stigmergy: npm run stigmergy:start');
    console.log('2. In Roo Code, simply type natural language commands:');
    console.log('   • "setup neo4j" - Configure database');
    console.log('   • "index github repos" - Build reference library');
    console.log('   • "create authentication system" - Build features');
    console.log('   • "health check" - Verify system status');
    console.log('   • "help me get started" - Get setup guidance');
    
    console.log(chalk.yellow('\n💡 Pro Tips:'));
    console.log('• All CLI commands now work through chat');
    console.log('• The system provides suggestions based on your needs');
    console.log('• Setup is fully automated through conversational interface');
    console.log('• Quality assurance includes TDD enforcement and static analysis');
    
  } else {
    console.log(chalk.red.bold('\n❌ Some tests failed. Please review the issues above.'));
  }
  
  return results;
}

// Run the complete test suite
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteTestSuite().catch(error => {
    console.error(chalk.red('Test suite failed:'), error);
    process.exit(1);
  });
}

export { runCompleteTestSuite };