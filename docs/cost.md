# Cost Optimization: LLM Tier Recommendations**

This is an incredibly important aspect of building a sustainable AI workforce. You want to use your most powerful (and expensive) models for the tasks that require the most reasoning and creativity, and more efficient models for simpler, more repetitive tasks.

Here is my recommended tiered model assignment strategy for the Pheromind swarm, using your Gemini examples:

| Agent                                 | Recommended Tier                                       | Justification                                                                                                                                                                             |
| :------------------------------------ | :----------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Olivia** (`bmad-orchestrator`)        | **Tier 1 (Highest Intelligence - e.g., Gemini 1.5 Pro)** | **Mission-Critical.** This is the system's brain. It performs the most complex reasoning: interpreting project state, prioritizing from dozens of signals, and making strategic delegation decisions. Using a less capable model here would cause the entire autonomous loop to fail. This is the one agent where you should never compromise on intelligence. |
| **Saul** (`bmad-master`)              | **Tier 1 (Highest Intelligence - e.g., Gemini 1.5 Pro)** | **Mission-Critical.** Saul's job is to translate nuanced, unstructured natural language into precise, structured JSON signals. This is a highly sophisticated interpretation task. A less capable model will generate incorrect signals, "poisoning" the state file and leading to incorrect actions by the swarm. |
| **Architect** (`architect`)            | Tier 1 / Tier 2 (Pro / Flash)                            | High-quality architecture prevents countless downstream problems. Use **Tier 1** for generating the initial, complex architecture document. For smaller reviews or updates, **Tier 2** is likely sufficient. |
| **Analyst** (`analyst`)                 | Tier 1 / Tier 2 (Pro / Flash)                            | The Analyst's tasks vary. For creative brainstorming or simple project briefs, **Tier 2** is fine. For the `perform_code_analysis` or `create-deep-research-prompt` tasks, **Tier 1** is highly recommended to ensure depth and accuracy. |
| **Developer** (`dev`)                 | **Tier 2 (Balanced - e.g., Gemini 1.5 Flash)**           | **Workhorse.** James's tasks are highly structured and scoped by the detailed story file created by the Scrum Master. He needs to be a competent coder, but he doesn't need to do high-level strategic thinking. A balanced, fast, and cost-effective model is perfect for this role. |
| **Debugger** (`debugger`) & **Refactorer** (`refactorer`) | Tier 1 / Tier 2 (Pro / Flash)                            | These are specialized, high-impact tasks that require a deep understanding of code logic and patterns. **Tier 1** is ideal for ensuring an accurate diagnosis or a high-quality refactoring. |
| **PM, PO, SM, QA, UX**                | **Tier 2 (Balanced - e.g., Gemini 1.5 Flash)**           | These agents perform structured tasks based on templates and checklists. They need to be reliable and thorough but don't typically require the same level of abstract reasoning as Olivia or Saul. |

#### **An Advanced Strategy: Session-Based Tiering**

In a sophisticated environment like Roo Code, you have fine-grained control. Here’s a practical way to apply this strategy:

1.  **For Phase 1 (Planning):** When you are working in the Web UI or in your IDE to generate the initial PRD and Architecture documents, **set your IDE's default model to Tier 1 (Pro)**. You want the highest quality for these foundational artifacts.
2.  **For Phase 2 (Autonomous Execution):** Once you hand off to Olivia to start the autonomous loop, **switch your IDE's default model to Tier 2 (Flash)**. The majority of the swarm's execution tasks (coding, creating stories, running tests) can be handled perfectly well by the more cost-effective model, as the strategic thinking has already been encoded into the planning documents and state signals.

This hybrid approach ensures you use your most powerful models for the highest-leverage tasks while optimizing for speed and cost during the day-to-day execution loop.
