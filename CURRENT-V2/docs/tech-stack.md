# Technology Stack: WasaPrecruit MVP

This document details the technology stack selected for the WasaPrecruit MVP, aligned with the architecture defined in `docs/architecture.md`.

## Frontend

*   **Framework:** React (v18+)
    *   *Rationale:* User preference, large community, rich ecosystem of libraries, component-based architecture suitable for complex UIs.
*   **Language:** TypeScript
    *   *Rationale:* Static typing improves code quality, maintainability, and developer productivity, especially important for AI-assisted development.
*   **State Management:** Zustand (or potentially Redux Toolkit / Context API)
    *   *Rationale:* Zustand offers a simple, scalable, and performant state management solution suitable for React. Final choice might depend on specific team preference and complexity encountered.
*   **UI Library:** Material UI (MUI) or Chakra UI
    *   *Rationale:* Provides pre-built, accessible, and customizable components to accelerate development and ensure a consistent look and feel. MUI is a robust and popular choice.
*   **Real-time Communication:** AWS Amplify UI Components with AppSync Subscription support / Apollo Client for GraphQL
    *   *Rationale:* Libraries to handle WebSocket connections managed by AWS AppSync for receiving real-time updates.
*   **Build Tool:** Vite
    *   *Rationale:* Fast development server and optimized production builds.
*   **Deployment:** AWS S3 + CloudFront
    *   *Rationale:* Standard, scalable, and cost-effective way to host and distribute static web applications globally.

## Backend

*   **Platform:** Node.js (LTS version, e.g., v18 or v20)
    *   *Rationale:* Efficient event-driven I/O suitable for real-time applications and chat systems. JavaScript/TypeScript allows for code sharing/consistency with the frontend. Large package ecosystem (npm).
*   **Language:** TypeScript
    *   *Rationale:* Same benefits as for the frontend: type safety, maintainability.
*   **Runtime Environment:** AWS Lambda
    *   *Rationale:* Serverless compute enables automatic scaling, reduces operational overhead, cost-effective pay-per-use model.
*   **API Layer:** AWS AppSync (GraphQL) and/or AWS API Gateway (REST)
    *   *Rationale:* AppSync provides managed GraphQL including real-time subscriptions via WebSockets. API Gateway can be used for RESTful endpoints (like webhooks). Combination offers flexibility.
*   **Framework (Optional for Lambda):** Potentially lightweight frameworks like Express.js within Lambda handlers if complex routing/middleware is needed, but often plain handlers suffice.
*   **Messaging Queue (Implicit/Explicit):** AWS SQS (Simple Queue Service)
    *   *Rationale:* Decouples services (e.g., WhatsApp Ingestion from Backend Processing), improves fault tolerance and scalability. Can be used explicitly or implicitly via Lambda event source mappings.

## Database

*   **Type:** Relational Database (RDBMS)
*   **Service:** AWS RDS for PostgreSQL (latest stable version)
    *   *Rationale:* Managed service simplifies administration, backups, scaling. PostgreSQL offers ACID compliance, rich feature set (JSONB support), and good performance.
*   **ORM/Query Builder (Optional):** Prisma or TypeORM
    *   *Rationale:* Improves developer productivity and type safety when interacting with the database from TypeScript.

## AI Bot Service

*   **Runtime Environment:** AWS Lambda (Node.js/TypeScript)
    *   *Rationale:* Same benefits as backend Lambda functions - isolated, scalable, event-driven.
*   **Logic:** Custom TypeScript code implementing the defined flow (welcome, form link, photo request, affirmation).
    *   *Rationale:* Sufficient for the defined MVP bot scope. Can be enhanced later.

## Infrastructure & Cloud Services

*   **Cloud Provider:** Amazon Web Services (AWS)
    *   *Rationale:* Mandated cloud-native. Offers mature and comprehensive services needed for the architecture (Lambda, AppSync, RDS, S3, SQS, API Gateway, Cognito, CloudFront).
*   **Image Storage:** AWS S3 (Simple Storage Service)
    *   *Rationale:* Scalable, durable, cost-effective object storage for aspirant photos.
*   **Authentication:** AWS Cognito
    *   *Rationale:* Managed user identity and authentication service for securing the recruiter frontend.
*   **Infrastructure as Code (IaC):** AWS CDK (Cloud Development Kit) or Terraform
    *   *Rationale:* Define infrastructure programmatically for repeatability, versioning, and automated provisioning. CDK allows using TypeScript.
*   **Monitoring & Logging:** AWS CloudWatch
    *   *Rationale:* Integrated monitoring, logging, and alerting for AWS resources.
*   **CI/CD:** GitHub Actions or AWS CodePipeline/CodeBuild
    *   *Rationale:* Automate testing and deployment processes.

## External Interfaces

*   **WhatsApp API:** Twilio API for WhatsApp (or similar provider like Vonage/Meta directly)
    *   *Rationale:* Need a reliable provider for the WhatsApp Business API connection.
*   **External Web Form API:** TBD (Depends on the service hosting the form - requires a webhook or API endpoint for data submission).

## Development Tools

*   **Version Control:** Git / GitHub (or similar)
*   **Package Managers:** npm / yarn (for Node.js/Frontend), uv pip (for Python if any utility scripts needed)
*   **IDE:** VS Code / Cursor
*   **Containerization (for local dev):** Docker (Optional, but recommended for standardizing local DB/environment)
