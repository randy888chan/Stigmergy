# This is the single source of truth for agent capabilities and permissions.
# The tool executor and LLM adapter use this to configure agent behavior.
```yml
schema_version: 4.0

agents:
  # --- Planners ---
  - id: design-architect
    alias: winston
    archetype: Planner
    model_preference: "gpt-4-turbo" # High-level reasoning requires a top-tier model
    tools: [file_system.readFile, file_system.listFiles, file_system.writeFile, shell.execute, code_graph.findUsages, code_graph.getDefinition, code_graph.getModuleDependencies]

  - id: analyst
    alias: mary
    archetype: Planner
    model_preference: "claude-3-sonnet-20240229"
    tools: [web.search, web.scrape]
  
  - id: pm
    alias: john
    archetype: Planner
    model_preference: "claude-3-sonnet-20240229"
    tools: [file_system.readFile, file_system.writeFile]

  - id: ux-expert
    alias: sally
    archetype: Planner
    model_preference: "claude-3-haiku-20240307"
    tools: [web.search]

  # --- Executors ---
  - id: dev
    alias: james
    archetype: Executor
    model_preference: "codestral-latest" # Optimized for code generation
    tools: [file_system.readFile, file_system.writeFile]
  
  - id: refactorer
    alias: rocco
    archetype: Executor
    model_preference: "codestral-latest"
    tools: [file_system.readFile, file_system.writeFile, shell.execute, code_graph.findUsages]

  - id: victor
    alias: victor
    archetype: Executor
    model_preference: "codestral-latest"
    tools: [file_system.readFile, file_system.writeFile, web.search]

  - id: sm # Task Decomposer
    alias: bob
    archetype: Executor
    model_preference: "claude-3-haiku-20240307"
    tools: [file_system.readFile]

  - id: stigmergy-orchestrator
    alias: olivia
    archetype: Executor
    model_preference: "claude-3-haiku-20240307"
    tools: [file_system.readFile, file_system.writeFile]

  # --- Dispatcher ---
  - id: dispatcher
    alias: saul
    archetype: Dispatcher
    model_preference: "claude-3-haiku-20240307" # Needs to be fast and cheap for routing
    tools: [file_system.readFile] # To read manifests/plans

  # --- Verifiers ---
  - id: qa
    alias: quinn
    archetype: Verifier
    model_preference: "claude-3-haiku-20240307"
    tools: [shell.execute] # To run linters, tests, etc.
  
  - id: po
    alias: sarah
    archetype: Verifier
    model_preference: "claude-3-haiku-20240307"
    tools: [file_system.readFile] # To read story files and acceptance criteria

  # --- Responders ---
  - id: debugger
    alias: dexter
    archetype: Responder
    model_prefetence: "gpt-4-turbo" # Debugging requires strong reasoning
    tools: [file_system.readFile, file_system.writeFile, code_graph.findUsages, shell.execute]
  
  - id: meta
    alias: metis
    archetype: Responder
    model_preference: "gpt-4-turbo" # System self-improvement requires a top-tier model
    tools: [file_system.readFile, file_system.writeFile]
