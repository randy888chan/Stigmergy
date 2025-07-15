# This is the single source of truth for agent capabilities and permissions.
# The tool executor and LLM adapter use this to configure agent behavior.
```yml
schema_version: 5.0

agents:
  # --- Planners ---
  - id: design-architect
    alias: winston
    archetype: Planner
    model_preference: "gpt-4-turbo"
    tools: [file_system.readFile, file_system.listFiles, file_system.writeFile, shell.execute]
    permitted_shell_commands: ["ls -l"] # Example of a safe, read-only command

  - id: analyst
    alias: mary
    archetype: Planner
    model_preference: "claude-3-sonnet-20240229"
    tools: [web.search, scraper.scrapeUrl]

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
    model_preference: "codestral-latest"
    tools: [file_system.readFile, file_system.writeFile, shell.execute, code_graph.findUsages, code_graph.getDefinition, code_graph.getModuleDependencies]
    permitted_shell_commands: ["npm install", "npm test", "npm run build"] # Example of dev-related commands

  - id: refactorer
    alias: rocco
    archetype: Executor
    model_preference: "codestral-latest"
    tools: [file_system.readFile, file_system.writeFile, shell.execute, code_graph.findUsages]

  # --- Dispatcher ---
  - id: dispatcher
    alias: saul
    archetype: Dispatcher
    model_preference: "claude-3-haiku-20240307"
    tools: [file_system.readFile]

  # --- Verifiers ---
  - id: qa
    alias: quinn
    archetype: Verifier
    model_preference: "claude-3-haiku-20240307"
    tools: [shell.execute]
    permitted_shell_commands: ["npm run lint", "npm audit", "npm test -- --coverage"]

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
