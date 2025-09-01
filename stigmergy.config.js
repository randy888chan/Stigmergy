import path from "path";
import "dotenv/config";

const config = {
  corePath: ".stigmergy-core",
  features: {
    neo4j: "auto", // Options: 'required', 'auto', 'memory'
    automation_mode: "autonomous", // Options: 'autonomous', 'approval_required', 'hybrid'
    provider_isolation: true, // Enable provider context awareness
  },
  model_tiers: {
    s_tier: { // Strategic/Reasoning -> Using OpenRouter with Deepseek
      provider: "openrouter",
      api_key_env: "OPENROUTER_API_KEY",
      base_url_env: "OPENROUTER_BASE_URL",
      model_name: "deepseek/deepseek-chat",
    },
    a_tier: { // Advanced/Execution -> Using OpenRouter with Claude
      provider: "openrouter",
      api_key_env: "OPENROUTER_API_KEY",
      base_url_env: "OPENROUTER_BASE_URL",
      model_name: "anthropic/claude-3.5-sonnet",
    },
    b_tier: { // Basic/Utility -> Using OpenRouter with GPT-4o-mini
      provider: "openrouter",
      api_key_env: "OPENROUTER_API_KEY",
      base_url_env: "OPENROUTER_BASE_URL",
      model_name: "openai/gpt-4o-mini",
    },
    c_tier: { // Specialized/Long-Context -> Using OpenRouter with Gemini
      provider: "openrouter",
      api_key_env: "OPENROUTER_API_KEY",
      base_url_env: "OPENROUTER_BASE_URL",
      model_name: "google/gemini-pro-1.5",
    }
  },
};

export default config;
