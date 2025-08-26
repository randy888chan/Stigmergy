import path from "path";
import "dotenv/config";

const config = {
  corePath: ".stigmergy-core",
  features: {
    neo4j: "auto", // Options: 'required', 'auto', 'memory'
  },
  model_tiers: {
    s_tier: { // Strategic/Reasoning -> Using Deepseek
      provider: "deepseek",
      api_key_env: "DEEPSEEK_API_KEY",
      base_url_env: "DEEPSEEK_BASE_URL",
      model_name: "deepseek/deepseek-chat",
    },
    a_tier: { // Advanced/Execution -> Using Gemini via OpenRouter for compatibility
      provider: "openrouter",
      api_key_env: "OPENROUTER_API_KEY",
      base_url_env: "OPENROUTER_BASE_URL",
      model_name: "google/gemini-pro-1.5",
    },
    b_tier: { // Basic/Utility -> Using Mistral
      provider: "mistral",
      api_key_env: "MISTRAL_API_KEY",
      base_url_env: "MISTRAL_BASE_URL",
      model_name: "mistralai/mistral-7b-instruct",
    },
    c_tier: { // Specialized/Long-Context -> Using Kimi
        provider: "kimi",
        api_key_env: "KIMI_API_KEY",
        base_url_env: "KIMI_BASE_URL",
        model_name: "moonshot-v1-128k", // Using a more realistic model name
    }
  },
};

export default config;
