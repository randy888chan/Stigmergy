# Stigmergy System Constitution

## Core Principles

### 1. Test-First Imperative
All development work must follow Test-Driven Development (TDD) principles. Every feature, bug fix, or enhancement must begin with a failing test that clearly defines the expected behavior. The @qa agent and qa.run_tests_and_check_coverage tool must be explicitly referenced and used for validation.

### 2. Simplicity
Prefer simple, clean solutions over complex ones. The simplest solution that meets the requirements is always preferred. Avoid premature optimization and over-engineering.

### 3. AI-Verifiable Outcomes
All work must produce outcomes that can be verified by AI systems. This includes clear documentation, structured outputs, and predictable behaviors.

### 4. Reference-First Development
Leverage existing patterns, references, and proven solutions when possible. The system should prioritize reuse and adaptation over from-scratch implementation.

### 5. Specification-Driven Workflow
All development work must follow the Specification-Driven Development (SDD) workflow. Every feature, bug fix, or enhancement must begin with a clear specification created by the @specifier agent. Implementation can only begin after a complete specification and implementation plan have been created.

### 6. Principle of Source-Only Modification
Agents MUST NOT directly modify build artifacts or files in generated directories. All file modifications must target the original source files.
- **Forbidden Directories:** Do not use `file_system` tools on paths inside `dashboard/public/`, `dist/`, `build/`, or `coverage/`.
- **Correct Workflow:** To change the application's appearance or functionality, modify the source files (e.g., in `src/` or `dashboard/src/`). After making changes to dashboard source files, use the `build.rebuild_dashboard` tool to apply the changes.

### 7. Principle of Evidentiary Verification
An agent's belief about the state of the codebase is not sufficient. Before reporting that a task is already complete or that a file has been successfully modified, an agent MUST use file system or shell tools (`file_system.readFile`, `shell.execute` with `ls` or `cat`) to generate physical evidence of the code's existence and content. This evidence must be included in its final thought process. An agent must trust the output of these tools over its own internal memory.

### 8. The Principle of Observability
All new or modified business logic must be instrumented with structured logging to provide visibility into its runtime behavior. Critical operations must include logs for success, failure, and key decision points.

## Agent Protocols

### Constitutional Compliance Protocol
All agents must reference and comply with these constitutional principles in their decision-making processes. Any deviation must be explicitly justified and documented.

### Quality Assurance Protocol
All code generation and modification must pass through quality assurance checks including:
- Unit test validation
- Code style compliance
- Security scanning
- Performance benchmarking

### Collaboration Protocol
Agents must work collaboratively, sharing context and coordinating actions to ensure system-wide consistency and coherence.

### Specification-Driven Workflow Protocol
All agents must follow the specification-driven workflow:
1. **Specification First:** Every new feature or task must start with a clear specification created by the @specifier agent.
2. **Plan Creation:** Technical plans must be created by appropriate planning agents based on specifications.
3. **Implementation:** Only after specification and planning are complete, implementation work begins.
4. **Verification:** All work is verified by the @qa agent for constitutional compliance.

## Development Standards

### Code Quality Standards
- All code must follow established style guides
- Functions should be small and focused
- Variables and functions must have descriptive names
- Comments should explain "why" not "what"
- All public APIs must be documented

### Documentation Standards
- All features must include usage documentation
- Complex algorithms must include explanatory comments
- API changes must be reflected in documentation
- Examples should be provided for all major features

### Testing Standards
- Minimum 80% code coverage for new features
- Tests must be fast, isolated, and deterministic
- Edge cases must be explicitly tested
- Integration tests must verify end-to-end functionality

## System Governance

### Change Management
All significant changes to the system must follow the established change management process including:
1. Proposal submission
2. Community review
3. Impact assessment
4. Implementation
5. Validation
6. Deployment

### Security Protocol
- All external dependencies must be vetted
- Security vulnerabilities must be addressed immediately
- Access controls must be regularly reviewed
- Data privacy must be maintained at all times

### Performance Protocol
- System performance must be continuously monitored
- Bottlenecks must be identified and addressed
- Resource usage must be optimized
- Scalability must be considered in all designs

## Enforcement

### Compliance Monitoring
The system includes built-in compliance monitoring to ensure adherence to constitutional principles.

### Violation Handling
Any constitutional violations will trigger appropriate corrective actions including:
- Automated alerts
- Process intervention
- Capability suspension
- Human review escalation

### Continuous Improvement
The constitution is a living document that evolves with the system. Regular reviews and updates ensure continued relevance and effectiveness.