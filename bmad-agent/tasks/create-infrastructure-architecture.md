# Infrastructure Architecture Creation Task

## Purpose

To design a comprehensive infrastructure architecture that defines all aspects of the technical infrastructure, from cloud resources to deployment pipelines. This architecture will serve as the foundation for all infrastructure implementations, ensuring consistency, security, and operational excellence.

## Inputs

- Product Requirements Document (PRD)
- Main System Architecture Document
- Technology Stack Document (`docs/tech-stack.md`)
- Infrastructure Guidelines (`docs/infrastructure/guidelines.md`)
- Any existing infrastructure documentation

## Key Activities & Instructions

### 1. Confirm Interaction Mode

- Ask the user: "How would you like to proceed with creating the infrastructure architecture? We can work:
  A. **Incrementally (Default & Recommended):** We'll go through each architectural decision and document section step-by-step. I'll present drafts, and we'll seek your feedback before moving to the next part. This is best for complex infrastructure designs.
  B. **"YOLO" Mode:** I can produce a comprehensive initial draft of the infrastructure architecture for you to review more broadly first. We can then iterate on specific sections based on your feedback."
- Request the user to select their preferred mode and proceed accordingly.

### 2. Gather Requirements

- Review the product requirements document to understand business needs
- Identify infrastructure needs from the application architecture
- Document non-functional requirements (performance, scalability, reliability)
- Identify compliance and security requirements
- <critical_rule>Cross-reference with PRD Technical Assumptions to ensure alignment with repository and service architecture decisions</critical_rule>

### 3. Design Infrastructure

- **If "Incremental Mode" was selected:**
  - For each major infrastructure component:
    - **a. Present Component Purpose:** Explain what this component provides and its importance
    - **b. Present Options:** Provide 2-3 viable options with pros and cons
    - **c. Make Recommendation:** Recommend the best option with rationale
    - **d. Incorporate Feedback:** Discuss with user and iterate based on feedback
    - **e. [Offer Advanced Self-Refinement & Elicitation Options](#offer-advanced-self-refinement--elicitation-options)**
    - **f. Document Decision:** Record the final choice with justification

- **If "YOLO Mode" was selected:**
  - Design all major components with recommended approaches
  - Document decisions and rationales
  - Present comprehensive design for review
  - Iterate based on feedback

### 4. Document Architecture

- Populate all sections of the infrastructure architecture template:
  - Cloud provider strategy
  - Network architecture
  - Compute resources
  - Data resources
  - Security architecture
  - Monitoring & observability
  - CI/CD pipeline
  - Disaster recovery
  - Cost optimization
  - Environment transition strategy
  - Shared responsibility model
  - Infrastructure evolution plan
  - Cross-team collaboration model
  - Infrastructure verification approach

### 5. Create Infrastructure Diagrams

- Develop clear infrastructure diagrams using Mermaid
- Create network topology diagrams
- Document data flow diagrams
- Illustrate deployment pipelines
- Visualize environment relationships

### 6. Identify Technical Stories & Epic Impacts

- Review existing epics and user stories
- Identify infrastructure-specific technical tasks
- Draft new stories for infrastructure components
- Suggest refinements to existing stories based on infrastructure decisions
- Prepare a summary of all proposed additions or modifications

### 7. Checklist Review and Finalization

- Use the `infrastructure-checklist.md` to validate completeness
- Ensure all sections are adequately addressed
- Address any deficiencies through collaboration with the user
- Present a summary of the checklist review
- Finalize the infrastructure architecture document

## Output

A comprehensive infrastructure architecture document that provides clear guidance for implementing and maintaining all infrastructure components, using the infrastructure-architecture-tmpl.md template.

## Offer Advanced Self-Refinement & Elicitation Options

Present the user with the following list of 'Advanced Reflective, Elicitation & Brainstorming Actions'. Explain that these are optional steps to help ensure quality, explore alternatives, and deepen the understanding of the current section before finalizing it and moving on. The user can select an action by number, or choose to skip this and proceed to finalize the section.

"To ensure the quality of the current section: **[Specific Section Name]** and to ensure its robustness, explore alternatives, and consider all angles, I can perform any of the following actions. Please choose a number (8 to finalize and proceed):

**Advanced Reflective, Elicitation & Brainstorming Actions I Can Take:**

1. **Alternative Architecture Evaluation**
2. **Scalability & Performance Stress Test (Theoretical)**
3. **Security & Compliance Deep Dive**
4. **Cost Analysis & Optimization Review**
5. **Operational Excellence & Reliability Assessment**
6. **Cross-Functional Integration Analysis**
7. **Future Technology & Migration Path Exploration**
8. **Finalize this Section and Proceed.**

After I perform the selected action, we can discuss the outcome and decide on any further revisions for this section."

REPEAT by Asking the user if they would like to perform another Reflective, Elicitation & Brainstorming Action UNTIL the user indicates it is time to proceed to the next section (or selects #8)
