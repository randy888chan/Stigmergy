import path from "path";
import "dotenv/config";

const config = {
  corePath: ".stigmergy-core",
  features: {
    neo4j: "auto", // Options: 'required', 'auto', 'memory'
  },
  model_tiers: {
    s_tier: {
      provider: "openrouter",
      model_name: "anthropic/claude-3-opus",
      provider_env_key: "OPENROUTER_API_KEY",
    },
    a_tier: {
      provider: "openai",
      model_name: "gpt-4o",
      provider_env_key: "OPENAI_API_KEY",
    },
    b_tier: {
      provider: "openrouter",
      model_name: "anthropic/claude-3-haiku",
      provider_env_key: "OPENROUTER_API_KEY",
    },
  },
};

export default config;
