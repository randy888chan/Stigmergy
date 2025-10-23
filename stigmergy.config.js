
// This file now only contains the static part of the configuration.
// Environment loading, dynamic values, and validation are handled by services/config_service.js

const config = {
  corePath: ".stigmergy-core",
  security: {
    allowedDirs: [
      "src",
      "public",
      "docs",
      "tests",
      "scripts",
      "agents",
      ".ai",
      ".vscode",
      "specs"
    ],
    maxFileSizeMB: 1,
    generatedPaths: [
      "dashboard/public",
      "dist",
      "build",
      "coverage"
    ]
  },
  features: {
    neo4j: "auto", // Options: 'required', 'auto', 'memory'
    automation_mode: "autonomous", // Options: 'autonomous', 'approval_required', 'hybrid'
    provider_isolation: true, // Enable provider context awareness
    deepcode_integration: true, // Enable reference-first architecture
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
  model_tiers: {
    // These are now base templates. The ConfigService will override them with env vars.
    reasoning_tier: {
      provider: "openrouter",
      model_name: "deepseek/deepseek-chat-v3.1:free",
      api_key_env: "OPENROUTER_API_KEY",
      base_url_env: "OPENROUTER_BASE_URL",
      capabilities: ["reasoning", "planning", "analysis"],
      use_cases: ["complex_planning", "architectural_decisions", "problem_solving"]
    },
    vision_tier: {
      provider: "openrouter",
      model_name: "anthropic/claude-3.5-sonnet",
      api_key_env: "OPENROUTER_API_KEY",
      base_url_env: "OPENROUTER_BASE_URL",
      capabilities: ["vision", "reasoning"],
      use_cases: ["ui_analysis", "design_feedback"]
    },
    strategic_tier: {
      provider: "openrouter",
      model_name: "deepseek/deepseek-chat-v3.1:free",
      api_key_env: "OPENROUTER_API_KEY",
      base_url_env: "OPENROUTER_BASE_URL",
      capabilities: ["reasoning", "strategic_thinking"],
      use_cases: ["business_planning", "technical_architecture", "research"]
    },
    execution_tier: {
      provider: "openrouter",
      model_name: "deepseek/deepseek-chat-v3.1:free",
      api_key_env: "OPENROUTER_API_KEY",
      base_url_env: "OPENROUTER_BASE_URL",
      capabilities: ["fast_execution", "code_generation"],
      use_cases: ["code_implementation", "documentation", "testing"]
    },
    utility_tier: {
      provider: "openrouter",
      model_name: "deepseek/deepseek-chat-v3.1:free",
      api_key_env: "OPENROUTER_API_KEY",
      base_url_env: "OPENROUTER_BASE_URL",
      capabilities: ["lightweight", "quick_tasks"],
      use_cases: ["simple_tasks", "validation", "formatting"]
    },
    codestral_utility: {
      provider: "mistral",
      api_key_env: "CODESTRAL_API_KEY",
      base_url_env: "CODESTRAL_BASE_URL",
      model_name: "codestral-latest",
      capabilities: ["code_completion", "fast_utility", "code_refactoring"],
      use_cases: ["code_snippet_generation", "test_case_generation", "code_formatting"]
    },
  },
  collaboration: {
    mode: 'single-player', // 'single-player' or 'team'
    server_url: 'http://localhost:3012'
  }
};

export default config;
