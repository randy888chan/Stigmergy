# Story Definition of Done (DoD) Checklist

## Instructions for Developer Agent

Before marking a story as 'Review', please go through each item in this checklist. Report the status of each item (e.g., [x] Done, [ ] Not Done, [N/A] Not Applicable) and provide brief comments if necessary.

[[LLM: INITIALIZATION INSTRUCTIONS - STORY DOD VALIDATION

This checklist is for DEVELOPER AGENTS to self-validate their work before marking a story complete.

IMPORTANT: This is a self-assessment. Be honest about what's actually done vs what should be done. It's better to identify issues now than have them found in review.

EXECUTION APPROACH:

1. Go through each section systematically
2. Mark items as [x] Done, [ ] Not Done, or [N/A] Not Applicable
3. Add brief comments explaining any [ ] or [N/A] items
4. Be specific about what was actually implemented
5. Flag any concerns or technical debt created

The goal is quality delivery, not just checking boxes.]]

## Checklist Items

1. **Requirements Met:**

    [[LLM: Be specific - list each requirement and whether it's complete]]

    - [ ] All functional requirements specified in the story are implemented.
    - [ ] All acceptance criteria defined in the story are met.

2. **Coding Standards & Project Structure:**

    [[LLM: Code quality matters for maintainability. Check each item carefully]]

    - [ ] All new/modified code strictly adheres to `Operational Guidelines`.
    - [ ] All new/modified code aligns with `Project Structure` (file locations, naming, etc.).
    - [ ] Adherence to `Tech Stack` for technologies/versions used (if story introduces or modifies tech usage).
    - [ ] Adherence to `Api Reference` and `Data Models` (if story involves API or data model changes).
    - [ ] Basic security best practices (e.g., input validation, proper error handling, no hardcoded secrets) applied for new/modified code.
    - [ ] No new linter errors or warnings introduced.
    - [ ] Code is well-commented where necessary (clarifying complex logic, not obvious statements).

3. **Testing:**

    [[LLM: Testing proves your code works. Be honest about test coverage]]

    - [ ] All required unit tests as per the story and `Operational Guidelines` Testing Strategy are implemented.
    - [ ] All required integration tests (if applicable) as per the story and `Operational Guidelines` Testing Strategy are implemented.
    - [ ] All tests (unit, integration, E2E if applicable) pass successfully.
    - [ ] Test coverage meets project standards (if defined).

4. **Functionality & Verification:**

    [[LLM: Did you actually run and test your code? Be specific about what you tested]]

    - [ ] Functionality has been manually verified by the developer (e.g., running the app locally, checking UI, testing API endpoints).
    - [ ] Edge cases and potential error conditions considered and handled gracefully.

5. **Technical Decision Documentation:**

    [[LLM: Document decisions that will affect future development. Focus on significant choices, not obvious ones]]

    - [ ] All significant technical decisions documented in story file under "## Technical Decisions"
    - [ ] Each decision includes Why, Trade-off, and Debt assessment
    - [ ] Technical debt items marked with TECH-DEBT comment in code
    - [ ] Decisions provide enough context for future developers

    **Types of Decisions to Document:**

    **Architecture/Design Patterns**
    - [ ] Pattern choices (Repository, Factory, Observer, etc.)
    - [ ] Service communication methods (REST, GraphQL, events)
    - [ ] Data flow decisions
    - [ ] Component boundaries and responsibilities

    **Technology/Library Choices**
    - [ ] External library selections with reasoning
    - [ ] Framework-specific approaches
    - [ ] Build tool or bundler decisions
    - [ ] Database or storage technology choices

    **Performance Trade-offs**
    - [ ] Caching strategies and TTL decisions
    - [ ] Database denormalization choices
    - [ ] Algorithm selection (space vs. time)
    - [ ] Lazy loading vs. eager loading decisions

    **Security Decisions**
    - [ ] Authentication/authorization approach
    - [ ] Data encryption methods
    - [ ] API security measures
    - [ ] Secret management strategies

    **Deviation from Standards**
    - [ ] Any departure from project conventions
    - [ ] Workarounds for technical limitations
    - [ ] Temporary solutions that create debt
    - [ ] Integration compromises with external systems

    **Decision Log Format:**
    ```markdown
    ### [Decision Title]
    **Decision**: [What was decided]
    **Why**: [1-2 sentence rationale]
    **Trade-off**: [What we gave up or compromised]
    **Debt**: [TECH-DEBT: if applicable, otherwise "None"]
    ```

6. **Story Administration:**

    [[LLM: Documentation helps the next developer. What should they know?]]

    - [ ] All tasks within the story file are marked as complete.
    - [ ] Any clarifications or decisions made during development are documented in the story file or linked appropriately.
    - [ ] The story wrap up section has been completed with notes of changes or information relevant to the next story or overall project, the agent model that was primarily used during development, and the changelog of any changes is properly updated.

7. **Dependencies, Build & Configuration:**

    [[LLM: Build issues block everyone. Ensure everything compiles and runs cleanly]]

    - [ ] Project builds successfully without errors.
    - [ ] Project linting passes
    - [ ] Any new dependencies added were either pre-approved in the story requirements OR explicitly approved by the user during development (approval documented in story file).
    - [ ] If new dependencies were added, they are recorded in the appropriate project files (e.g., `package.json`, `requirements.txt`) with justification.
    - [ ] No known security vulnerabilities introduced by newly added and approved dependencies.
    - [ ] If new environment variables or configurations were introduced by the story, they are documented and handled securely.

8. **Documentation (If Applicable):**

    [[LLM: Good documentation prevents future confusion. What needs explaining?]]

    - [ ] Relevant inline code documentation (e.g., JSDoc, TSDoc, Python docstrings) for new public APIs or complex logic is complete.
    - [ ] User-facing documentation updated, if changes impact users.
    - [ ] Technical documentation (e.g., READMEs, system diagrams) updated if significant architectural changes were made.

9. **Curation Handoff:**

    [[LLM: Prepare knowledge for the Scrum Master to preserve valuable insights from this story]]

    - [ ] Technical Decisions section complete in story file
    - [ ] All TECH-DEBT items marked in code with priority
    - [ ] Story status updated to "Ready for Curation"
    - [ ] Notify Scrum Master that story is ready for quick curation
    - [ ] CURATION_NOTES.md updated with story decisions and lessons learned
    - [ ] Run `python scripts/check_documentation_status.py` to verify documentation compliance

## Final Confirmation

[[LLM: FINAL DOD SUMMARY

After completing the checklist:

1. Summarize what was accomplished in this story
2. List any items marked as [ ] Not Done with explanations
3. Identify any technical debt or follow-up work needed
4. Note any challenges or learnings for future stories
5. Confirm whether the story is truly ready for review

Be honest - it's better to flag issues now than have them discovered later.]]

- [ ] I, the Developer Agent, confirm that all applicable items above have been addressed.