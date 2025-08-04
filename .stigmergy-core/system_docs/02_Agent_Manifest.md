```yml
schema_version: 5.5

agents:
  # --- System ---
  - id: system
    alias: system
    name: "System Controller"
    icon: "⚙️"
    tools: [system.executeCommand]

  # --- Dispatcher ---
  - id: dispatcher
    alias: saul
    name: "Saul (Dispatcher)"
    icon: "🧠"
    tools: [file_system.readFile, system.updateStatus, system.approveExecution]

  # --- Planners ---
  - id: analyst
    alias: mary
    name: "Mary (Analyst)"
    icon: "📊"
    tools: [research.deep_dive, file_system.writeFile, system.updateStatus]

  - id: pm
    alias: john
    name: "John (PM)"
    icon: "📋"
    tools: [research.deep_dive, file_system.readFile, file_system.writeFile, system.updateStatus]

  - id: design-architect
    alias: winston
    name: "Winston (Architect)"
    icon: "🏗️"
    tools: [file_system.*, research.deep_dive, system.updateStatus]

  - id: ux-expert
    alias: sally
    name: "Sally (UX)"
    icon: "🎨"
    tools: [research.deep_dive]

  - id: design
    alias: vinci
    name: "Vinci (Designer)"
    icon: "🎨"
    tools: [research.deep_dive, file_system.writeFile, system.updateStatus]

  # --- Business Planners (NEW) ---
  - id: business_planner
    alias: brian
    name: "Brian (Business)"
    icon: "📈"
    tools: [research.deep_dive, file_system.writeFile, system.updateStatus, business.*]

  - id: valuator
    alias: val
    name: "Val (Valuation)"
    icon: "💰"
    tools: [file_system.readFile, system.updateStatus, business.*]

  - id: whitepaper_writer
    alias: whitney
    name: "Whitney (Whitepaper)"
    icon: "📜"
    tools: [file_system.readFile, file_system.writeFile, system.updateStatus, business.*]

  # --- Executors ---
  - id: gemini-executor
    alias: gemma
    name: "Gemma (Gemini)"
    icon: "✨"
    tools: [gemini.execute, file_system.readFile]

  - id: dev
    alias: james
    name: "James (Dev)"
    icon: "💻"
    tools: [file_system.*, shell.execute, code_intelligence.*]
    permitted_shell_commands:
      - "npm install"
      - "npm test"
      - "npm run lint"
      - "jest *"

  - id: refactorer
    alias: rocco
    name: "Rocco (Refactorer)"
    icon: "🔧"
    tools: [file_system.*, shell.execute, code_intelligence.*]
    permitted_shell_commands: ["npm *"]

  # --- Verifiers ---
  - id: qa
    alias: quinn
    name: "Quinn (QA)"
    icon: "🛡️"
    tools: [shell.execute, file_system.readFile, code_intelligence.*]
    permitted_shell_commands: ["npm test", "npm run lint", "npm audit"]

  # --- Responders ---
  - id: debugger
    alias: dexter
    name: "Dexter (Debugger)"
    icon: "🎯"
    tools: [file_system.*, code_intelligence.*, shell.execute]
    permitted_shell_commands: ["npm test", "jest *"]

  - id: meta
    alias: metis
    name: "Metis (Auditor)"
    icon: "📈"
    tools: [file_system.readFile, file_system.writeFile, stigmergy.createBlueprint]
```
