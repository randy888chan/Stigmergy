import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { SystemValidator } from '../src/bootstrap/system_validator.js';
import { CodeIntelligenceService } from '../services/code_intelligence_service.js';
import config from '../stigmergy.config.js';
import { validateAgents } from '../cli/commands/validate.js';
import { qwen_health_check } from '../tools/qwen_integration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ComprehensiveHealthCheck {
    constructor() {
        this.results = {};
        this.warnings = [];
        this.errors = [];
    }

    async run() {
        console.log(chalk.blue.bold('🔍 STIGMERGY COMPREHENSIVE HEALTH CHECK\n'));

        await this.checkEnvironment();
        await this.checkCoreFiles(); 
        await this.checkNeo4j();
        await this.checkAIProviders();
        await this.checkAgentDefinitions();
        await this.checkExternalIntegrations();

        this.printSummary();
        
        return {
            success: this.errors.length === 0,
            warnings: this.warnings,
            errors: this.errors,
            results: this.results
        };
    }

    async checkEnvironment() {
        console.log(chalk.yellow('📋 Environment Configuration'));
        
        const envFile = path.join(process.cwd(), '.env');
        const envExampleFile = path.join(process.cwd(), '.env.example');
        
        if (!fs.existsSync(envFile)) {
            if (fs.existsSync(envExampleFile)) {
                this.warnings.push('No .env file found. Please copy .env.example to .env and configure it.');
                console.log(chalk.yellow('   ⚠️  .env file missing (found .env.example)'));
            } else {
                this.errors.push('.env and .env.example files are both missing.');
                console.log(chalk.red('   ❌ No environment configuration found'));
            }
        } else {
            console.log(chalk.green('   ✅ .env file found'));
        }

        // Check required environment variables
        const requiredVars = this.getRequiredEnvVars();
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            this.errors.push(`Missing required environment variables: ${missingVars.join(', ')}`);
            console.log(chalk.red(`   ❌ Missing variables: ${missingVars.join(', ')}`));
        } else {
            console.log(chalk.green('   ✅ All required environment variables are set'));
        }

        this.results.environment = { 
            envFile: fs.existsSync(envFile),
            missingVars,
            success: missingVars.length === 0 
        };
        console.log('');
    }

    async checkCoreFiles() {
        console.log(chalk.yellow('📁 Core Files Structure'));
        
        const corePath = path.join(process.cwd(), '.stigmergy-core');
        
        if (!fs.existsSync(corePath)) {
            this.errors.push('.stigmergy-core directory not found. Run: npx stigmergy install');
            console.log(chalk.red('   ❌ .stigmergy-core directory missing'));
            this.results.coreFiles = { success: false };
            console.log('');
            return;
        }

        const requiredDirs = ['agents', 'system_docs', 'templates', 'agent-teams'];
        const missingDirs = requiredDirs.filter(dir => !fs.existsSync(path.join(corePath, dir)));
        
        if (missingDirs.length > 0) {
            this.warnings.push(`Missing core directories: ${missingDirs.join(', ')}`);
            console.log(chalk.yellow(`   ⚠️  Missing directories: ${missingDirs.join(', ')}`));
        } else {
            console.log(chalk.green('   ✅ All core directories present'));
        }

        // Check manifest integrity
        const manifestPath = path.join(corePath, 'system_docs', '02_Agent_Manifest.md');
        if (fs.existsSync(manifestPath)) {
            console.log(chalk.green('   ✅ Agent manifest found'));
        } else {
            this.errors.push('Agent manifest missing');
            console.log(chalk.red('   ❌ Agent manifest missing'));
        }

        this.results.coreFiles = { 
            success: missingDirs.length === 0,
            missingDirs 
        };
        console.log('');
    }

    async checkNeo4j() {
        console.log(chalk.yellow('🗄️  Neo4j Database'));
        
        const codeIntel = new CodeIntelligenceService();
        const result = await codeIntel.testConnection();
        
        if (result.status === 'ok') {
            console.log(chalk.green(`   ✅ Connection successful (${result.version || 'Unknown version'})`));
            this.results.neo4j = { success: true, version: result.version };
        } else {
            if (config.features.neo4j === 'required') {
                this.errors.push(`Neo4j connection failed: ${result.message}`);
                console.log(chalk.red(`   ❌ ${result.message}`));
            } else {
                this.warnings.push(`Neo4j not available: ${result.message}`);
                console.log(chalk.yellow(`   ⚠️  ${result.message}`));
                console.log(chalk.blue('   ℹ️  System will run in fallback mode'));
            }
            
            if (result.recovery_suggestions) {
                console.log(chalk.blue('   💡 Suggestions:'));
                result.recovery_suggestions.forEach(suggestion => {
                    console.log(chalk.blue(`      • ${suggestion}`));
                });
            }
            
            this.results.neo4j = { success: false, error: result.message };
        }
        console.log('');
    }

    async checkAIProviders() {
        console.log(chalk.yellow('🤖 AI Provider Configuration'));
        
        const tiers = Object.keys(config.model_tiers);
        const coreTiers = ['reasoning_tier', 'strategic_tier', 'execution_tier', 'utility_tier', 's_tier', 'a_tier', 'b_tier'];
        const optionalTiers = tiers.filter(t => !coreTiers.includes(t));
        
        let workingProviders = 0;
        let coreWorkingProviders = 0;
        
        // Check core tiers first
        for (const tier of coreTiers) {
            if (!config.model_tiers[tier]) continue;
            
            const tierConfig = config.model_tiers[tier];
            const apiKeyEnv = typeof tierConfig.api_key_env === 'function' ? tierConfig.api_key_env() : tierConfig.api_key_env;
            const apiKey = process.env[apiKeyEnv];
            
            if (apiKey) {
                console.log(chalk.green(`   ✅ ${tier}: ${tierConfig.provider} (${tierConfig.model_name})`));
                workingProviders++;
                coreWorkingProviders++;
            } else {
                console.log(chalk.red(`   ❌ ${tier}: Missing ${apiKeyEnv}`));
            }
        }
        
        // Check optional tiers
        for (const tier of optionalTiers) {
            const tierConfig = config.model_tiers[tier];
            const apiKeyEnv = typeof tierConfig.api_key_env === 'function' ? tierConfig.api_key_env() : tierConfig.api_key_env;
            const apiKey = process.env[apiKeyEnv];
            
            if (apiKey) {
                console.log(chalk.green(`   ✅ ${tier}: ${tierConfig.provider} (${tierConfig.model_name})`));
                workingProviders++;
            } else {
                console.log(chalk.red(`   ❌ ${tier}: Missing ${apiKeyEnv}`));
            }
        }
        
        // Only error if no core providers are working
        if (coreWorkingProviders === 0) {
            this.errors.push('No core AI providers configured. At least one of Google, OpenRouter, or other core providers must be configured.');
        } else if (workingProviders < Math.floor(tiers.length / 2)) {
            this.warnings.push(`Only ${workingProviders}/${tiers.length} AI providers configured`);
        }

        this.results.aiProviders = { 
            success: coreWorkingProviders > 0, 
            workingProviders, 
            totalProviders: tiers.length,
            coreWorkingProviders
        };
        console.log('');
    }

    async checkAgentDefinitions() {
        console.log(chalk.yellow('🤖 Agent Definitions'));
        
        try {
            const result = await validateAgents();
            
            if (result.success) {
                console.log(chalk.green('   ✅ All agent definitions are valid'));
                this.results.agentDefinitions = { success: true };
            } else {
                this.errors.push(`Agent validation failed: ${result.error}`);
                console.log(chalk.red(`   ❌ ${result.error}`));
                this.results.agentDefinitions = { success: false, error: result.error };
            }
        } catch (error) {
            this.errors.push(`Failed to validate agents: ${error.message}`);
            console.log(chalk.red(`   ❌ Validation error: ${error.message}`));
            this.results.agentDefinitions = { success: false, error: error.message };
        }
        console.log('');
    }

    async checkExternalIntegrations() {
        console.log(chalk.yellow('🔗 External Integrations'));
        
        // Check Firecrawl
        const firecrawlKey = process.env.FIRECRAWL_KEY;
        if (firecrawlKey) {
            console.log(chalk.green('   ✅ Firecrawl API key configured'));
        } else {
            this.warnings.push('Firecrawl API key not configured (research features limited)');
            console.log(chalk.yellow('   ⚠️  Firecrawl API key missing (research features limited)'));
        }

        // Check Gemini CLI (optional)
        let geminiCli = false;
        try {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execPromise = promisify(exec);
            
            await execPromise('gemini --version');
            console.log(chalk.green('   ✅ Gemini CLI available'));
            geminiCli = true;
        } catch (error) {
            this.warnings.push('Gemini CLI not available (some agents may have limited functionality)');
            console.log(chalk.yellow('   ⚠️  Gemini CLI not found (optional)'));
        }

        // Check Qwen Code integration
        let qwenIntegration = false;
        try {
            const qwenResult = await qwen_health_check();
            if (qwenResult.status === 'ok') {
                console.log(chalk.green('   ✅ Qwen Code integration working'));
                qwenIntegration = true;
            } else {
                this.warnings.push(`Qwen Code integration issue: ${qwenResult.message}`);
                console.log(chalk.yellow(`   ⚠️  Qwen Code: ${qwenResult.message}`));
            }
        } catch (error) {
            this.warnings.push('Qwen Code integration not available (advanced coding features limited)');
            console.log(chalk.yellow('   ⚠️  Qwen Code integration failed (optional)'));
        }

        this.results.externalIntegrations = {
            firecrawl: !!firecrawlKey,
            geminiCli,
            qwenIntegration
        };
        console.log('');
    }

    getRequiredEnvVars() {
        // Only require variables for the core functional tiers
        const coreProviders = new Set();
        
        // Check which providers are actually used by core tiers
        const coreTiers = ['reasoning_tier', 'strategic_tier', 'execution_tier', 'utility_tier', 's_tier', 'a_tier', 'b_tier'];
        
        coreTiers.forEach(tierName => {
            const tier = config.model_tiers[tierName];
            if (tier && tier.api_key_env) {
                const apiKey = typeof tier.api_key_env === 'function' ? tier.api_key_env() : tier.api_key_env;
                coreProviders.add(apiKey);
            }
        });
        
        const requiredVars = Array.from(coreProviders);
        
        // Add Neo4j if required
        if (config.features.neo4j === 'required') {
            requiredVars.push('NEO4J_URI', 'NEO4J_USER', 'NEO4J_PASSWORD');
        }
        
        return requiredVars;
    }

    printSummary() {
        console.log(chalk.blue.bold('📊 HEALTH CHECK SUMMARY\n'));
        
        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log(chalk.green.bold('🎉 ALL SYSTEMS GO! Stigmergy is ready to use.\n'));
        } else {
            if (this.errors.length > 0) {
                console.log(chalk.red.bold(`❌ CRITICAL ERRORS (${this.errors.length}):`));
                this.errors.forEach((error, i) => {
                    console.log(chalk.red(`   ${i + 1}. ${error}`));
                });
                console.log('');
            }
            
            if (this.warnings.length > 0) {
                console.log(chalk.yellow.bold(`⚠️  WARNINGS (${this.warnings.length}):`));
                this.warnings.forEach((warning, i) => {
                    console.log(chalk.yellow(`   ${i + 1}. ${warning}`));
                });
                console.log('');
            }
        }

        console.log(chalk.blue.bold('🚀 NEXT STEPS:'));
        if (this.errors.length > 0) {
            console.log(chalk.blue('   1. Fix the critical errors above'));
            console.log(chalk.blue('   2. Run the health check again: npm run health-check'));
            console.log(chalk.blue('   3. Once all errors are resolved, start Stigmergy: npm run stigmergy:start'));
        } else {
            console.log(chalk.blue('   1. Address any warnings (optional for basic functionality)'));
            console.log(chalk.blue('   2. Start Stigmergy: npm run stigmergy:start'));
        }
        console.log('');
    }
}

if (process.argv[1] === __filename) {
    const healthCheck = new ComprehensiveHealthCheck();
    const result = await healthCheck.run();
    process.exit(result.success ? 0 : 1);
}

export { ComprehensiveHealthCheck };