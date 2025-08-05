# Example Workflow: Data Processing Pipeline

This workflow is designed for projects that involve ingesting, cleaning, analyzing, and reporting on large datasets.

## Core Agents

This workflow leverages agents skilled in data analysis and backend processing. The team might look like this:

- **`@analyst`**: The lead agent for this workflow. It is responsible for understanding the data, identifying patterns, and defining the steps required for the analysis. It might use tools like `research.deep_dive` to understand the domain or specific data formats.
- **`@dev` (as a Data Engineer)**: This agent is tasked with writing the core data processing scripts. You would customize this agent's environment to have access to libraries like Pandas, NumPy, or even Spark through shell commands.
- **`@refactorer` (as a Code Optimizer)**: Once the initial scripts are working, this agent can be tasked with optimizing them for performance and efficiency.
- **`@qa`**: This agent would be responsible for data validation. It would write tests to ensure data integrity at each step of the pipeline (e.g., checking for null values, verifying data types, ensuring calculations are correct).
- **`@whitepaper_writer`**: After the analysis is complete, this agent can be used to generate a report or summary of the findings, using the structured data produced by the pipeline.

## Workflow Customization

For this workflow, you would heavily customize the tools and environment.

1.  **Custom Tools**: You might create a new tool, e.g., `data_tools.js`, with functions to connect to a database, run a SQL query, or load a CSV file into a structured format.
2.  **Shell Permissions**: The `@dev` agent would need `shell.execute` permissions to run Python scripts (`python process_data.py`).
3.  **Dispatcher Logic**: The `@dispatcher` would be instructed to follow a specific sequence:
    1.  `@analyst` defines the data requirements.
    2.  `@dev` implements the processing script.
    3.  `@qa` validates the output.
    4.  `@whitepaper_writer` generates the final report.

This structured approach ensures that data processing tasks are handled methodically, with clear roles and responsibilities for each agent.
