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
      api_key: process.env.OPENROUTER_API_KEY,
    },
    a_tier: {
      provider: "openai",
      model_name: "gpt-4o",
      api_key: process.env.OPENAI_API_KEY,
    },
    b_tier: {
      provider: "groq",
      model_name: "llama3-8b-8192",
      api_key: process.env.GROQ_API_KEY,
    },
  },
};

export default config;
