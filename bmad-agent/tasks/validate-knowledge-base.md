# Task: Validate Knowledge Base

## Description
Systematically review and validate the project knowledge base to ensure completeness, consistency, and accuracy across all knowledge files and agent customizations.

## Input Required
- Knowledge files in `.ai` directory
- Agent configuration files
- Project documentation (PRD, architecture, etc.)

## Steps

1. **Knowledge File Completeness Check**
   - Verify all required knowledge files exist:
     - `.ai/project-context.md`
     - `.ai/tech-stack.md`
     - `.ai/data-models.md`
     - `.ai/deployment-info.md`
   - Check that each file follows its corresponding template structure
   - Ensure all major sections in each file contain meaningful content
   - Flag empty or placeholder sections as incomplete

2. **Internal Consistency Validation**
   - Cross-reference information across knowledge files to identify:
     - Terminology inconsistencies (different terms for same concept)
     - Contradictory information (conflicting statements)
     - Redundant information (same data in multiple places)
   - Ensure references between files are accurate and up-to-date
   - Verify versioning information is consistent if present

3. **External Consistency Validation**
   - Compare knowledge files against authoritative project documents:
     - Project Brief
     - PRD
     - Architecture documentation
     - UI/UX specifications
   - Identify any discrepancies or outdated information
   - Flag potentially incorrect information for review

4. **Agent Customization Verification**
   - Check that agent customization strings in configuration files:
     - Accurately reflect current project knowledge
     - Contain specific, actionable information
     - Are consistent with knowledge file contents
   - Verify all specialized agents have appropriate customizations

5. **Knowledge Gap Analysis**
   - Identify missing information that should be documented
   - Look for vague or imprecise statements that need clarification
   - Note areas where more detailed documentation would be beneficial
   - Check for outdated information that needs updating

6. **Create Validation Report**
   - Summarize findings from all validation steps
   - List specific issues categorized by severity:
     - Critical: Inconsistencies that could lead to errors
     - Important: Missing information needed for effective work
     - Minor: Improvements that would enhance clarity
   - Provide specific recommendations for each issue
   - Generate actionable tasks to address knowledge gaps

## Output
A comprehensive validation report (`.ai/knowledge-validation-report.md`) containing:
- Overall knowledge base health assessment
- Specific issues identified across all knowledge files
- Consistency analysis between knowledge files and project documentation
- Agent customization review findings
- Prioritized list of recommendations to improve the knowledge base

## Knowledge Validation Checklist
- [ ] All required knowledge files exist and follow templates
- [ ] All major sections contain meaningful content
- [ ] Terminology is used consistently across files
- [ ] No contradictory information exists between files
- [ ] Information is consistent with authoritative project documents
- [ ] Agent customizations accurately reflect current knowledge
- [ ] Knowledge gaps are identified and documented
- [ ] Recommendations are specific and actionable
- [ ] Validation report is clear and comprehensive

## Validation Criteria
- All knowledge files have been reviewed
- Internal and external consistency has been verified
- Knowledge gaps are clearly documented
- Recommendations are prioritized by importance
- Report is structured for easy action by the team