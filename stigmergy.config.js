import path from "path";
import "./utils/env_loader.js";  // Load environment with inheritance

const config = {
  corePath: ".stigmergy-core",
  features: {
    neo4j: "auto", // Options: 'required', 'auto', 'memory'
    automation_mode: "autonomous", // Options: 'autonomous', 'approval_required', 'hybrid'
    provider_isolation: true, // Enable provider context awareness
    deepcode_integration: true, // Enable reference-first architecture
    
    // Specification-Driven Development features
    sdd: {
      enabled: true,
      templatesPath: '.stigmergy-core/templates',
      specDirectory: 'specs'
    },
    
    // Document Intelligence features
    documentIntelligence: {
      semanticSegmentation: true,
      supportedFormats: ['pdf', 'docx', 'html', 'md', 'txt'],
      pythonPath: '/usr/bin/python3'
    },
    
    // Memory Management features
    memoryManagement: {
      conciseSummarization: true,
      summaryThreshold: 10000
    }
  },
  // Enhanced LLM tier system with environment-driven flexibility
  model_tiers: {
    // REASONING MODELS (for planning, analysis, complex tasks)
    reasoning_tier: { 
      provider: process.env.REASONING_PROVIDER || "openrouter", // 'google' or 'openrouter'
      model_name: process.env.REASONING_MODEL || "deepseek/deepseek-chat-v3.1:free",
      api_key_env: function() {
        const provider = process.env.REASONING_PROVIDER || "openrouter";
        return provider === "google" ? "GOOGLE_API_KEY" : "OPENROUTER_API_KEY";
      }(),
      base_url_env: function() {
        const provider = process.env.REASONING_PROVIDER || "openrouter";
        return provider === "google" ? null : "OPENROUTER_BASE_URL";
      }(),
      capabilities: ["reasoning", "planning", "analysis"],
      use_cases: ["complex_planning", "architectural_decisions", "problem_solving"]
    },
    
    vision_tier: {
      provider: "openrouter",
      model_name: "anthropic/claude-3.5-sonnet", // A powerful multimodal model
      api_key_env: "OPENROUTER_API_KEY",
      base_url_env: "OPENROUTER_BASE_URL",
      capabilities: ["vision", "reasoning"],
      use_cases: ["ui_analysis", "design_feedback"]
    },

    strategic_tier: { 
      provider: process.env.STRATEGIC_PROVIDER || "openrouter",
      model_name: process.env.STRATEGIC_MODEL || "deepseek/deepseek-chat-v3.1:free",
      api_key_env: function() {
        const provider = process.env.STRATEGIC_PROVIDER || "openrouter";
        return provider === "google" ? "GOOGLE_API_KEY" : "OPENROUTER_API_KEY";
      }(),
      base_url_env: function() {
        const provider = process.env.STRATEGIC_PROVIDER || "openrouter";
        return provider === "google" ? null : "OPENROUTER_BASE_URL";
      }(),
      capabilities: ["reasoning", "strategic_thinking"],
      use_cases: ["business_planning", "technical_architecture", "research"]
    },
    
    // NON-REASONING MODELS (for execution, generation, quick tasks)
    execution_tier: { 
      provider: process.env.EXECUTION_PROVIDER || "openrouter",
      model_name: process.env.EXECUTION_MODEL || "deepseek/deepseek-chat-v3.1:free",
      api_key_env: function() {
        const provider = process.env.EXECUTION_PROVIDER || "openrouter";
        return provider === "google" ? "GOOGLE_API_KEY" : "OPENROUTER_API_KEY";
      }(),
      base_url_env: function() {
        const provider = process.env.EXECUTION_PROVIDER || "openrouter";
        return provider === "google" ? null : "OPENROUTER_BASE_URL";
      }(),
      capabilities: ["fast_execution", "code_generation"],
      use_cases: ["code_implementation", "documentation", "testing"]
    },
    
    utility_tier: { 
      provider: process.env.UTILITY_PROVIDER || "openrouter",
      model_name: process.env.UTILITY_MODEL || "deepseek/deepseek-chat-v3.1:free",
      api_key_env: function() {
        const provider = process.env.UTILITY_PROVIDER || "openrouter";
        return provider === "google" ? "GOOGLE_API_KEY" : "OPENROUTER_API_KEY";
      }(),
      base_url_env: function() {
        const provider = process.env.UTILITY_PROVIDER || "openrouter";
        return provider === "google" ? null : "OPENROUTER_BASE_URL";
      }(),
      capabilities: ["lightweight", "quick_tasks"],
      use_cases: ["simple_tasks", "validation", "formatting"]
    },
    
    // ALTERNATIVE TIERS (for specialized use cases)
    openrouter_reasoning: { 
      provider: "openrouter",
      api_key_env: "OPENROUTER_API_KEY",
      base_url_env: "OPENROUTER_BASE_URL",
      model_name: process.env.OPENROUTER_REASONING_MODEL || "deepseek/deepseek-chat-v3.1:free",
      capabilities: ["reasoning", "alternative_provider"],
      use_cases: ["fallback_reasoning", "cost_optimization"]
    },
    
    openrouter_execution: { 
      provider: "openrouter",
      api_key_env: "OPENROUTER_API_KEY",
      base_url_env: "OPENROUTER_BASE_URL", 
      model_name: process.env.OPENROUTER_EXECUTION_MODEL || "deepseek/deepseek-chat-v3.1:free",
      capabilities: ["execution", "alternative_provider"],
      use_cases: ["fallback_execution", "specialized_tasks"]
    },
    
    // ADDITIONAL PROVIDER TIERS (easy to configure popular providers)
    deepseek_reasoning: {
      provider: "deepseek",
      api_key_env: "DEEPSEEK_API_KEY",
      base_url_env: "DEEPSEEK_BASE_URL",
      model_name: process.env.DEEPSEEK_REASONING_MODEL || "deepseek-reasoner",
      capabilities: ["reasoning", "cost_effective"],
      use_cases: ["complex_planning", "cost_optimization"]
    },
    
    deepseek_execution: {
      provider: "deepseek",
      api_key_env: "DEEPSEEK_API_KEY",
      base_url_env: "DEEPSEEK_BASE_URL", 
      model_name: process.env.DEEPSEEK_EXECUTION_MODEL || "deepseek-chat",
      capabilities: ["execution", "cost_effective"],
      use_cases: ["code_implementation", "cost_optimization"]
    },
    
    kimi_reasoning: {
      provider: "kimi",
      api_key_env: "KIMI_API_KEY", 
      base_url_env: "KIMI_BASE_URL",
      model_name: process.env.KIMI_REASONING_MODEL || "moonshot-v1-32k",
      capabilities: ["reasoning", "long_context"],
      use_cases: ["complex_planning", "document_analysis"]
    },
    
    mistral_reasoning: {
      provider: "mistral",
      api_key_env: "MISTRAL_API_KEY",
      base_url_env: "MISTRAL_BASE_URL",
      model_name: process.env.MISTRAL_REASONING_MODEL || "mistral-large-latest", 
      capabilities: ["reasoning", "multilingual"],
      use_cases: ["complex_planning", "multilingual_tasks"]
    },
    
    anthropic_reasoning: {
      provider: "anthropic",
      api_key_env: "ANTHROPIC_API_KEY",
      base_url_env: "ANTHROPIC_BASE_URL",
      model_name: process.env.ANTHROPIC_REASONING_MODEL || "claude-3-5-sonnet-20241022",
      capabilities: ["reasoning", "safety_focused"],
      use_cases: ["complex_planning", "safety_critical_tasks"]
    },
    
    openai_reasoning: {
      provider: "openai",
      api_key_env: "OPENAI_API_KEY", 
      base_url_env: null, // Uses default OpenAI endpoint
      model_name: process.env.OPENAI_REASONING_MODEL || "o1-preview",
      capabilities: ["reasoning", "latest_models"],
      use_cases: ["complex_planning", "cutting_edge_tasks"]
    },
    
    // LEGACY TIERS (for backward compatibility - will be deprecated)
    s_tier: { 
      provider: process.env.REASONING_PROVIDER || "openrouter",
      api_key_env: function() {
        const provider = process.env.REASONING_PROVIDER || "openrouter";
        return provider === "google" ? "GOOGLE_API_KEY" : "OPENROUTER_API_KEY";
      }(),
      base_url_env: function() {
        const provider = process.env.REASONING_PROVIDER || "openrouter";
        return provider === "google" ? null : "OPENROUTER_BASE_URL";
      }(),
      model_name: process.env.REASONING_MODEL || "deepseek/deepseek-chat-v3.1:free",
    },
    
    a_tier: { 
      provider: process.env.EXECUTION_PROVIDER || "openrouter",
      api_key_env: function() {
        const provider = process.env.EXECUTION_PROVIDER || "openrouter";
        return provider === "google" ? "GOOGLE_API_KEY" : "OPENROUTER_API_KEY";
      }(),
      base_url_env: function() {
        const provider = process.env.EXECUTION_PROVIDER || "openrouter";
        return provider === "google" ? null : "OPENROUTER_BASE_URL";
      }(),
      model_name: process.env.EXECUTION_MODEL || "deepseek/deepseek-chat-v3.1:free",
    },
    
    b_tier: { 
      provider: process.env.UTILITY_PROVIDER || "openrouter",
      api_key_env: function() {
        const provider = process.env.UTILITY_PROVIDER || "openrouter";
        return provider === "google" ? "GOOGLE_API_KEY" : "OPENROUTER_API_KEY";
      }(),
      base_url_env: function() {
        const provider = process.env.UTILITY_PROVIDER || "openrouter";
        return provider === "google" ? null : "OPENROUTER_BASE_URL";
      }(),
      model_name: process.env.UTILITY_MODEL || "deepseek/deepseek-chat-v3.1:free",
    }
  },
  
  // Execution options for development tasks
  execution_options: {
    internal_dev: {
      enabled: process.env.ENABLE_INTERNAL_DEV !== "false",
      agent: "enhanced-dev",
      description: "Internal development using Stigmergy agents"
    },
    gemini_cli: {
      enabled: process.env.ENABLE_GEMINI_CLI === "true",
      agent: "gemini-executor", 
      description: "External Gemini CLI for code generation"
    },
    qwen_cli: {
      enabled: process.env.ENABLE_QWEN_CLI === "true",
      agent: "qwen-executor",
      description: "External Qwen Code CLI for advanced algorithms"
    }
  },
  
  // Provider preferences and fallback strategies
  provider_config: {
    // Preferred provider order for each tier type
    reasoning_providers: [
      process.env.REASONING_PROVIDER || "openrouter",
      "google"
    ],
    execution_providers: [
      process.env.EXECUTION_PROVIDER || "openrouter", 
      "google"
    ],
    
    // Cost optimization settings
    cost_optimization: {
      enabled: process.env.ENABLE_COST_OPTIMIZATION === "true",
      prefer_cheaper_models: process.env.PREFER_CHEAPER_MODELS === "true",
      max_cost_per_request: parseFloat(process.env.MAX_COST_PER_REQUEST) || 0.10
    },
    
    // Quality thresholds
    quality_thresholds: {
      min_success_rate: parseFloat(process.env.MIN_SUCCESS_RATE) || 0.85,
      max_error_rate: parseFloat(process.env.MAX_ERROR_RATE) || 0.15,
      performance_monitoring: process.env.ENABLE_PERFORMANCE_MONITORING !== "false"
    }
  }
};

// Validation function for configuration
export function validateConfig() {
  const errors = [];
  
  // Check that at least one provider is configured
  const hasGoogle = !!process.env.GOOGLE_API_KEY;
  const hasOpenRouter = !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_BASE_URL);
  const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;
  const hasKimi = !!process.env.KIMI_API_KEY;
  const hasMistral = !!process.env.MISTRAL_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  
  const hasAnyProvider = hasGoogle || hasOpenRouter || hasDeepSeek || hasKimi || hasMistral || hasAnthropic || hasOpenAI;
  
  if (!hasAnyProvider) {
    errors.push("At least one AI provider must be configured. Available options: GOOGLE_API_KEY, OPENROUTER_API_KEY, DEEPSEEK_API_KEY, KIMI_API_KEY, MISTRAL_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY");
  }
  
  // Validate that selected providers have required credentials
  const reasoningProvider = process.env.REASONING_PROVIDER || "openrouter";
  const executionProvider = process.env.EXECUTION_PROVIDER || "openrouter";
  
  if (reasoningProvider === "google" && !hasGoogle) {
    errors.push("REASONING_PROVIDER is set to 'google' but GOOGLE_API_KEY is missing");
  }
  
  if (executionProvider === "google" && !hasGoogle) {
    errors.push("EXECUTION_PROVIDER is set to 'google' but GOOGLE_API_KEY is missing");
  }
  
  if (reasoningProvider === "openrouter" && !hasOpenRouter) {
    errors.push("REASONING_PROVIDER is set to 'openrouter' but OPENROUTER_API_KEY or OPENROUTER_BASE_URL is missing");
  }
  
  if (executionProvider === "openrouter" && !hasOpenRouter) {
    errors.push("EXECUTION_PROVIDER is set to 'openrouter' but OPENROUTER_API_KEY or OPENROUTER_BASE_URL is missing");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
    providers_configured: {
      google: hasGoogle,
      openrouter: hasOpenRouter,
      deepseek: hasDeepSeek,
      kimi: hasKimi,
      mistral: hasMistral,
      anthropic: hasAnthropic,
      openai: hasOpenAI
    }
  };
}

export default config;