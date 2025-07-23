# This is the single source of truth for agent capabilities and permissions for Stigmergy v1.0.
# The tool executor and LLM adapter use this to configure agent behavior.
schema_version: 5.1

agents:
  # --- Dispatcher ---
  - id: dispatcher
    alias: saul
    archetype: Dispatcher
    model_preference: "claude-3-haiku-20240307"
    tools: [file_system.readFile, system.approveExecution]

  # --- Planners ---
  - id: analyst
    alias: mary
    archetype: Planner
    model_preference: "claude-3-sonnet-20240229"
    tools: [web.search, scraper.scrapeUrl, file_system.writeFile]

  - id: pm
    alias: john
    archetype: Planner
    model_preference: "claude-3-sonnet-20240229"
    tools: [file_system.readFile, file_system.writeFile]

  - id: design-architect
    alias: winston
    archetype: Planner
    model_preference: "gpt-4-turbo"
    tools: [file_system.readFile, file_system.listFiles, file_system.writeFile]

  - id: ux-expert
    alias: sally
    archetype: Planner
    model_preference: "claude-3-haiku-20240307"
    tools: [web.search]

  # --- NEW: Gemini CLI Executor ---
  - id: gemini-executor
    alias: gemma
    archetype: Executor
    model_preference: "claude-3-haiku-20240307" # This agent only does prompting, so a fast model is fine.

  # --- Executors ---
  - id: dev
    alias: james
    archetype: Executor
    model_preference: "codestral-latest"
    tools: [file_system.readFile, file_system.writeFile, shell.execute, code_graph.findUsages, code_graph.getDefinition, system.requestSecret]
    permitted_shell_commands: ["npm install", "npm test", "npm run build"]

  - id: refactorer
    alias: rocco
    archetype: Executor
    model_preference: "codestral-latest"
    tools: [file_system.readFile, file_system.writeFile, shell.execute, code_graph.findUsages, system.requestSecret]
    permitted_shell_commands: ["npm run lint", "npm run format:check", "npx prettier --write ."]
    
  - id: victor
    alias: victor
    archetype: Executor
    model_preference: "codestral-latest"
    tools: [file_system.readFile, file_system.writeFile, web.search, shell.execute, system.requestSecret]
    permitted_shell_commands: ["npx hardhat compile", "npx hardhat test"]

  - id: sm
    alias: bob
    archetype: Executor
    model_preference: "claude-3-haiku-20240307"
    tools: [file_system.readFile, file_system.writeFile]

  - id: stigmergy-orchestrator
    alias: olivia
    archetype: Executor
    model_prefetools: [file_system.readFile, file_system.writeFile]

  # --- Verifiers ---
  - id: qa
    alias: quinn
    archetype: Verifier
    model_preference: "claude-3-haiku-20240307"
    tools: [shell.execute, system.requestSecret]
    permitted_shell_commands: ["npm run lint", "npm audit", "npm test -- --coverage", "npm run deploy:testnet"]

  - id: po
    alias: sarah
    archetype: Verifier
    model_preference: "claude-3-haiku-20240307"
    tools: [file_system.readFile]
  
  # --- Responders ---
  - id: debugger
    alias: dexter
    archetype: Responder
    model_preference: "gpt-4-turbo"
    tools: [file_system.readFile, file_system.writeFile, code_graph.findUsages, shell.execute]
    permitted_shell_commands: ["npm test"]

  - id: meta
    alias: metis
    archetype: Responder
    model_preference: "gpt-4-turbo"
    tools: [file_system.readFile, file_system.writeFile]
