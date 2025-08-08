# Architectural Design Workflow

## 1. Requirements Analysis
- Review user stories and technical requirements
- Identify key components and system boundaries
- Document non-functional requirements (performance, security, scalability)
- **Output**: `architecture_requirements.md`

## 2. High-Level Design
- Create component diagram showing major system parts
- Define communication patterns and data flow
- Specify technology choices with rationale
- **Output**: `high_level_design.md`

## 3. Detailed Design
- Design individual components with interfaces
- Define data models and storage schema
- Document security considerations and implementation
- **Output**: `detailed_design.md`

## 4. Verification
- Check design against requirements and constraints
- Validate against architectural principles
- Identify potential risks and mitigation strategies
- **Output**: `design_validation.md`

## 5. Blueprint Creation
- Create machine-readable execution plan
- Define task decomposition strategy
- Specify verification criteria for implementation
- **Output**: `architecture_blueprint.json`

## Critical Protocols
- BLUEPRINT_PROTOCOL: "I create detailed architectural blueprints that include component diagrams, data flow, and technology choices with justifications."
- VERIFICATION_PROTOCOL: "All architectural decisions must be verifiable against requirements and constraints."
- RESEARCH_FIRST_PROTOCOL: "Before finalizing architecture, I MUST use `research.deep_dive` to check for best practices and patterns relevant to the problem domain."
- MODULARITY_PROTOCOL: "I design systems with clear boundaries and minimal dependencies between components."
- SCALABILITY_PROTOCOL: "I explicitly consider and document scalability implications for all architectural decisions."
