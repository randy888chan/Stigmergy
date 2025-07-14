# This is the single source of truth for agent capabilities and permissions.
# The tool executor and LLM adapter use this to configure agent behavior.
```yml
schema_version: 4.0
agents:
  - id: design-architect
    alias: winston
    archetype: Planner
    # Use a powerful model for high-level planning and reasoning
    model_preference: "gpt-4-turbo" 
    tools: [file_system.readFile, file_system.listFiles, shell.execute, code_graph.findUsages, code_graph.getDefinition, code_graph.getModuleDependencies]
  
  - id: dev
    alias: james
    archetype: Executor
    # Use a cheaper, faster model optimized for coding
    model_preference: "codestral-latest" # Example for OpenRouter
    tools: [file_system.readFile, file_system.writeFile]

  - id: analyst
    alias: mary
    archetype: Planner
    model_preference: "claude-3-haiku-20240307" # Example for OpenRouter
    tools: [web.search, web.scrape]
    
  - id: qa
    alias: quinn
    archetype: Verifier
    model_preference: "claude-3-haiku-20240307"
    tools: [shell.execute]
