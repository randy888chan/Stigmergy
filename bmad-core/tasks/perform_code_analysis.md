# Perform Code Analysis Task

## Task Objective
Analyze specified code files and generate a structured Markdown report summarizing their purpose, components, dependencies, basic quality observations, and suggestions for improvement.

## Parameters
1.  `target_file_paths`: A list of 1 to 2 file paths to be analyzed (e.g., `["src/utils/api.js", "src/components/UserManager.jsx"]`).
2.  `report_file_path`: The path where the analysis report section should be appended (e.g., `docs/CodeAnalysisReport.md`).

## Execution Steps

You MUST perform the following for EACH file provided in `target_file_paths`:

1.  **Read File Content:**
    *   Access and read the full content of the current target file.
    *   If a file cannot be read, note this in your final summary and skip analysis for that file.

2.  **Analyze and Generate Markdown Section:**
    *   Create a Markdown section with the following structure. Ensure all sub-sections are addressed.

    ```markdown
    ### File: {{filename}}

    **Primary Purpose & Responsibility:**
    (Describe the main goal of this file/module. What is its primary role in the application?)

    **Key Components & Their Roles:**
    (List major functions, classes, methods, or distinct code blocks. For each, briefly explain its specific purpose and functionality.)
    *   `ComponentName1 / functionName1`: Description of its role.
    *   `ComponentName2 / functionName2`: Description of its role.
    *   ...

    **Observed External Dependencies (Imports):**
    (List all imported modules or libraries. E.g., `import React from 'react';`, `const api = require('../utils/api');`)
    *   `dependency1`
    *   `dependency2`
    *   ...

    **Basic Code Quality Observations:**
    (Provide brief, objective observations. Focus on readily apparent aspects.)
    *   **Readability:** (e.g., Clear naming, consistent formatting, complex logic easily understandable?)
    *   **Apparent Complexity:** (e.g., Long functions/methods, deep nesting, many parameters?)
    *   **Obvious Duplication:** (e.g., Any immediately noticeable repeated code blocks within this file?)
    *   **Commented-out Code:** (e.g., Presence of significant blocks of commented-out code?)
    *   **TODOs/FIXMEs:** (e.g., Number and nature of any TODO or FIXME comments.)

    **Suggestions for Immediate Improvement (if any):**
    (Based on your observations, list 1-3 actionable suggestions for quick wins if applicable. E.g., "Consider refactoring function X for clarity," "Remove commented-out code block at line Y.")
    *   Suggestion 1
    *   ...
    ```

3.  **Append to Report File:**
    *   Access the file specified by `report_file_path`.
    *   If the file does not exist, create it and prepend the title `# Code Analysis Report\n\n` before appending your generated section.
    *   Append the Markdown section (generated in Step 2) for the current target file to the `report_file_path`. Ensure there's a newline separating it from previous content if the file already exists.

## Final Output for Scribe
Upon completing the analysis for all `target_file_paths`:
*   Your final output summary (for Saul to process) MUST indicate:
    *   Successful completion of the `perform_code_analysis` task.
    *   The `report_file_path` where the analysis was written.
    *   A list of `target_file_paths` that were processed.
    *   Any files from `target_file_paths` that could not be processed, with a brief reason.
*   Example: "Completed `perform_code_analysis` task. Report appended to `docs/CodeAnalysisReport.md`. Analyzed files: `src/utils/api.js`, `src/components/UserManager.jsx`."
