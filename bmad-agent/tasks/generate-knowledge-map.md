# Task: Generate Knowledge Map

## Description
Create a visual representation of project knowledge to improve understanding and identify gaps between components, data flows, and team responsibilities.

## Input Required
- Project context (`.ai/project-context.md`)
- Technology stack (`.ai/tech-stack.md`)
- Data models (`.ai/data-models.md`)
- Deployment information (`.ai/deployment-info.md`)
- Other project artifacts as needed

## Steps

1. **Parse Knowledge Files**
   - Read all knowledge files in the `.ai` directory
   - Extract key components, entities, and relationships
   - Identify core technologies and their dependencies
   - Map data flows between systems and components

2. **Identify Key Elements**
   - Technologies: Frontend, backend, databases, third-party services
   - Data entities and their relationships
   - Team responsibilities and interfaces
   - System boundaries and integration points
   - User touchpoints and journeys

3. **Determine Relationship Types**
   - Dependency relationships (X depends on Y)
   - Data flow relationships (X sends data to Y)
   - Composition relationships (X consists of Y)
   - Sequence relationships (X happens before Y)
   - Responsibility relationships (X is responsible for Y)

4. **Generate Mermaid Diagrams**
   - **System Architecture Diagram**
     - Show all technical components and their relationships
     - Include deployment environments
     - Highlight data flows between components
   
   - **Data Model Diagram**
     - Show key data entities and their relationships
     - Include data types and cardinality
     - Highlight primary/foreign key relationships
   
   - **Team Responsibility Diagram**
     - Show project team roles
     - Map responsibilities to components/features
     - Show communication channels

5. **Identify Knowledge Gaps**
   - Look for missing relationships or unclear interfaces
   - Identify components with limited documentation
   - Note assumptions that need validation
   - Flag areas where knowledge seems inconsistent

6. **Create Knowledge Map Document**
   - Write introduction explaining the purpose of the map
   - Include all generated diagrams with explanations
   - List identified knowledge gaps and recommendations
   - Provide links back to source knowledge files

## Output
A comprehensive knowledge map document (`.ai/knowledge-map.md`) containing:
- Visual diagrams representing the project's knowledge landscape
- Explanations of key relationships and dependencies
- Identified knowledge gaps and recommendations
- References to detailed documentation

## Validation Criteria
- Diagrams are syntactically correct and render properly
- All major system components are represented
- Relationships accurately reflect project understanding
- Knowledge gaps are clearly identified
- The map provides actionable insights for the team