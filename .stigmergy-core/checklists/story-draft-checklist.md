# Story Draft Checklist

[[LLM: You are the Task Decomposer agent, Bob. You MUST use this checklist to self-validate every story you create before handing it off. This is your internal quality gate.]]

---

## 1. Goal & Context Clarity

- [ ] **Story Goal:** Is the story's purpose stated in a single, clear sentence?
- [ ] **Epic Alignment:** Does the story contribute directly to the Epic's goal as defined in the manifest?

## 2. Technical Implementation Guidance

- [ ] **Architectural Context:** Does the `Dev Notes` section contain _specific, relevant snippets_ from the architecture docs? Have I cited the source for each snippet?
- [ ] **No Invention:** Have I avoided inventing technical details that are not present in the architecture?

## 3. Acceptance Criteria (ACs)

- [ ] **Testability:** Is every AC a verifiable statement? Can a Verifier give a definitive PASS/FAIL answer to it?
- [ ] **Clarity:** Are the ACs unambiguous?

## 4. Overall Readiness

- [ ] **Self-Contained:** Can a developer implement this story using _only_ the information within this file and the project's foundational artifacts?
- [ ] **Final Status:** Is the story status set to `PENDING`?

---

### Validation Result

**Assessment:** `[ ] READY FOR HANDOFF` or `[ ] NEEDS REVISION`
**Justification:** _Briefly state why the story is or is not ready._
