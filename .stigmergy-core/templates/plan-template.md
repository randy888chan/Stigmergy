# Implementation Plan: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/spec.md`
**Prerequisites**: spec.md (required)

## Execution Flow (main)
```
1. Load spec.md from feature directory
   → If not found: ERROR "No specification found"
   → Extract: requirements, entities, success criteria
2. Analyze specification for implementation approach
3. Select appropriate technology stack and frameworks
4. Design data models based on key entities
5. Define API contracts and endpoints
6. Create implementation approach and methodology
7. Generate review and acceptance checklist
8. Validate plan completeness
9. Return: SUCCESS (plan ready for implementation)
```

## Format Requirements

### Feature Name
The name of the feature being implemented (from spec.md)

### Technology Stack
List of technologies, frameworks, and tools to be used:
- **Frontend**: [Technologies for user interface]
- **Backend**: [Technologies for server-side logic]
- **Database**: [Data storage technology]
- **Infrastructure**: [Hosting, deployment, CI/CD tools]
- **Testing**: [Testing frameworks and tools]

### Data Model
Description of data structures and relationships:
- **[Entity 1]**: [Attributes and relationships]
- **[Entity 2]**: [Attributes and relationships]

### API Contracts
Definition of API endpoints and data contracts:
- **[METHOD] /endpoint/path**: [Purpose and parameters]
  - Request: [Request format and required fields]
  - Response: [Response format and possible status codes]

### Implementation Approach
Step-by-step approach to implementing the feature:
1. **Setup**: [Project initialization and dependency installation]
2. **Core Components**: [Main modules and components to build]
3. **Integration**: [How components will work together]
4. **Testing**: [Testing strategy and approach]
5. **Deployment**: [Deployment process and considerations]

### Success Criteria
Measurable criteria for determining implementation success:
- **Functional**: [Criteria for functional completeness]
- **Performance**: [Performance benchmarks and requirements]
- **Quality**: [Code quality and testing standards]

### Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

#### Plan Completeness
- [ ] Technology stack is clearly defined
- [ ] Data models are specified with attributes
- [ ] API contracts include request/response formats
- [ ] Implementation approach is detailed and actionable
- [ ] Success criteria are measurable

#### Technical Feasibility
- [ ] Selected technologies are appropriate for requirements
- [ ] Data models support required functionality
- [ ] API design follows RESTful principles (if applicable)
- [ ] Implementation approach addresses all requirements

---

## Execution Status
*Updated by main() during processing*

- [ ] Specification loaded and analyzed
- [ ] Technology stack selected
- [ ] Data models designed
- [ ] API contracts defined
- [ ] Implementation approach created
- [ ] Success criteria established
- [ ] Review checklist passed