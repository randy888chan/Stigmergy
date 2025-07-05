# Create Document from Template Task

## Purpose
- Generate documents from a specified template into their correct project locations, following embedded instructions from the perspective of the selected agent persona.

## Instructions

### 1. Identify Template and Context
- Determine which template to use (e.g., `prd-tmpl`, `coding-standards-tmpl`).

### 2. **Determine Output Location (CRITICAL)**
- **Rule:** Before creating the file, inspect the template name.
- If the template name is `coding-standards-tmpl` or `qa-protocol-tmpl`, the output path MUST be `docs/architecture/`.
- If the template name is `architecture-tmpl`, `fullstack-architecture-tmpl`, or `brownfield-architecture-tmpl`, the output path MUST be `docs/`.
- For all other templates, the default output path is `docs/`.
- The final filename should be the template name without the `-tmpl` suffix (e.g., `coding-standards-tmpl.md` -> `coding-standards.md`).

### 3. Determine Interaction Mode
- Confirm with the user their preferred interaction style:
  - **Incremental:** Work through chunks of the document.
  - **YOLO Mode:** Draft the complete document in one shot.

### 4. Execute Template
- Load the specified template.
- Follow ALL embedded [[LLM: instructions]].
- Process template markup according to `utils#template-format` conventions.

### 5. Content Generation & Validation
- Generate content based on the chosen interaction mode.
- Apply any elicitation protocols specified in the template.
- If the template specifies a checklist, run it against the completed document.

### 6. Final Presentation
- Present the clean, formatted document to the user.
- Confirm that the document has been saved to the correct location as determined in Step 2.
