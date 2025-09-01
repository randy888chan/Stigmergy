#!/usr/bin/env node

import chalk from 'chalk';
import { ComprehensiveHealthCheck } from './health-check.js';
import { spawn } from 'child_process';
import path from 'path';

async function startStigmergy() {
    console.log(chalk.blue.bold('🚀 STIGMERGY STARTUP SEQUENCE\n'));
    
    // Run health check first
    console.log(chalk.yellow('1. Running comprehensive health check...'));
    const healthCheck = new ComprehensiveHealthCheck();
    const healthResult = await healthCheck.run();
    
    if (!healthResult.success) {
        console.log(chalk.red.bold('\n❌ STARTUP ABORTED'));
        console.log(chalk.red('Cannot start Stigmergy with critical errors. Please fix the issues above.\n'));
        process.exit(1);
    }
    
    console.log(chalk.green('✅ Health check passed\n'));
    
    // Initialize CodeRAG if Neo4j is available
    if (healthResult.results.neo4j?.success) {
        console.log(chalk.yellow('2. Initializing CodeRAG...'));
        try {
            const { initialize_coderag } = await import('../services/coderag_integration.js');
            await initialize_coderag({ projectPath: process.cwd() });
            console.log(chalk.green('✅ CodeRAG initialized\n'));
        } catch (error) {
            console.log(chalk.yellow(`⚠️  CodeRAG initialization skipped: ${error.message}\n`));
        }
    }
    
    // Start the main server
    console.log(chalk.yellow('3. Starting Stigmergy engine...'));
    console.log(chalk.blue('Server will be available at: http://localhost:3000\n'));
    
    const serverPath = path.join(process.cwd(), 'engine', 'server.js');
    const server = spawn('node', [serverPath], {
        stdio: 'inherit',
        env: { ...process.env }
    });
    
    server.on('error', (error) => {
        console.error(chalk.red(`❌ Failed to start server: ${error.message}`));
        process.exit(1);
    });
    
    server.on('exit', (code) => {
        if (code !== 0) {
            console.log(chalk.red(`❌ Server exited with code ${code}`));
            process.exit(code);
        }
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log(chalk.yellow('\n🛑 Shutting down Stigmergy...'));
        server.kill('SIGINT');
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log(chalk.yellow('\n🛑 Shutting down Stigmergy...'));
        server.kill('SIGTERM');
        process.exit(0);
    });
}

startStigmergy().catch(error => {
    console.error(chalk.red(`❌ Startup failed: ${error.message}`));
    process.exit(1);
});