# This is the single source of truth for agent capabilities and permissions for Stigmergy v1.0.

schema_version: 5.1

agents:

# --- Dispatcher ---

- id: dispatcher
  alias: saul
  tools: [file_system.readFile, system.approveExecution]

# --- Planners ---

- id: analyst
  alias: mary
  tools: [web.search, scraper.scrapeUrl, file_system.writeFile]

- id: pm
  alias: john
  tools: [file_system.readFile, file_system.writeFile]

- id: design-architect
  alias: winston
  tools: [file_system.readFile, file_system.listFiles, file_system.writeFile]

- id: ux-expert
  alias: sally
  tools: [web.search]

# --- Executors ---

- id: gemini-executor
  alias: gemma

- id: dev
  alias: james
  tools: [file_system.readFile, file_system.writeFile, shell.execute, code_graph.findUsages, code_graph.getDefinition, system.requestSecret]

- id: refactorer
  alias: rocco
  tools: [file_system.readFile, file_system.writeFile, shell.execute, code_graph.findUsages, system.requestSecret]
- id: victor
  alias: victor
  tools: [file_system.readFile, file_system.writeFile, web.search, shell.execute, system.requestSecret]

- id: sm
  alias: bob
  tools: [file_system.readFile, file_system.writeFile]

- id: stigmergy-orchestrator
  alias: olivia
  tools: [file_system.readFile, file_system.writeFile]

# --- Verifiers ---

- id: qa
  alias: quinn
  tools: [shell.execute, system.requestSecret]

- id: po
  alias: sarah
  tools: [file_system.readFile]

# --- Responders ---

- id: debugger
  alias: dexter
  tools: [file_system.readFile, file_system.writeFile, code_graph.findUsages, shell.execute]

- id: meta
  alias: metis
  tools: [file_system.readFile, file_system.writeFile, stigmergy.createBlueprint]
