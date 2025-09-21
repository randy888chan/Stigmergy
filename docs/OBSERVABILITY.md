# 📊 Stigmergy Observability Guide

## Overview

Stigmergy provides comprehensive observability features to monitor system performance, track costs, and analyze agent behavior in real-time. The primary tool for this is the **Command & Control Dashboard**.

## The Command & Control Dashboard

The dashboard is a real-time, web-based interface that provides a complete overview of the Stigmergy engine's operations.

**How to Access:**
1.  Start the Stigmergy service with `stigmergy start-service`.
2.  Open your web browser and navigate to **`http://localhost:3010`**.

### Key Features

*   **Real-Time Activity Log**: A live feed of all engine activities, including agent triggers, tool executions, and system logs. This gives you a window into the "mind" of the AI swarm.
*   **Cost Monitoring**: A live-updating view of your spending on AI models, with breakdowns by provider and historical trends.
*   **Task Management**: View the status of all current tasks, including their dependencies and assigned agents.
*   **State Visualization**: Inspect the raw state of the project, including the project manifest, history, and performance metrics.
*   **Interactive Controls**: Pause, resume, or approve engine operations directly from the UI.

## Advanced Observability (For Power Users)

While the dashboard is the primary interface, the underlying data sources can be accessed directly for advanced use cases or scripting.

### Cost Monitoring API

Stigmergy exposes a simple API endpoint to get the latest cost tracking data.

*   **Endpoint**: `GET /api/cost`
*   **Example**:
    ```bash
    curl http://localhost:3010/api/cost
    ```
*   **Returns**: A JSON object containing `totalCost`, `dailyCost`, `providerCosts`, and `dailyCostHistory`.

### Trajectory Recordings

For deep debugging and auditing, Stigmergy records the complete execution path of agent tasks. These "trajectories" capture every LLM interaction, tool call, and state change.

*   **Location**: Trajectory recordings are saved as individual JSON files in your project's `.stigmergy/trajectories/` directory.
*   **Use Cases**:
    *   Analyzing the root cause of a failed task.
    *   Auditing the decision-making process of an agent.
    *   Creating datasets for fine-tuning models.

### Performance Benchmarking

The Stigmergy benchmark suite is a powerful tool for performance observability. It allows you to validate the system's capabilities on a standardized set of complex problems.

*   **Purpose**: To measure end-to-end performance, identify bottlenecks, and ensure production readiness.
*   **How to Run**:
    ```bash
    # Run the full benchmark suite
    npm run test:benchmark
    ```
*   **Output**: The runner generates detailed JSON reports in the `evaluation/` directory, including pass/fail status, execution duration, and resource usage for each problem.

## Best Practices

1.  **Use the Dashboard First**: For most monitoring needs, the real-time dashboard is the most efficient and user-friendly tool.
2.  **Review Costs Regularly**: Keep an eye on the cost monitor to understand your spending patterns and optimize model usage.
3.  **Use Trajectories for Deep Dives**: When an agent behaves unexpectedly, its trajectory recording is the best place to start your investigation.
4.  **Run Benchmarks Periodically**: Use the benchmark suite to check for performance regressions after making significant changes to agents or tools.