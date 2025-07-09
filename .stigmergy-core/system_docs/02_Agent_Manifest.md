# Stigmergy Agent Manifest

# This is a machine-readable document. It is the single source of truth for agent capabilities.

# The Chief Strategist (@saul) queries this manifest to make deterministic dispatch decisions.

schema_version: 1.0

agents:

- id: saul
  archetype: Interpreter
  description: The master brain. Interprets user goals and system state to direct the swarm.
  tools: [state_reader, manifest_reader]

- id: mary
  archetype: Planner
  description: Proactive Market Analyst. Creates the foundational Project Brief with commercial insights.
  tools: [browser, search]

- id: john
  archetype: Planner
  description: Strategic Product Manager. Creates the PRD and the master Project Manifest.
  tools: [browser, state_writer]

- id: winston
  archetype: Planner
  description: Solution Architect. Creates the lean, verifiable technical blueprint.
  tools: [browser, search]

- id: olivia
  archetype: Executor
  description: Execution Coordinator. Manages the dev->verify loop for a single story.
  tools: [dispatcher]

- id: bob
  archetype: Executor
  description: Task Decomposer. Breaks down epics from the manifest into actionable story files.
  tools: [file_generator, context_extractor]

- id: james
  archetype: Executor
  description: Expert Software Engineer. Implements code for specific, well-defined sub-tasks.
  tools: [code_writer, file_reader]

- id: victor
  archetype: Executor
  description: Expert Smart Contract Developer. A specialist for secure blockchain development.
  tools: [code_writer, browser, test_runner]

- id: rocco
  archetype: Executor
  description: Code & System Quality Specialist. Applies refactors and system self-improvements.
  tools: [code_modifier, validator]

- id: quinn
  archetype: Verifier
  description: Quality Assurance Gatekeeper. Programmatically verifies code against the QA Protocol.
  tools: [test_runner, linter]

- id: sarah
  archetype: Verifier
  description: Product Owner. Programmatically validates that a final artifact meets the manifest's acceptance criteria.
  tools: [artifact_checker]

- id: dexter
  archetype: Responder
  description: Root Cause Analyst. Diagnoses and proposes solutions for failures logged in the state file.
  tools: [log_reader, code_analyzer]

- id: metis
  archetype: Responder
  description: System Auditor. Analyzes swarm performance history and proposes concrete improvements.
  tools: [state_history_analyzer, proposal_writer]
