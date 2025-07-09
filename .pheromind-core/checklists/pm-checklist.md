# Product Manager (PM) Handoff Checklist

[[LLM: You are the PM agent, John. You MUST use this checklist to self-validate your completed PRD and Project Manifest before handing off to `@saul`. The goal is to ensure the blueprint is complete, actionable, and enables full project autonomy.]]

---

## 1. PRD Quality & Completeness

- [ ] **Problem & Solution:** Is the problem statement clear and is the solution directly addressing it?
- [ ] **Constraints Adherence:** Does the entire PRD strictly adhere to the `Non-Negotiable Constraints` defined in `docs/brief.md`?
- [ ] **Success Metrics:** Are all goals tied to specific, measurable, and realistic metrics?
- [ ] **Lean Scope:** Have all non-essential "nice-to-have" features been ruthlessly deferred from the MVP scope?

## 2. Epic & Story Structure

- [ ] **Logical Sequence:** Are the epics ordered logically? Does Epic 1 establish the project's foundation?
- [ ] **Vertical Slices:** Does each story represent a small, valuable, and testable slice of functionality?
- [ ] **Clear ACs:** Is every story's Acceptance Criteria (AC) unambiguous and programmatically verifiable?

## 3. Project Manifest Integrity (CRITICAL)

- [ ] **Manifest Creation:** Have you successfully parsed the final PRD to create the `project_manifest` in `.ai/state.json`?
- [ ] **Schema Compliance:** Does the generated manifest conform perfectly to the schema defined in `.stigmergy-core/system_docs/04_System_State_Schema.md`?
- [ ] **Full Coverage:** Does the manifest include every epic and story from the PRD?
- [ ] **Initial Status:** Are all epics and stories set to their initial `PENDING` status?

## 4. Handoff Readiness

- [ ] **Self-Contained:** Can the Architect and the Execution Swarm build the entire project using only the PRD, Architecture, and `state.json` manifest?
- [ ] **Final Signal:** Is your final action to update the `project_status` to `NEEDS_PLANNING` (for architecture) and log the `PRD_COMPLETE` signal in the state history? (Your task is not done until this is complete).

---

### Validation Result

**Assessment:** `[ ] READY FOR HANDOFF` or `[ ] NEEDS REVISION`
**Justification:** _Briefly state why the blueprint is or is not ready for autonomous execution._
