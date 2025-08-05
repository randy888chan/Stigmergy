# Example Workflow: Modern Web Application

This workflow is tailored for developing a modern web application, for example, using the MERN stack (MongoDB, Express, React, Node.js).

## Core Agents

This workflow prioritizes a team of agents with specialized skills in web development:

- **`@pm` (Project Manager)**: Breaks down the high-level goal into a detailed project plan and user stories.
- **`@design-architect`**: Designs the overall application architecture, including the API structure, database schema, and frontend component hierarchy.
- **`@ux-expert`**: Provides input on user experience and interface design, ensuring the application is intuitive and user-friendly.
- **`@dev` (as a Frontend Specialist)**: Focuses on writing React components, managing state, and interacting with the backend API.
- **`@dev` (as a Backend Specialist)**: Focuses on building the Express server, defining API endpoints, and handling database logic.
- **`@qa`**: Writes and runs integration tests and end-to-end tests to ensure the application works as expected.

## Workflow Customization

To enforce this workflow, you could customize the `@dispatcher` agent's prompt to prioritize this team for tasks related to web development.

For example, you could modify the dispatcher's instructions to say:

"If the goal involves creating a web application, your primary team consists of `@pm`, `@design-architect`, `@ux-expert`, `@dev`, and `@qa`. Delegate tasks accordingly, ensuring a clear separation between frontend and backend development tasks."

This ensures that the right specialists are assigned to the right tasks, leading to a more efficient and higher-quality development process.
