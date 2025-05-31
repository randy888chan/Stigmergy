# Infrastructure Implementation Task

## Purpose

To guide the Platform Engineer through implementing infrastructure changes according to the architecture document and infrastructure guidelines. This task ensures consistent, secure, and well-documented infrastructure deployment that aligns with organizational standards and supports application requirements.

## Inputs

- Infrastructure Architecture Document
- Infrastructure Change Request
- Infrastructure Guidelines
- Technology Stack Document
- Project Structure Guide
- `infrastructure-checklist.md` (for validation)

## Key Activities & Instructions

### 1. Confirm Interaction Mode

- Ask the user: "How would you like to proceed with infrastructure implementation? We can work:
  A. **Incrementally (Default & Recommended):** We'll implement each infrastructure component step-by-step, validating each before moving to the next. This ensures thorough testing and documentation.
  B. **"YOLO" Mode:** I'll implement all infrastructure components in a more holistic approach, with validation at key milestones rather than for each component. This can be faster but introduces more risk."
- Request the user to select their preferred mode and proceed accordingly.

### 2. Prepare for Implementation

- Review the infrastructure architecture document thoroughly
- Create a detailed implementation plan with clear milestones
- Set up Infrastructure as Code repositories (Terraform, Bicep, etc.)
- Establish testing environment
- Document rollback procedures
- <critical_rule>Verify the change request is approved before beginning implementation. If not, HALT and inform the user.</critical_rule>

### 3. Develop Infrastructure Code

- **If "Incremental Mode" was selected:**
  - For each major infrastructure component:
    - **a. Present Component Plan:** Explain implementation approach and how it aligns with architecture
    - **b. Create/Update IaC Code:** Develop Terraform/Bicep/ARM templates with proper documentation
    - **c. Implement Security Controls:** Ensure all security requirements are addressed
    - **d. Review & Feedback:** Present code for review and incorporate feedback
    - **e. [Offer Advanced Self-Refinement & Elicitation Options](#offer-advanced-self-refinement--elicitation-options)**
    - **f. Test Component:** Deploy to test environment and verify functionality

- **If "YOLO Mode" was selected:**
  - Develop IaC for all components in logical groups
  - Implement security controls across all resources
  - Present comprehensive implementation for review
  - Test at major milestones rather than per-component

### 4. Test and Validate

- Deploy all infrastructure to a testing environment
- Verify functionality against architectural requirements
- Run security scans and compliance checks
- Perform performance testing on infrastructure components
- Validate against the infrastructure checklist
- Document all test results and validation evidence
- <important_note>Address any validation failures before proceeding to production deployment</important_note>

### 5. BMAD Integration Verification

- Verify infrastructure supports other BMAD agents:
  - Test development environments for Frontend Dev (Mira) and Backend Dev (Enrique)
  - Confirm infrastructure implements requirements from Product Owner (Oli)
  - Validate alignment with architectural decisions from Architect (Alphonse)
  - Document all integration verification results

### 6. Deploy and Handover

- Implement in production environment using approved change management process
- Verify successful deployment with comprehensive testing
- Update all documentation with as-built details
- Conduct knowledge transfer sessions with operations teams
- Set up ongoing monitoring and alerting
- Complete final validation against infrastructure checklist
- <critical_rule>Update change request status to reflect completion</critical_rule>

## Output

Fully implemented infrastructure changes with:

1. Complete Infrastructure as Code repository
2. Comprehensive documentation of deployed resources
3. Validation evidence demonstrating compliance with requirements
4. Knowledge transfer documentation for operations teams
5. Monitoring and alerting configuration
6. Updated change request with implementation details

## Offer Advanced Self-Refinement & Elicitation Options

Present the user with the following list of 'Advanced Reflective, Elicitation & Brainstorming Actions'. Explain that these are optional steps to help ensure quality, explore alternatives, and deepen the understanding of the current component before finalizing it and moving to the next. The user can select an action by number, or choose to skip this and proceed.

"To ensure the quality of the current component: **[Specific Component Name]** and to ensure its robustness, explore alternatives, and consider all angles, I can perform any of the following actions. Please choose a number (8 to finalize and proceed):

**Advanced Reflective, Elicitation & Brainstorming Actions I Can Take:**

1. **Security Hardening & Vulnerability Assessment**
2. **Performance Optimization & Scaling Review**
3. **Cost Analysis & Resource Efficiency Evaluation**
4. **Failure Mode Effects Analysis (FMEA)**
5. **Deployment Process Improvement & Automation**
6. **Operational Readiness & Monitoring Enhancement**
7. **Compliance & Governance Verification**
8. **Finalize this Component and Proceed.**

After I perform the selected action, we can discuss the outcome and decide on any further improvements for this component."

REPEAT by Asking the user if they would like to perform another Reflective, Elicitation & Brainstorming Action UNTIL the user indicates it is time to proceed to the next component (or selects #8)
