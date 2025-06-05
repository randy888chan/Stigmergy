# Task: Update Agent Knowledge

## Description
Extract key project information from existing documentation and update agent knowledge files and customization strings to make all BMAD agents more effective with project-specific context.

## Input Required
- Project Brief (`docs/project-brief.md` if available)
- PRD (`docs/prd.md` if available)
- Architecture document (`docs/architecture.md` if available)
- Tech Stack document (`docs/tech-stack.md` if available)
- Other project artifacts following BMAD naming standards

## Steps

1. **Extract Key Project Information**
   - Review all available project documents
   - Extract technology stack choices
   - Identify architecture patterns and decisions
   - Gather data models and sources
   - Note testing frameworks and strategies
   - Collect deployment and infrastructure requirements
   - Capture project-specific terminology and domain knowledge

2. **Create or Update Knowledge Files**
   - Create `.ai` directory if it doesn't exist
   - Update or create `.ai/project-context.md` using the template at `templates/project-context-tmpl.md`
   - Update or create `.ai/tech-stack.md` using the template at `templates/tech-stack-tmpl.md`
   - Update or create `.ai/data-models.md` using the template at `templates/data-models-tmpl.md`
   - Update or create `.ai/deployment-info.md` using the template at `templates/deployment-info-tmpl.md`
   - Populate each file with information extracted from project documents

3. **Generate Agent Customization Strings**
   - For Developer agents:
     ```
     Specialized in [PRIMARY_LANGUAGES] for [PROJECT_TYPE]. Using [FRAMEWORKS], [DATABASES], and following [PATTERNS] architecture.
     ```
   - For Data Scientist:
     ```
     Working with [DATA_SOURCES] data. Project requires [ANALYSIS_TYPES] and [MODEL_TYPES] models.
     ```
   - For DevOps Engineer:
     ```
     Managing deployment to [ENVIRONMENTS] using [CI_CD_TOOLS]. Infrastructure includes [INFRASTRUCTURE_COMPONENTS].
     ```
   - For QA Tester:
     ```
     Testing [APPLICATION_TYPE] with focus on [TESTING_TYPES]. Using [TESTING_TOOLS] for automation.
     ```

4. **Update Configuration Files**
   - Update `ide-bmad-orchestrator.cfg.md` with new customization strings
   - Update `web-bmad-orchestrator-agent.cfg.md` with new customization strings
   - Ensure all agents reference the knowledge files correctly

5. **Update Knowledge Version History**
   - Create or update `.ai/knowledge-versions.md` using the template at `templates/knowledge-version-tmpl.md`
   - **CRITICAL: Use actual current date in YYYY-MM-DD format, never leave date placeholders**
   - Increment version number appropriately based on change significance:
     - Major: Significant changes to project direction or core architecture
     - Minor: New features or components added to existing architecture
     - Patch: Refinements or clarifications to existing information
   - Document all changes made to knowledge files
   - Analyze potential impact of changes on development, testing, and deployment

6. **Cross-Reference Knowledge**
   - Add cross-references between related pieces of information
   - Ensure consistent terminology across all knowledge files
   - Document any assumptions or dependencies between knowledge areas

7. **Verify Knowledge Integration**
   - Confirm all knowledge files are properly formatted
   - Check that all agents can access the knowledge files
   - Verify configuration updates are correctly applied

## Output
- Updated agent configuration files
- New or updated knowledge files in `.ai` directory
- Knowledge version history update
- Summary of changes made to agent knowledge

## Validation Criteria
- All agents have accurate project-specific knowledge
- Knowledge files are comprehensive and well-structured
- Configuration updates maintain the correct format
- Knowledge is consistent across all artifacts
- Version history accurately reflects changes
- Cross-references maintain knowledge coherence