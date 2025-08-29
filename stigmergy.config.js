import path from "path";
import "dotenv/config";

const config = {
  corePath: ".stigmergy-core",
  features: {
    neo4j: "required", // Options: 'required', 'auto', 'memory'
  },
  model_tiers: {
    s_tier: { // Strategic/Reasoning -> Using Deepseek
      provider: "openrouter",
      api_key_env: "OPENROUTER_API_KEY",
      base_url_env: "OPENROUTER_BASE_URL",
      model_name: "deepseek/deepseek-chat-v3.1:free",
    },
    a_tier: { // Advanced/Execution -> Using Gemini via OpenRouter for compatibility
      provider: "kimi",
      api_key_env: "KIMI_API_KEY",
      base_url_env: "KIMI_BASE_URL",
      model_name: "kimi-k2-0711-preview",
    },
    b_tier: { // Basic/Utility -> Using Mistral
      provider: "deepseek",
      api_key_env: "DEEPSEEK_API_KEY",
      base_url_env: "DEEPSEEK_BASE_URL",
      model_name: "deepseek/deepseek-chat",
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
