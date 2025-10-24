import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import fsExtra from 'fs-extra';
import os from 'os';
import Doppler from '@dopplerhq/node-sdk';
import chalk from 'chalk';

// --- From stigmergy.config.js ---
function getProviderDetails(providerEnvVar) {
  const provider = process.env[providerEnvVar] || "openrouter";
  return {
    api_key_env: provider === "google" ? "GOOGLE_API_KEY" : "OPENROUTER_API_KEY",
    base_url_env: provider === "google" ? null : "OPENROUTER_BASE_URL",
  };
}

const staticConfig = {
  corePath: ".stigmergy-core",
  security: {
    allowedDirs: ["src", "public", "docs", "tests", "scripts", "agents", ".ai", ".vscode", "specs"],
    maxFileSizeMB: 1,
    generatedPaths: ["dashboard/public", "dist", "build", "coverage"]
  },
  features: {
    neo4j: "auto",
    automation_mode: "autonomous",
    provider_isolation: true,
    deepcode_integration: true,
    sdd: {
      enabled: true,
      templatesPath: '.stigmergy-core/templates',
      specDirectory: 'specs'
    },
    documentIntelligence: {
      semanticSegmentation: true,
      supportedFormats: ['pdf', 'docx', 'html', 'md', 'txt'],
      pythonPath: '/usr/bin/python3'
    },
    memoryManagement: {
      conciseSummarization: true,
      summaryThreshold: 10000
    }
  },
  // Base model tier templates
  model_tiers: {
    reasoning_tier: { provider: "openrouter", model_name: "deepseek/deepseek-chat-v3.1:free", capabilities: ["reasoning", "planning", "analysis"] },
    vision_tier: { provider: "openrouter", model_name: "anthropic/claude-3.5-sonnet", api_key_env: "OPENROUTER_API_KEY", base_url_env: "OPENROUTER_BASE_URL" },
    strategic_tier: { provider: "openrouter", model_name: "deepseek/deepseek-chat-v3.1:free", capabilities: ["reasoning", "strategic_thinking"] },
    execution_tier: { provider: "openrouter", model_name: "deepseek/deepseek-chat-v3.1:free", capabilities: ["fast_execution", "code_generation"] },
    utility_tier: { provider: "openrouter", model_name: "deepseek/deepseek-chat-v3.1:free", capabilities: ["lightweight", "quick_tasks"] },
    codestral_utility: { provider: "mistral", api_key_env: "CODESTRAL_API_KEY", base_url_env: "CODESTRAL_BASE_URL", model_name: "codestral-latest" },
    openrouter_reasoning: { provider: "openrouter", api_key_env: "OPENROUTER_API_KEY", base_url_env: "OPENROUTER_BASE_URL", model_name: "deepseek/deepseek-chat-v3.1:free" },
    openrouter_execution: { provider: "openrouter", api_key_env: "OPENROUTER_API_KEY", base_url_env: "OPENROUTER_BASE_URL", model_name: "deepseek/deepseek-chat-v3.1:free" },
    deepseek_reasoning: { provider: "deepseek", api_key_env: "DEEPSEEK_API_KEY", base_url_env: "DEEPSEEK_BASE_URL", model_name: "deepseek-reasoner" },
    deepseek_execution: { provider: "deepseek", api_key_env: "DEEPSEEK_API_KEY", base_url_env: "DEEPSEEK_BASE_URL", model_name: "deepseek-chat" },
    kimi_reasoning: { provider: "kimi", api_key_env: "KIMI_API_KEY", base_url_env: "KIMI_BASE_URL", model_name: "moonshot-v1-32k" },
    mistral_reasoning: { provider: "mistral", api_key_env: "MISTRAL_API_KEY", base_url_env: "MISTRAL_BASE_URL", model_name: "mistral-large-latest" },
    anthropic_reasoning: { provider: "anthropic", api_key_env: "ANTHROPIC_API_KEY", base_url_env: "ANTHROPIC_BASE_URL", model_name: "claude-3-5-sonnet-20241022" },
    openai_reasoning: { provider: "openai", api_key_env: "OPENAI_API_KEY", base_url_env: null, model_name: "o1-preview" },
    s_tier: { provider: "openrouter", model_name: "deepseek/deepseek-chat-v3.1:free" },
    a_tier: { provider: "openrouter", model_name: "deepseek/deepseek-chat-v3.1:free" },
    b_tier: { provider: "openrouter", model_name: "deepseek/deepseek-chat-v3.1:free" },
  },
};

class ConfigService {
  constructor() {
    this.config = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }
    await this._loadAndValidate();
    this.isInitialized = true;
  }

  async _loadEnv() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    console.log(`🔧 Loading environment configuration for: ${nodeEnv}`);

    // 1. Attempt to load from Doppler first
    const configDir = path.join(os.homedir(), '.stigmergy');
    const configFile = path.join(configDir, 'config.json');
    let dopplerToken;
    try {
        if (await fsExtra.pathExists(configFile)) {
            const localConfig = await fsExtra.readJson(configFile);
            dopplerToken = localConfig.dopplerToken;
        }
    } catch (e) {
        console.warn(chalk.yellow(`   ⚠️ Could not read local config file at ${configFile}. Proceeding without Doppler.`));
    }

    if (dopplerToken) {
        try {
            const doppler = new Doppler({
                accessToken: dopplerToken
            });
            const dopplerProject = process.env.DOPPLER_PROJECT || 'stigmergy';
            console.log(`   Fetching secrets for Doppler project: ${dopplerProject}`);
            const secrets = await doppler.secrets.get(dopplerProject);

            for (const key in secrets) {
                if (secrets[key].computed) {
                    process.env[key] = secrets[key].computed;
                }
            }
            console.log(chalk.green('   ✅ Loaded secrets from Doppler.'));
        } catch (error) {
            console.warn(chalk.yellow(`   ⚠️ Failed to fetch secrets from Doppler: ${error.message}. Falling back to .env files.`));
        }
    } else {
        console.log(`   ℹ️ No Doppler token found. Skipping Doppler and looking for .env files.`);
    }


    // 2. Load .env files as a fallback or supplement
    const filesToTry = [`.env.${nodeEnv}`, '.env.development', '.env'];
    for (const file of filesToTry) {
      const envFilePath = path.resolve(process.cwd(), file);
      if (fs.existsSync(envFilePath)) {
        dotenv.config({ path: envFilePath, override: true }); // Keep override true to allow Doppler to be primary
        console.log(`   ✅ Loaded: ${file}`);
        break;
      }
    }
  }

  _validateConfig(config) {
    const errors = [];
    const hasGoogle = !!process.env.GOOGLE_API_KEY;
    const hasOpenRouter = !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_BASE_URL);
    const hasAnyProvider = hasGoogle || hasOpenRouter;
    if (!hasAnyProvider) {
      errors.push("At least one AI provider must be configured (e.g., GOOGLE_API_KEY or OPENROUTER_API_KEY from .env or Doppler).");
    }
    return { isValid: errors.length === 0, errors };
  }

  async _loadAndValidate() {
    await this._loadEnv();

    const dynamicConfig = {
      ...staticConfig,
      model_tiers: {
        reasoning_tier: { ...staticConfig.model_tiers.reasoning_tier, provider: process.env.REASONING_PROVIDER || "openrouter", model_name: process.env.REASONING_MODEL || "deepseek/deepseek-chat-v3.1:free", ...getProviderDetails("REASONING_PROVIDER") },
        vision_tier: { ...staticConfig.model_tiers.vision_tier },
        strategic_tier: { ...staticConfig.model_tiers.strategic_tier, provider: process.env.STRATEGIC_PROVIDER || "openrouter", model_name: process.env.STRATEGIC_MODEL || "deepseek/deepseek-chat-v3.1:free", ...getProviderDetails("STRATEGIC_PROVIDER") },
        execution_tier: { ...staticConfig.model_tiers.execution_tier, provider: process.env.EXECUTION_PROVIDER || "openrouter", model_name: process.env.EXECUTION_MODEL || "deepseek/deepseek-chat-v3.1:free", ...getProviderDetails("EXECUTION_PROVIDER") },
        utility_tier: { ...staticConfig.model_tiers.utility_tier, provider: process.env.UTILITY_PROVIDER || "openrouter", model_name: process.env.UTILITY_MODEL || "deepseek/deepseek-chat-v3.1:free", ...getProviderDetails("UTILITY_PROVIDER") },
        codestral_utility: { ...staticConfig.model_tiers.codestral_utility },
        openrouter_reasoning: { ...staticConfig.model_tiers.openrouter_reasoning, model_name: process.env.OPENROUTER_REASONING_MODEL || "deepseek/deepseek-chat-v3.1:free" },
        openrouter_execution: { ...staticConfig.model_tiers.openrouter_execution, model_name: process.env.OPENROUTER_EXECUTION_MODEL || "deepseek/deepseek-chat-v3.1:free" },
        deepseek_reasoning: { ...staticConfig.model_tiers.deepseek_reasoning, model_name: process.env.DEEPSEEK_REASONING_MODEL || "deepseek-reasoner" },
        deepseek_execution: { ...staticConfig.model_tiers.deepseek_execution, model_name: process.env.DEEPSEEK_EXECUTION_MODEL || "deepseek-chat" },
        kimi_reasoning: { ...staticConfig.model_tiers.kimi_reasoning, model_name: process.env.KIMI_REASONING_MODEL || "moonshot-v1-32k" },
        mistral_reasoning: { ...staticConfig.model_tiers.mistral_reasoning, model_name: process.env.MISTRAL_REASONING_MODEL || "mistral-large-latest" },
        anthropic_reasoning: { ...staticConfig.model_tiers.anthropic_reasoning, model_name: process.env.ANTHROPIC_REASONING_MODEL || "claude-3-5-sonnet-20241022" },
        openai_reasoning: { ...staticConfig.model_tiers.openai_reasoning, model_name: process.env.OPENAI_REASONING_MODEL || "o1-preview" },
        s_tier: { ...staticConfig.model_tiers.s_tier, provider: process.env.REASONING_PROVIDER || "openrouter", model_name: process.env.REASONING_MODEL || "deepseek/deepseek-chat-v3.1:free", ...getProviderDetails("REASONING_PROVIDER") },
        a_tier: { ...staticConfig.model_tiers.a_tier, provider: process.env.EXECUTION_PROVIDER || "openrouter", model_name: process.env.EXECUTION_MODEL || "deepseek/deepseek-chat-v3.1:free", ...getProviderDetails("EXECUTION_PROVIDER") },
        b_tier: { ...staticConfig.model_tiers.b_tier, provider: process.env.UTILITY_PROVIDER || "openrouter", model_name: process.env.UTILITY_MODEL || "deepseek/deepseek-chat-v3.1:free", ...getProviderDetails("UTILITY_PROVIDER") },
      },
      execution_options: {
        internal_dev: { enabled: process.env.ENABLE_INTERNAL_DEV !== "false", agent: "enhanced-dev" },
        gemini_cli: { enabled: process.env.ENABLE_GEMINI_CLI === "true", agent: "gemini-executor" },
        qwen_cli: { enabled: process.env.ENABLE_QWEN_CLI === "true", agent: "qwen-executor" },
      },
      provider_config: {
        reasoning_providers: [process.env.REASONING_PROVIDER || "openrouter", "google"],
        execution_providers: [process.env.EXECUTION_PROVIDER || "openrouter", "google"],
        cost_optimization: {
          enabled: process.env.ENABLE_COST_OPTIMIZATION === "true",
          prefer_cheaper_models: process.env.PREFER_CHEAPER_MODELS === "true",
          max_cost_per_request: parseFloat(process.env.MAX_COST_PER_REQUEST) || 0.10,
        },
        quality_thresholds: {
          min_success_rate: parseFloat(process.env.MIN_SUCCESS_RATE) || 0.85,
          max_error_rate: parseFloat(process.env.MAX_ERROR_RATE) || 0.15,
          performance_monitoring: process.env.ENABLE_PERFORMANCE_MONITORING !== "false",
        }
      }
    };

    const validation = this._validateConfig(dynamicConfig);
    if (!validation.isValid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }
    this.config = dynamicConfig;
  }

  getConfig() {
    if (!this.isInitialized) {
      // This is a safeguard. The application's entry point should always call initialize().
      throw new Error("ConfigService has not been initialized. Please call await configService.initialize() at application startup.");
    }
    return this.config;
  }
}

export const configService = new ConfigService();
