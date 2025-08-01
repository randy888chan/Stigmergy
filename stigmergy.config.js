import path from "path";

const config = {
  // --- Core Paths ---
  corePath: ".stigmergy-core",
  aiArtifacts: ".ai",
  stateFile: path.join(".ai", "state.json"),
  storiesPath: path.join(".ai", "stories"),
  proposalsPath: "system-proposals",

  // --- Agent Preferences ---
  executor_preference: "gemini", // Options: 'gemini' or 'native'.

  // --- Logging & Debugging ---
  logging: {
    debug_log: path.join(".ai", "debug.log"),
    agent_core_dump: path.join(".ai", "core-dump.md"),
  },

  // --- Core Project Planning Documents ---
  docs: {
    brief: "docs/brief.md",
    market_research: "docs/market-research.md",
    competitor_analysis: "docs/competitor-analysis.md",
    prd: "docs/prd.md",
    architecture: "docs/architecture.md",
    tech_stack: "docs/architecture/tech-stack.md",
    coding_standards: "docs/architecture/coding-standards.md",
    api_endpoints: "docs/architecture/rest-api-spec.md",
    qa_protocol: "docs/architecture/qa-protocol.md",
  },

  // --- Business Planning Documents (NEW) ---
  business_docs: {
    business_plan: "docs/business-plan.md",
    valuation_report: "docs/valuation-report.md",
    tokenomics_plan: "docs/tokenomics-plan.md",
    crypto_whitepaper: "docs/crypto-whitepaper.md",
  },

  // --- Context Injection ---
  dev_load_always_files: [
    "docs/architecture/tech-stack.md",
    "docs/architecture/coding-standards.md",
    "docs/architecture/rest-api-spec.md",
  ],
};

export default config;
