# Stigmergy Agent Manifest
# This is a machine-readable document. It is the single source of truth for agent capabilities.

schema_version: 1.1

agents:
  - id: saul
    archetype: Interpreter
    tools: [state_reader, manifest_reader]
  - id: mary
    archetype: Planner
    tools: [browser, search]
  - id: john
    archetype: Planner
    tools: [browser, search, state_writer]
  - id: winston
    archetype: Planner
    tools: [browser, search]
  - id: sally
    archetype: Planner
    tools: [browser, search]
  - id: olivia
    archetype: Executor
    tools: [dispatcher]
  - id: bob
    archetype: Executor
    tools: [file_generator, context_extractor]
  - id: james
    archetype: Executor
    tools: [code_writer, file_reader, terminal]
  - id: victor
    archetype: Executor
    tools: [code_writer, browser, test_runner, terminal]
  - id: rocco
    archetype: Executor
    tools: [code_modifier, validator, terminal]
  - id: quinn
    archetype: Verifier
    tools: [test_runner, linter, terminal]
  - id: sarah
    archetype: Verifier
    tools: [artifact_checker]
  - id: dexter
    archetype: Responder
    tools: [log_reader, code_analyzer, browser]
  - id: metis
    archetype: Responder
    tools: [state_history_analyzer, proposal_writer]
