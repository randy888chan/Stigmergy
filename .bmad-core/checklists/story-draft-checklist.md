# Story Draft Checklist

The Scrum Master should use this checklist to validate that each story contains sufficient context for a developer agent to implement it successfully, while assuming the dev agent has reasonable capabilities to figure things out.

[[LLM: INITIALIZATION INSTRUCTIONS - STORY DRAFT VALIDATION

Before proceeding with this checklist, ensure you have access to:

1. The story document being validated (usually in docs/stories/ or provided directly)
2. The parent epic context
3. Any referenced architecture or design documents
4. Previous related stories if this builds on prior work

IMPORTANT: This checklist validates individual stories BEFORE implementation begins.

VALIDATION PRINCIPLES:

1. Clarity - A developer should understand WHAT to build
2. Context - WHY this is being built and how it fits
3. Guidance - Key technical decisions and patterns to follow
4. Testability - How to verify the implementation works
5. Self-Contained - Most info needed is in the story itself

REMEMBER: We assume competent developer agents who can:

- Research documentation and codebases
- Make reasonable technical decisions
- Follow established patterns
- Ask for clarification when truly stuck

We're checking for SUFFICIENT guidance, not exhaustive detail.]]

## 1. GOAL & CONTEXT CLARITY

[[LLM: Without clear goals, developers build the wrong thing. Verify:

1. The story states WHAT functionality to implement
2. The business value or user benefit is clear
3. How this fits into the larger epic/product is explained
4. Dependencies are explicit ("requires Story X to be complete")
5. Success looks like something specific, not vague]]

- [ ] Story goal/purpose is clearly stated
- [ ] Relationship to epic goals is evident
- [ ] How the story fits into overall system flow is explained
- [ ] Dependencies on previous stories are identified (if applicable)
- [ ] Business context and value are clear

## 2. TECHNICAL IMPLEMENTATION GUIDANCE

[[LLM: Developers need enough technical context to start coding. Check:

1. Key files/components to create or modify are mentioned
2. Technology choices are specified where non-obvious
3. Integration points with existing code are identified
4. Data models or API contracts are defined or referenced
5. Non-standard patterns or exceptions are called out

Note: We don't need every file listed - just the important ones.]]

- [ ] Key files to create/modify are identified (not necessarily exhaustive)
- [ ] Technologies specifically needed for this story are mentioned
- [ ] Critical APIs or interfaces are sufficiently described
- [ ] Necessary data models or structures are referenced
- [ ] Required environment variables are listed (if applicable)
- [ ] Any exceptions to standard coding patterns are noted

## 3. REFERENCE EFFECTIVENESS

[[LLM: References should help, not create a treasure hunt. Ensure:

1. References point to specific sections, not whole documents
2. The relevance of each reference is explained
3. Critical information is summarized in the story
4. References are accessible (not broken links)
5. Previous story context is summarized if needed]]

- [ ] References to external documents point to specific relevant sections
- [ ] Critical information from previous stories is summarized (not just referenced)
- [ ] Context is provided for why references are relevant
- [ ] References use consistent format (e.g., `docs/filename.md#section`)

## 4. SELF-CONTAINMENT ASSESSMENT

[[LLM: Stories should be mostly self-contained to avoid context switching. Verify:

1. Core requirements are in the story, not just in references
2. Domain terms are explained or obvious from context
3. Assumptions are stated explicitly
4. Edge cases are mentioned (even if deferred)
5. The story could be understood without reading 10 other documents]]

- [ ] Core information needed is included (not overly reliant on external docs)
- [ ] Implicit assumptions are made explicit
- [ ] Domain-specific terms or concepts are explained
- [ ] Edge cases or error scenarios are addressed

## 5. TESTING GUIDANCE

[[LLM: Testing ensures the implementation actually works. Check:

1. Test approach is specified (unit, integration, e2e)
2. Key test scenarios are listed
3. Success criteria are measurable
4. Special test considerations are noted
5. Acceptance criteria in the story are testable]]

- [ ] Required testing approach is outlined
- [ ] Key test scenarios are identified
- [ ] Success criteria are defined
- [ ] Special testing considerations are noted (if applicable)

## VALIDATION RESULT

[[LLM: FINAL STORY VALIDATION REPORT

Generate a concise validation report:

1. Quick Summary

   - Story readiness: READY / NEEDS REVISION / BLOCKED
   - Clarity score (1-10)
   - Major gaps identified

2. Fill in the validation table with:

   - PASS: Requirements clearly met
   - PARTIAL: Some gaps but workable
   - FAIL: Critical information missing

3. Specific Issues (if any)

   - List concrete problems to fix
   - Suggest specific improvements
   - Identify any blocking dependencies

4. Developer Perspective
   - Could YOU implement this story as written?
   - What questions would you have?
   - What might cause delays or rework?

Be pragmatic - perfect documentation doesn't exist. Focus on whether a competent developer can succeed with this story.]]

| Category                             | Status            | Issues |
| ------------------------------------ | ----------------- | ------ |
| 1. Goal & Context Clarity            | PASS/FAIL/PARTIAL |        |
| 2. Technical Implementation Guidance | PASS/FAIL/PARTIAL |        |
| 3. Reference Effectiveness           | PASS/FAIL/PARTIAL |        |
| 4. Self-Containment Assessment       | PASS/FAIL/PARTIAL |        |
| 5. Testing Guidance                  | PASS/FAIL/PARTIAL |        |

**Final Assessment:**

- READY: The story provides sufficient context for implementation
- NEEDS REVISION: The story requires updates (see issues)
- BLOCKED: External information required (specify what information)

---

## DOCUMENTATION CURATION & MANAGEMENT

### Story-Level Quick Curation (5-10 min per story)
- [ ] Review developer's Technical Decisions section in story file
- [ ] Extract key items to `/docs/CURATION_NOTES.md` (temporary file):
  - [ ] Significant technical decisions
  - [ ] Technical debt items with priority
  - [ ] Lessons learned (problems & solutions)
  - [ ] Architectural patterns established
- [ ] Flag any critical issues needing immediate attention
- [ ] Mark story as "Curation Complete" in story file

### Epic/Task-Level Full Curation (1-2 hours)
- [ ] Review complete `/docs/CURATION_NOTES.md` for the epic
- [ ] Identify patterns and themes across stories
- [ ] Extract and organize content:
  - [ ] Technical debt → `/docs/TASKS.md` (with effort estimates)
  - [ ] Lessons learned → `/docs/LESSONS_LEARNED.md`
  - [ ] Architectural decisions → Create ADRs for significant ones
  - [ ] Data structure changes → `/docs/DATA_STRUCTURES.md`
  - [ ] New features → `/docs/README.md`
  - [ ] Architecture notes → `/docs/PLANNING.md`
- [ ] Check if technical debt threshold reached (≥10 days)
- [ ] Prepare curation summary for user

### User Verification & Archival
- [ ] Present curation summary to user:
  - [ ] Items added to permanent documentation
  - [ ] Implementation docs to be archived
  - [ ] Technical debt status
- [ ] Get user approval for archival
- [ ] Archive implementation documents
- [ ] Delete `/docs/CURATION_NOTES.md` (temporary file no longer needed)
- [ ] Commit with message: "Archive: [Epic Name] implementation docs"

## TECHNICAL DEBT MONITORING

### At Epic/Task Completion
- [ ] Review all TECH-DEBT items in `/docs/TASKS.md`
- [ ] Estimate effort for accumulated debt (T-shirt sizes: S=1 day, M=3 days, L=1 week)
- [ ] Calculate total estimated debt effort
- [ ] If total ≥ 10 days, initiate debt paydown process

### Debt Paydown Process
- [ ] Create Technical Debt Analysis document with:
  - [ ] List of all debt items with effort estimates
  - [ ] Risk assessment (what could break if not addressed)
  - [ ] Prioritization recommendation
  - [ ] Suggested groupings for efficient paydown
- [ ] Present to user with recommendation for debt-focused sprint
- [ ] If approved, guide user to work with PM on Debt Paydown PRD using `/bmad-agent/templates/tech-debt-prd-tmpl.md`