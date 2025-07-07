# Create Document from Template Task

## Purpose

To generate high-quality project documents from a specified template, following embedded instructions, performing mandatory research, and using interactive elicitation to ensure a lean, comprehensive output. This task also enforces correct file placement for critical architectural documents.

## Instructions

### 1. Identify Template and Context

- The user will specify a template to use (e.g., `prd-tmpl`, `coding-standards-tmpl`).
- Review the agent's current context, the System Constitution, and any user-provided information to inform the document creation process.

### 2. **Enforce File Location (CRITICAL)**

- **Rule:** Before creating the file, inspect the template name to determine its mandatory output path. This is a constitutional requirement for system integrity.
- If the template name is `coding-standards-tmpl.md` or `qa-protocol-tmpl.md`, the output path **MUST** be `docs/architecture/`. The final filename will be the template name without the `-tmpl` suffix (e.g., `coding-standards.md`).
- If the template name is `architecture-tmpl.md` or any variant, the output path **MUST** be `docs/` and the filename MUST be `architecture.md`.
- For `prd-tmpl.md`, the output path **MUST** be `docs/` and the filename MUST be `prd.md`.
- Announce the intended save path to the user for confirmation before proceeding. Example: "This document will be saved as `docs/architecture/coding-standards.md` as required by the system architecture."

### 3. **Mandatory Research (LAW VI)**

- Before populating any section of the template, you MUST first ask yourself: "Does this section make claims or decisions that could be validated or improved with external data?"
- If the answer is yes, you MUST use your research tools (e.g., `browser`) to investigate.
- Example: When creating a PRD, research competitor features before defining your own. When choosing a technology in an architecture document, research its current stability and best practices.
- You MUST cite your findings in the document where relevant.

### 4. Execute Template with Elicitation

- Load the specified template file.
- **You MUST now act as an expert interviewer.** Systematically process the template, paying close attention to the embedded `[[LLM: ...]]` instructions.
- After drafting a section, you **MUST** then execute the `advanced-elicitation.md` task protocol. This means presenting the reflective and brainstorming actions to the user, allowing them to critique, refine, and improve the content before proceeding to the next section.
- This interactive loop of "Research -> Draft -> Elicit -> Refine" continues until the entire document is complete.

### 5. Final Presentation & Save

- Once the user confirms the document is complete, present the final, clean, formatted markdown.
- Confirm that the document has been saved to the correct location as determined in Step 2.
- Report task completion to the orchestrator.

```

```
