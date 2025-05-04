# Project Structure: WasaPrecruit MVP

This document outlines the proposed directory structure for the WasaPrecruit MVP codebase. The structure aims for clarity, modularity, separation of concerns, and ease of navigation, particularly facilitating development by AI agents working on specific components.

**Guiding Principles:**

*   **Separation of Concerns:** Frontend, Backend API, AI Bot logic, Infrastructure code, and shared utilities are clearly separated.
*   **Modularity:** Components are broken down into smaller, focused modules/files (Single Responsibility Principle - SRP).
*   **Discoverability:** Logical naming conventions and clear directory hierarchies.
*   **Agent-Friendliness:** Small, well-defined files with clear inputs/outputs are easier for AI agents to understand, modify, and test.
*   **Technology-Based Grouping:** Within major components (like backend), grouping by feature or function might be used, but initial grouping often aligns with technology patterns (e.g., Lambda handlers, GraphQL resolvers).

## Root Directory Structure

```plaintext
/
├── .github/                    # CI/CD workflows (e.g., GitHub Actions)
│   └── workflows/
│       └── deploy.yml
├── .vscode/                    # VS Code settings (launch configs, extensions)
├── docs/                       # Project documentation (Architecture, Epics, etc.)
│   ├── templates/              # Original templates
│   ├── architecture.md
│   ├── coding-standards.md
│   ├── data-models.md
│   ├── environment-vars.md
│   ├── epic1.md                # Example Epic
│   ├── product-backlog.md
│   ├── project-brief-mvp.md
│   ├── project-structure.md
│   ├── tech-stack.md
│   └── testing-strategy.md
│   └── api-reference.md
│   └── frontend-architecture.md # (If needed later for deep FE specifics)
├── infrastructure/             # Infrastructure as Code (IaC - e.g., AWS CDK)
│   ├── bin/
│   │   └── infrastructure.ts
│   ├── lib/
│   │   ├── database-stack.ts
│   │   ├── backend-api-stack.ts
│   │   ├── frontend-deployment-stack.ts
│   │   └── ... (other stacks: auth, storage, etc.)
│   ├── package.json
│   ├── tsconfig.json
│   └── cdk.json
├── packages/                   # Shared libraries/utilities (using npm/yarn workspaces)
│   └── common-types/           # Shared TypeScript types (DTOs, interfaces)
│       ├── src/
│       │   ├── index.ts
│       │   └── aspirant.ts
│       ├── package.json
│       └── tsconfig.json
├── services/                   # Backend services (Lambda functions, etc.)
│   ├── api/                    # Backend API Lambdas (triggered by AppSync/API GW)
│   │   ├── src/
│   │   │   ├── graphql/        # GraphQL specific files (schema, resolvers)
│   │   │   │   ├── schema.graphql
│   │   │   │   └── resolvers/
│   │   │   │       ├── aspirant.ts
│   │   │   │       └── message.ts
│   │   │   ├── handlers/       # Lambda handler entry points
│   │   │   │   ├── getAspirant.ts
│   │   │   │   └── sendMessage.ts
│   │   │   └── utils/          # API specific utilities
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── serverless.yml      # Or similar deployment config if not solely CDK
│   ├── ai-bot/                 # AI Bot Service Lambda
│   │   ├── src/
│   │   │   ├── handler.ts      # Main entry point
│   │   │   └── logic.ts        # Bot interaction flow logic
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── whatsapp-ingestor/      # WhatsApp Integration Service Lambda
│   │   ├── src/
│   │   │   ├── handler.ts      # Webhook handler
│   │   │   └── imageProcessor.ts # Logic for handling image uploads to S3
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── ...                     # Other potential microservices/Lambdas
├── ui/                         # Frontend React Application
│   ├── public/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/         # Reusable UI components (atoms, molecules)
│   │   ├── features/           # Feature-specific components/logic (e.g., Chat, AspirantProfile)
│   │   │   ├── chat/
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   └── MessageList.tsx
│   │   │   └── aspirant/
│   │   │       └── AspirantProfilePanel.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   ├── layouts/            # Top-level page layouts
│   │   ├── pages/              # Page components
│   │   ├── services/           # API interaction logic (e.g., AppSync/GraphQL calls)
│   │   ├── store/              # State management (e.g., Zustand stores)
│   │   ├── styles/             # Global styles, theme configuration
│   │   └── types/              # Frontend specific types (can import from packages/common-types)
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── .env.example                # Example environment variables
├── .eslintignore
├── .eslintrc.js                # ESLint configuration
├── .gitignore
├── .prettierrc.js              # Prettier configuration
├── package.json                # Root package.json (for workspaces, scripts)
├── README.md                   # Project overview, setup instructions
└── tsconfig.base.json          # Base TypeScript config shared across packages/services
```

## Key Directory Explanations

*   **`docs/`**: All non-code documentation.
*   **`infrastructure/`**: Contains all IaC code (using AWS CDK in this example) to define and deploy the cloud resources.
*   **`packages/`**: Monorepo setup for shared code. `common-types` is crucial for ensuring type consistency between frontend and backend services.
*   **`services/`**: Houses the backend microservices/functions. Each subdirectory represents a deployable unit (usually a Lambda function or a related group).
    *   **`api/`**: The main backend API logic, potentially including GraphQL schema/resolvers and Lambda handlers.
    *   **`ai-bot/`**: Isolated logic for the automated bot interactions.
    *   **`whatsapp-ingestor/`**: Handles incoming webhooks from the WhatsApp provider.
*   **`ui/`**: The React frontend application code, structured by feature and component type.

This structure provides a clear separation, making it easier for developers (and AI agents) to locate relevant code, understand dependencies, and work on specific parts of the system without unintended side effects.

## Change Log

| Change        | Date       | Version | Description   | Author         |
| ------------- | ---------- | ------- | ------------- | -------------- |
| Initial draft | YYYY-MM-DD | 0.1     | Initial draft | {Agent/Person} |
| ...           | ...        | ...     | ...           | ...            |
