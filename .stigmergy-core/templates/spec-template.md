# Feature Specification: [FEATURE NAME]

**Input**: User description of desired functionality
**Prerequisites**: None (this is the first step)

## Execution Flow (main)
```
1. Parse user description for key concepts and requirements
2. Extract functional and non-functional requirements
3. Identify ambiguous or unclear requirements
4. Mark ambiguities with [NEEDS CLARIFICATION]
5. Define key entities if data is involved
6. Create user stories based on requirements
7. Generate review and acceptance checklist
8. Validate specification completeness
9. Return: SUCCESS (specification ready for planning)
```

## Format Requirements

### Feature Name
A concise, descriptive name for the feature (5-10 words)

### User Description
The original user description of what they want to build. This should be preserved exactly as provided.

### Key Concepts
List of key domain concepts, technologies, or terminology mentioned in the feature description.

### Functional Requirements
List of specific behaviors the system must exhibit, written as:
- **FR-###**: [Concise description of required behavior]

### Non-Functional Requirements
List of quality attributes, constraints, and characteristics:
- **NFR-###**: [Concise description of quality attribute or constraint]

*Example of marking unclear requirements:*
- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities *(include if feature involves data)*
- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

### User Stories *(include if applicable)*
- **US-###**: As a [user type], I want to [goal] so that [benefit]

### Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

#### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

#### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous  
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [ ] User description parsed
- [ ] Key concepts extracted
- [ ] Ambiguities marked
- [ ] User stories defined
- [ ] Requirements generated
- [ ] Entities identified
- [ ] Review checklist passed