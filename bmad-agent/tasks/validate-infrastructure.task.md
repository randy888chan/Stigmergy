# Infrastructure Validation Task

## Purpose

To comprehensively validate infrastructure changes against security, reliability, operational, and compliance requirements before deployment. This task ensures all infrastructure meets organizational standards, follows best practices, and properly integrates with the broader BMAD ecosystem.

## Inputs

- Infrastructure Change Request (`docs/infrastructure/{ticketNumber}.change.md`)
- Infrastructure Architecture Document (output from `create-infrastructure-architecture.md`)
- Infrastructure Guidelines (`docs/infrastructure/guidelines.md`)
- Technology Stack Document (`docs/tech-stack.md`)
- `infrastructure-checklist.md` (primary validation framework)

## Key Activities & Instructions

### 1. Confirm Interaction Mode

- Ask the user: "How would you like to proceed with infrastructure validation? We can work:
  A. **Incrementally (Default & Recommended):** We'll work through each section of the checklist step-by-step, documenting compliance or gaps for each item before moving to the next section. This is best for thorough validation and detailed documentation.
  B. **"YOLO" Mode:** I can perform a rapid assessment of all checklist items and present a comprehensive validation report for review. This is faster but may miss nuanced details that would be caught in the incremental approach."
- Request the user to select their preferred mode (e.g., "Please let me know if you'd prefer A or B.").
- Once the user chooses, confirm the selected mode and proceed accordingly.

### 2. Initialize Validation

- Review the infrastructure change documentation to understand scope and purpose
- Analyze the infrastructure architecture document for design patterns and compliance requirements
- Examine infrastructure guidelines for organizational standards
- Prepare the validation environment and tools
- <critical_rule>Verify the infrastructure change request is approved for validation. If not, HALT and inform the user.</critical_rule>

### 3. Execute Validation Process

- **If "Incremental Mode" was selected:**
  - For each section of the infrastructure checklist:
    - **a. Present Section Purpose:** Explain what this section validates and why it's important
    - **b. Work Through Items:** Present each checklist item, guide the user through validation, and document compliance or gaps
    - **c. Evidence Collection:** For each compliant item, document how compliance was verified
    - **d. Gap Documentation:** For each non-compliant item, document specific issues and proposed remediation
    - **e. [Offer Advanced Self-Refinement & Elicitation Options](#offer-advanced-self-refinement--elicitation-options)**
    - **f. Section Summary:** Provide a compliance percentage and highlight critical findings before moving to the next section

- **If "YOLO Mode" was selected:**
  - Work through all checklist sections rapidly
  - Document compliance status for each item
  - Identify and document critical non-compliance issues
  - Present a comprehensive validation report for all sections
  - <important_note>After presenting the full validation report in YOLO mode, you MAY still offer the 'Advanced Reflective & Elicitation Options' menu for deeper investigation of specific sections with issues.</important_note>

### 4. Generate Validation Report

- Summarize validation findings by section
- Calculate and present overall compliance percentage
- Clearly document all non-compliant items with remediation plans
- Highlight critical security or operational risks
- Provide validation signoff recommendation based on findings

### 5. BMAD Integration Assessment

- Review how infrastructure changes support other BMAD agents:
  - **Development Agent Alignment:** Verify infrastructure changes support Frontend Dev (Mira), Backend Dev (Enrique), and Full Stack Dev requirements
  - **Product Alignment:** Ensure infrastructure changes map to PRD requirements from Product Owner (Oli)
  - **Architecture Alignment:** Validate that infrastructure implementation aligns with decisions from Architect (Alphonse)
  - Document all integration points and potential impacts on other agents' workflows

### 6. Next Steps Recommendation

- If validation successful:
  - Prepare deployment recommendation
  - Outline monitoring requirements
  - Suggest knowledge transfer activities
- If validation failed:
  - Prioritize remediation actions
  - Recommend blockers vs. non-blockers
  - Schedule follow-up validation
- Update documentation with validation results
- <important_note>Always ensure the Infrastructure Change Request status is updated to reflect the validation outcome.</important_note>

## Output

A comprehensive validation report documenting:

1. Compliance percentage by checklist section
2. Detailed findings for each non-compliant item
3. Remediation recommendations with priority levels
4. BMAD integration assessment results
5. Clear signoff recommendation
6. Next steps for implementation or remediation

## Offer Advanced Self-Refinement & Elicitation Options

Present the user with the following list of 'Advanced Reflective, Elicitation & Brainstorming Actions'. Explain that these are optional steps to help ensure quality, explore alternatives, and deepen the understanding of the current section before finalizing it and moving on. The user can select an action by number, or choose to skip this and proceed to finalize the section.

"To ensure the quality of the current section: **[Specific Section Name]** and to ensure its robustness, explore alternatives, and consider all angles, I can perform any of the following actions. Please choose a number (8 to finalize and proceed):

**Advanced Reflective, Elicitation & Brainstorming Actions I Can Take:**

1. **Critical Security Assessment & Risk Analysis**
2. **Alternative Implementation Evaluation**
3. **Cross-Environment Consistency Review**
4. **Technical Debt & Maintainability Analysis**
5. **Compliance & Regulatory Alignment Deep Dive**
6. **Cost Optimization & Resource Efficiency Analysis**
7. **Operational Resilience & Failure Mode Testing (Theoretical)**
8. **Finalize this Section and Proceed.**

After I perform the selected action, we can discuss the outcome and decide on any further revisions for this section."

REPEAT by Asking the user if they would like to perform another Reflective, Elicitation & Brainstorming Action UNTIL the user indicates it is time to proceed to the next section (or selects #8)
