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
  // Enhanced LLM tier system with reasoning vs non-reasoning models
  model_tiers: {
    // REASONING MODELS (for planning, analysis, complex tasks)
    reasoning_tier: { // Strategic reasoning with Gemini 2.0 Flash Thinking
      provider: "google",
      api_key_env: "GOOGLE_API_KEY",
      model_name: "gemini-2.0-flash-thinking-exp",
      capabilities: ["reasoning", "planning", "analysis"],
      use_cases: ["complex_planning", "architectural_decisions", "problem_solving"]
    },
    strategic_tier: { // High-level reasoning with Gemini Pro
      provider: "google", 
      api_key_env: "GOOGLE_API_KEY",
      model_name: "gemini-1.5-pro",
      capabilities: ["reasoning", "strategic_thinking"],
      use_cases: ["business_planning", "technical_architecture", "research"]
    },
    
    // NON-REASONING MODELS (for execution, generation, quick tasks)
    execution_tier: { // Fast execution with Gemini Flash
      provider: "google",
      api_key_env: "GOOGLE_API_KEY", 
      model_name: "gemini-1.5-flash",
      capabilities: ["fast_execution", "code_generation"],
      use_cases: ["code_implementation", "documentation", "testing"]
    },
    utility_tier: { // Lightweight tasks with Flash 8B
      provider: "google",
      api_key_env: "GOOGLE_API_KEY",
      model_name: "gemini-1.5-flash-8b",
      capabilities: ["lightweight", "quick_tasks"],
      use_cases: ["simple_tasks", "validation", "formatting"]
    },
    
    // ALTERNATIVE PROVIDERS (for redundancy and choice)
    openrouter_reasoning: { // Alternative reasoning via OpenRouter
      provider: "openrouter",
      api_key_env: "OPENROUTER_API_KEY",
      base_url_env: "OPENROUTER_BASE_URL",
      model_name: "deepseek/deepseek-chat",
      capabilities: ["reasoning", "alternative_provider"],
      use_cases: ["fallback_reasoning", "cost_optimization"]
    },
    openrouter_execution: { // Alternative execution via OpenRouter
      provider: "openrouter",
      api_key_env: "OPENROUTER_API_KEY",
      base_url_env: "OPENROUTER_BASE_URL", 
      model_name: "anthropic/claude-3.5-sonnet",
      capabilities: ["execution", "alternative_provider"],
      use_cases: ["fallback_execution", "specialized_tasks"]
    },
    
    // LEGACY TIERS (for backward compatibility - will be deprecated)
    s_tier: { // Legacy mapping to reasoning_tier
      provider: "google",
      api_key_env: "GOOGLE_API_KEY",
      model_name: "gemini-2.0-flash-thinking-exp",
    },
    a_tier: { // Legacy mapping to execution_tier
      provider: "google",
      api_key_env: "GOOGLE_API_KEY",
      model_name: "gemini-1.5-flash",
    },
    b_tier: { // Legacy mapping to utility_tier
      provider: "google",
      api_key_env: "GOOGLE_API_KEY",
      model_name: "gemini-1.5-flash-8b",
    }
  },
  
  // Execution options for development tasks
  execution_options: {
    internal_dev: {
      enabled: true,
      agent: "enhanced-dev",
      description: "Internal development using Stigmergy agents"
    },
    gemini_cli: {
      enabled: true,
      agent: "gemini-executor", 
      description: "External Gemini CLI for code generation"
    },
    qwen_cli: {
      enabled: true,
      agent: "qwen-executor",
      description: "External Qwen Code CLI for advanced algorithms"
    }
  }
};

export default config;
