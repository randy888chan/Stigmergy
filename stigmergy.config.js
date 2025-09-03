import path from "path";
import "dotenv/config";

const config = {
  corePath: ".stigmergy-core",
  features: {
    neo4j: "auto", // Options: 'required', 'auto', 'memory'
    automation_mode: "autonomous", // Options: 'autonomous', 'approval_required', 'hybrid'
    provider_isolation: true, // Enable provider context awareness
    deepcode_integration: true, // Enable reference-first architecture
  },
  // Enhanced LLM tier system with environment-driven flexibility
  model_tiers: {
    // REASONING MODELS (for planning, analysis, complex tasks)
    reasoning_tier: { 
      provider: process.env.REASONING_PROVIDER || "google", // 'google' or 'openrouter'
      model_name: process.env.REASONING_MODEL || "gemini-2.0-flash-thinking-exp",
      api_key_env: function() {
        const provider = process.env.REASONING_PROVIDER || "google";
        return provider === "google" ? "GOOGLE_API_KEY" : "OPENROUTER_API_KEY";
      }(),
      base_url_env: function() {
        const provider = process.env.REASONING_PROVIDER || "google";
        return provider === "google" ? null : "OPENROUTER_BASE_URL";
      }(),
      capabilities: ["reasoning", "planning", "analysis"],
      use_cases: ["complex_planning", "architectural_decisions", "problem_solving"]
    },
    
    strategic_tier: { 
      provider: process.env.STRATEGIC_PROVIDER || "google",
      model_name: process.env.STRATEGIC_MODEL || "gemini-1.5-pro",
      api_key_env: function() {
        const provider = process.env.STRATEGIC_PROVIDER || "google";
        return provider === "google" ? "GOOGLE_API_KEY" : "OPENROUTER_API_KEY";
      }(),
      base_url_env: function() {
        const provider = process.env.STRATEGIC_PROVIDER || "google";
        return provider === "google" ? null : "OPENROUTER_BASE_URL";
      }(),
      capabilities: ["reasoning", "strategic_thinking"],
      use_cases: ["business_planning", "technical_architecture", "research"]
    },
    
    // NON-REASONING MODELS (for execution, generation, quick tasks)
    execution_tier: { 
      provider: process.env.EXECUTION_PROVIDER || "google",
      model_name: process.env.EXECUTION_MODEL || "gemini-1.5-flash",
      api_key_env: function() {
        const provider = process.env.EXECUTION_PROVIDER || "google";
        return provider === "google" ? "GOOGLE_API_KEY" : "OPENROUTER_API_KEY";
      }(),
      base_url_env: function() {
        const provider = process.env.EXECUTION_PROVIDER || "google";
        return provider === "google" ? null : "OPENROUTER_BASE_URL";
      }(),
      capabilities: ["fast_execution", "code_generation"],
      use_cases: ["code_implementation", "documentation", "testing"]
    },
    
    utility_tier: { 
      provider: process.env.UTILITY_PROVIDER || "google",
      model_name: process.env.UTILITY_MODEL || "gemini-1.5-flash-8b",
      api_key_env: function() {
        const provider = process.env.UTILITY_PROVIDER || "google";
        return provider === "google" ? "GOOGLE_API_KEY" : "OPENROUTER_API_KEY";
      }(),
      base_url_env: function() {
        const provider = process.env.UTILITY_PROVIDER || "google";
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
      model_name: process.env.OPENROUTER_REASONING_MODEL || "deepseek/deepseek-chat",
      capabilities: ["reasoning", "alternative_provider"],
      use_cases: ["fallback_reasoning", "cost_optimization"]
    },
    
    openrouter_execution: { 
      provider: "openrouter",
      api_key_env: "OPENROUTER_API_KEY",
      base_url_env: "OPENROUTER_BASE_URL", 
      model_name: process.env.OPENROUTER_EXECUTION_MODEL || "anthropic/claude-3.5-sonnet",
      capabilities: ["execution", "alternative_provider"],
      use_cases: ["fallback_execution", "specialized_tasks"]
    },
    
    // LEGACY TIERS (for backward compatibility - will be deprecated)
    s_tier: { 
      provider: process.env.REASONING_PROVIDER || "google",
      api_key_env: function() {
        const provider = process.env.REASONING_PROVIDER || "google";
        return provider === "google" ? "GOOGLE_API_KEY" : "OPENROUTER_API_KEY";
      }(),
      base_url_env: function() {
        const provider = process.env.REASONING_PROVIDER || "google";
        return provider === "google" ? null : "OPENROUTER_BASE_URL";
      }(),
      model_name: process.env.REASONING_MODEL || "gemini-2.0-flash-thinking-exp",
    },
    
    a_tier: { 
      provider: process.env.EXECUTION_PROVIDER || "google",
      api_key_env: function() {
        const provider = process.env.EXECUTION_PROVIDER || "google";
        return provider === "google" ? "GOOGLE_API_KEY" : "OPENROUTER_API_KEY";
      }(),
      base_url_env: function() {
        const provider = process.env.EXECUTION_PROVIDER || "google";
        return provider === "google" ? null : "OPENROUTER_BASE_URL";
      }(),
      model_name: process.env.EXECUTION_MODEL || "gemini-1.5-flash",
    },
    
    b_tier: { 
      provider: process.env.UTILITY_PROVIDER || "google",
      api_key_env: function() {
        const provider = process.env.UTILITY_PROVIDER || "google";
        return provider === "google" ? "GOOGLE_API_KEY" : "OPENROUTER_API_KEY";
      }(),
      base_url_env: function() {
        const provider = process.env.UTILITY_PROVIDER || "google";
        return provider === "google" ? null : "OPENROUTER_BASE_URL";
      }(),
      model_name: process.env.UTILITY_MODEL || "gemini-1.5-flash-8b",
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
      process.env.REASONING_PROVIDER || "google",
      "openrouter"
    ],
    execution_providers: [
      process.env.EXECUTION_PROVIDER || "google", 
      "openrouter"
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
  
  if (!hasGoogle && !hasOpenRouter) {
    errors.push("At least one AI provider must be configured (GOOGLE_API_KEY or OPENROUTER_API_KEY + OPENROUTER_BASE_URL)");
  }
  
  // Validate that selected providers have required credentials
  const reasoningProvider = process.env.REASONING_PROVIDER || "google";
  const executionProvider = process.env.EXECUTION_PROVIDER || "google";
  
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
    warnings: []
  };
}

export default config;
