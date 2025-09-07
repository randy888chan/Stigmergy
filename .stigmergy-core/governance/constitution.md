# Stigmergy Constitution

## Core Principles

### I. Reference-First Development
Every feature starts with finding proven patterns and solutions rather than generating from scratch. Solutions should be synthesized from existing, verified code patterns and architectural blueprints.

### II. Test-First Imperative (NON-NEGOTIABLE)
All implementation MUST follow strict Test-Driven Development.
No implementation code shall be written before:
1. Unit tests are written
2. Tests are validated and approved by the system
3. Tests are confirmed to FAIL (Red phase)

### III. Simplicity and Anti-Abstraction
Avoid over-engineering and unnecessary layers:
- Maximum 3 core project components for initial implementation
- Use framework features directly rather than wrapping them
- Single data model representation (no DTOs unless serialization differs)
- Avoid patterns like Repository/UnitOfWork without proven need

### IV. AI-Verifiable Outcomes
All outcomes must be programmatically verifiable:
- Every project milestone has verifiable outputs
- All verification results stored with timestamps and agent signatures
- Four-dimensional verification: Technical, Functional, Architectural, Business

### V. Integration Testing
Focus areas requiring integration tests:
- New library contract tests
- Contract changes
- Inter-service communication
- Shared schemas
- Real dependencies used (actual DBs, not mocks)

### VI. Observability
Everything must be inspectable:
- Structured logging required
- Frontend logs → backend for unified stream
- Error context must be sufficient for debugging

### VII. Versioning & Breaking Changes
- MAJOR.MINOR.BUILD format
- BUILD increments on every change
- Breaking changes require parallel tests and migration plan

## Additional Constraints

### Agent Communication Protocol
- All communication between agents must use strictly validated schemas
- LLM responses must be parsed with robust error handling
- No fragile parsing mechanisms - responses must be structured JSON

### Error Handling
- Single, authoritative error handling module
- All errors must be classified and have remediation steps
- Error context must be preserved for debugging

### Security Requirements
- All dependencies must pass security audit (no high/critical vulnerabilities)
- API keys and secrets must be properly managed
- Input validation required for all external inputs

## Development Workflow

### Specification Process
1. Every new feature must start with a clear, unambiguous specification
2. Technical plans must be created before implementation
3. Plans become input for the Reference-First architecture

### Debugging Protocol
1. First action when given a bug report MUST be to write a failing test
2. Only after test is in place may code fixes be applied
3. All fixes must be verified by the QA agent

### Quality Assurance
1. QA agent must verify constitutional compliance
2. Dependency vulnerability scanning required
3. Static analysis must pass before code is accepted

## Governance

This constitution supersedes all other practices. All PRs and reviews must verify compliance with these principles.

Amendments to this constitution require:
- Explicit documentation of the rationale for change
- Review and approval by project maintainers
- Backwards compatibility assessment

Complexity must be justified. Use this document for runtime development guidance.

**Version**: 1.0.0 | **Ratified**: 2025-09-07 | **Last Amended**: 2025-09-07