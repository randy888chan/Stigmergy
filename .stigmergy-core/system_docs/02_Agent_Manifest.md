# Pheromind Agent Manifest
# This is a machine-readable document. It is the single source of truth for agent capabilities.

schema_version: 2.0

agents:
  - id: winston
    archetype: Planner
    tools: [browser, search, gitmcp, semgrep, tree]
  - id: mary
    archetype: Planner
    tools: [browser, search]
  - id: john
    archetype: Planner
    tools: [browser, search, state_writer]
  - id: sally
    archetype: Planner
    tools: [browser, search]
  - id: saul
    archetype: Dispatcher
    tools: [state_reader, task_dispatcher]
  - id: olivia
    archetype: Executor
    tools: [task_decomposer]
  - id: james
    archetype: Executor
    tools: [code_writer, file_reader, terminal, git]
  - id: victor
    archetype: Executor
    tools: [code_writer, browser, test_runner, terminal]
  - id: rocco
    archetype: Executor
    tools: [code_modifier, validator, terminal, analyzer]
  - id: quinn
    archetype: Verifier
    tools: [test_runner, linter, terminal, schema_validator]
  - id: sarah
    archetype: Verifier
    tools: [artifact_checker]
  - id: dexter
    archetype: Responder
    tools: [log_reader, code_analyzer, browser, test_writer]
  - id: metis
    archetype: Responder
    tools: [state_history_analyzer, proposal_writer]
