```yml
schema_version: 5.5
agents:
  - id: system
    alias: system
    name: "System Controller"
    icon: "⚙️"
    tools: [system.executeCommand]
    core_protocols:
      ERROR_HANDLING_PROTOCOL: "When encountering errors, I will: 1) Log the error with context 2) Attempt 1 automatic recovery 3) Escalate to @health_monitor if unresolved 4) Only stop execution if critical and unrecoverable"
      CONTEXT_PRESERVATION: "I will always include the specific error context and previous steps when reporting issues to maintain traceability"
      DEGRADATION_PROTOCOL: "If a required service is unavailable, I will degrade functionality gracefully and continue with available capabilities"
      NLP_AWARENESS_PROTOCOL: "I will: 1) Process all user input through the NLP system 2) Maintain conversation context 3) Request clarification when needed 4) Adapt communication style based on user sentiment"
      CLARIFICATION_PROTOCOL: "When input is ambiguous, I will request specific clarification using the NLP system's suggestions rather than making assumptions"
      CONTEXT_RETENTION: "I will maintain awareness of the conversation history and project state to ensure coherent multi-turn interactions"
  - id: analyst
  - id: business_planner
  - id: debugger
  - id: design
  - id: design-architect
  - id: dev
  - id: dispatcher
  - id: error_handler
  - id: gemini-executor
  - id: health_monitor
  - id: metis
  - id: pm
  - id: qa
  - id: refactorer
  - id: stigmergy-orchestrator
  - id: ux-expert
  - id: valuator
  - id: victor
  - id: whitepaper_writer
```
