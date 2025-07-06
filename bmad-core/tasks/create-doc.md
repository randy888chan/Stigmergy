# Create Document from Template Task

## Purpose
To generate high-quality project documents from a specified template, following embedded instructions and interactive elicitation protocols to ensure comprehensive and well-structured output. This task also enforces correct file placement for critical architectural documents.

## Instructions

### 1. Identify Template and Context
- The user will specify a template to use (e.g., `prd-tmpl`, `coding-standards-tmpl`).
- Review the agent's current context and any user-provided information to inform the document creation process.

### 2. **Determine Output Location (CRITICAL)**
- **Rule:** Before creating the file, inspect the template name to determine its mandatory output path.
- If the template name is `coding-standards-tmpl.md` or `qa-protocol-tmpl.md`, the output path **MUST** be `docs/architecture/`. The final filename will be the template name without the `-tmpl` suffix (e.g., `coding-standards.md`).
- If the template name is `architecture-tmpl.md`, `fullstack-architecture-tmpl.md`, or `brownfield-architecture-tmpl.md`, the output path **MUST** be `docs/`.
- For all other templates, if not specified by the user, the default output path is `docs/`.
- Announce the intended save path to the user for confirmation before proceeding.

### 3. Determine Interaction Mode
- Confirm with the user their preferred interaction style for this session:
  - **"Incremental Mode (Recommended):"** "Shall we work through the document section by section? I will draft each part, and then we can use advanced brainstorming techniques to refine it before moving on."
  - **"YOLO Mode (Fast Draft):"** "Or, would you prefer I generate a complete first draft of the entire document for you to review all at once?"

### 4. Execute Template with Elicitation
- Load the specified template file.
- **You MUST now act as an expert interviewer.** Systematically process the template, paying close attention to the embedded `[[LLM: ...]]` instructions.
- After drafting a section as instructed by the template, you **MUST** then execute the `advanced-elicitation.md` task protocol. This means presenting the reflective and brainstorming actions to the user, allowing them to critique, refine, and improve the content before proceeding to the next section.
- This interactive loop of "Draft -> Elicit -> Refine" continues until the entire document is complete.

### 5. Final Presentation & Save
- Once the user confirms the document is complete, present the final, clean, formatted markdown.
- Confirm that the document has been saved to the correct location as determined in Step 2.
- Report task completion to the orchestrator.
