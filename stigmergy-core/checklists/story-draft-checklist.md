# Story Draft Checklist

[[LLM: You are the SM agent, Bob. You MUST use this checklist to self-validate every story you create before handing it off to Saul. The goal is to ensure the story is a clear, actionable work order for Olivia and her team.]]

---

## 1. Goal & Context Clarity

- [ ] **Story Goal:** Is the story's purpose stated in a single, clear sentence?
- [ ] **User Value:** Is the "As a..., I want..., so that..." format correctly filled out and does it clearly articulate user value?
- [ ] **Epic Alignment:** Does the story logically follow the previous story and contribute directly to the Epic's goal?

## 2. Technical Implementation Guidance

- [ ] **Architectural Context:** Does the `Dev Notes` section contain _specific, relevant snippets_ from the architecture docs (e.g., data models, API schemas, component props)? It should not just link to the docs.
- [ ] **Implementation Constraints:** Are all critical technical constraints (e.g., "must use the existing `apiClient`," "data must conform to `UserV2` interface") explicitly stated?
- [ ] **File References:** Are key files or directories to be modified mentioned to give the developer a starting point?

## 3. Acceptance Criteria (ACs)

- [ ] **Testability:** Is every AC a verifiable, testable statement? Can a QA agent give a definitive yes/no answer to it?
- [ ] **Clarity:** Are the ACs unambiguous? Could an AI misinterpret them?
- [ ] **Completeness:** Do the ACs cover the full scope of the story, including happy paths, error handling, and edge cases?

## 4. Sub-Task Decomposition Readiness

- [ ] **High-Level Tasks:** Is there a list of 2-5 high-level tasks in the `Tasks / Subtasks` section?
- [ ] **Logical Sequence:** Are these tasks in a logical order of execution?
- [ ] **Clarity for Olivia:** Are the tasks clear enough for `@stigmergy-orchestrator` (Olivia) to understand and potentially decompose further if needed?

## 5. Overall Readiness

- [ ] **Self-Contained:** Can a developer implement this story using _only_ the information within this file and the project's `coding-standards.md`? (The answer MUST be yes).
- [ ] **Lean & Mean:** Is the story free of unnecessary fluff, verbose descriptions, or "nice-to-have" scope creep?
- [ ] **Final Status:** Is the story status set to `Draft`?

---

### Validation Result

**Assessment:** `[ ] READY FOR APPROVAL` or `[ ] NEEDS REVISION`
**Justification:** _Briefly state why the story is or is not ready._
