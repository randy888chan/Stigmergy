# Perform Initial Project Research Task

## Task Objective
Analyze a "Zero-Code User Blueprint" to identify key areas requiring external research, formulate research questions, request user assistance for web/GitHub searches, and compile findings into a structured Markdown report.

## Parameters
1.  `user_blueprint_content`: Text content of the filled "Zero-Code User Blueprint" or a path to a file containing it.
2.  `report_file_path`: The path where the research report should be written (e.g., `docs/InitialProjectResearch.md`).

## Execution Steps

You MUST perform the following:

1.  **Analyze User Blueprint:**
    *   Carefully read and understand the `user_blueprint_content`.
    *   Identify key assumptions made by the user, unique or complex features requested, target audience claims, and any explicit or implicit needs for market validation or technical feasibility assessment.

2.  **Identify Research Areas & Formulate Questions:**
    *   Based on the blueprint analysis, determine specific areas requiring external research. Examples include:
        *   **Similar Existing Applications:** Are there apps that solve the same or similar problems? What are their features, strengths, weaknesses?
        *   **Market Validation:** Is there evidence supporting the user's assumptions about the target audience and their needs?
        *   **Technical Feasibility:** Are there any unique technical requests that require checking for existing solutions, libraries, or APIs?
        *   **Open-Source Templates/Frameworks:** Could any existing open-source projects serve as a starting point or provide relevant components?
    *   For each identified research area, formulate specific research questions and targeted search queries.

3.  **Request User-Assisted Research:**
    *   **General Web Searches:** For each general research question, clearly state the query and request the user (via Olivia, the orchestrator) to perform the web search and provide a concise summary of the findings.
        *   Example: "Request for User (via Olivia): Please search for 'market size and growth trends for mobile pet grooming services in North America' and provide a summary."
    *   **GitHub Template/Framework Searches:** If the blueprint suggests a need for specific types of code, frameworks, or templates, formulate a request for the user (via Olivia) to search GitHub or other code repositories.
        *   Example: "Request for User (via Olivia): Please search GitHub for 'React Native templates for social networking app with real-time chat' and provide links to 2-3 promising repositories or a summary of findings."
    *   **Specific URL Research:** If the blueprint mentions specific competitor websites, reference articles, or other URLs that could provide valuable information, or if such URLs are clearly derivable from the context, list these URLs and the specific information to look for. Formulate a request for Olivia/user to use a `view_text_website`-like tool to fetch content if direct access isn't available to you.
        *   Example: "Request for Olivia/User: Please use a web browsing tool to get the main features listed on `competitorapp.com/features`."

4.  **Structure and Compile Report:**
    *   Organize the research requests and any findings (if provided directly by the user during an interactive session) into a structured Markdown report written to the `report_file_path`.
    *   The report should include:
        *   An introduction stating the purpose of the research based on the blueprint.
        *   A section for each key research area identified.
        *   Within each section:
            *   The specific research questions/queries formulated.
            *   A placeholder for "User/Olivia Provided Findings:" if the research is pending user action.
            *   Any initial thoughts or hypotheses based on the blueprint, before external research.
    *   Example Structure:
        ```markdown
        # Initial Project Research for [Project Idea from Blueprint]

        ## 1. Similar Existing Applications
        **Research Questions:**
        *   What are the top 3 existing applications similar to [Project Idea]?
        *   What are their core features, pricing, and user reviews?
        **Search Queries for User (via Olivia):**
        *   "Top [Project Type] apps like [Project Idea]"
        *   "Reviews and pricing for [Competitor A, B, C]"
        **User/Olivia Provided Findings:**
        *   (pending)

        ## 2. Market Validation for [User Assumption X]
        ...
        ```

5.  **Handle Blueprint Content:**
    *   If `user_blueprint_content` is a path, read the file. If it's direct text, use it as is.
    *   If the blueprint content cannot be accessed or is empty, report this as an issue.

## Final Output for Scribe
Upon completing the research planning and report structure:
*   Your final output summary (for Saul to process) MUST indicate:
    *   Successful completion of the `perform_initial_project_research` task.
    *   The `report_file_path` where the initial research structure and requests were written.
    *   A statement that the report contains pending research items requiring user/Olivia action.
*   Example: "Completed `perform_initial_project_research` task. Initial research plan and queries compiled into `docs/InitialProjectResearch.md`. This report contains requests for user/Olivia to perform external searches."
