# This is the single source of truth for agent capabilities and permissions.

# The installer reads this file to generate IDE permissions (.roomodes).

schema_version: 5.3

agents:

# --- Dispatcher ---

- id: dispatcher
  alias: saul
  name: "Saul (Dispatcher)"
  icon: "🧠"
  tools: [file_system.readFile, system.approve]

# --- Planners ---

- id: analyst
  alias: mary
  name: "Mary (Analyst)"
  icon: "📊"
  tools: [web.search, scraper.scrapeUrl, file_system.writeFile, system.updateStatus]

- id: pm
  alias: john
  name: "John (PM)"
  icon: "📋"
  tools: [file_system.readFile, file_system.writeFile, system.updateStatus]

- id: design-architect
  alias: winston
  name: "Winston (Architect)"
  icon: "🏗️"
  tools: [file_system.*, web.search, scraper.scrapeUrl, system.updateStatus]

- id: ux-expert
  alias: sally
  name: "Sally (UX)"
  icon: "🎨"
  tools: [web.search, scraper.scrapeUrl]

# --- Executors ---

- id: gemini-executor
  alias: gemma
  name: "Gemma (Gemini)"
  icon: "✨"
  tools: [gemini.execute]

- id: dev
  alias: james
  name: "James (Dev)"
  icon: "💻"
  tools: [file_system.*, shell.execute, code_graph.*]
  permitted_shell_commands:
  - "npm install"
  - "npm test"
  - "npm run lint"
  - "jest \*"

- id: refactorer
  alias: rocco
  name: "Rocco (Refactorer)"
  icon: "🔧"
  tools: [file_system.*, shell.execute, code_graph.*]
  permitted_shell_commands: ["npm *"]

- id: victor
  alias: victor
  name: "Victor (Solidity)"
  icon: "📜"
  tools: [file_system.*, web.search, shell.execute]
  permitted_shell_commands: ["npm *"]

- id: sm
  alias: bob
  name: "Bob (Decomposer)"
  icon: "分解"
  tools: [file_system.readFile, file_system.writeFile]

- id: stigmergy-orchestrator
  alias: olivia
  name: "Olivia (Cognitive Decomposer)"
  icon: "🧠"
  tools: [file_system.readFile, file_system.writeFile]

# --- Verifiers ---

- id: qa
  alias: quinn
  name: "Quinn (QA)"
  icon: "🛡️"
  tools: [shell.execute]
  permitted_shell_commands: ["npm test", "npm run lint", "npm audit"]

- id: po
  alias: sarah
  name: "Sarah (PO)"
  icon: "📝"
  tools: [file_system.readFile]

# --- Responders ---

- id: debugger
  alias: dexter
  name: "Dexter (Debugger)"
  icon: "🎯"
  tools: [file_system.*, code_graph.*, shell.execute]
  permitted_shell_commands: ["npm test", "jest *"]

- id: meta
  alias: metis
  name: "Metis (Auditor)"
  icon: "📈"
  tools: [file_system.readFile, stigmergy.createBlueprint]
