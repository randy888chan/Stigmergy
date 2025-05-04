# Environment Variables: WasaPrecruit MVP

This document outlines the strategy for managing environment variables and configuration for the different services within the WasaPrecruit MVP.

## Strategy

*   **Centralized Management:** For deployed environments (Staging, Production), use AWS Systems Manager Parameter Store or AWS Secrets Manager to securely store and manage configuration values, especially secrets.
*   **IaC Integration:** Infrastructure as Code (AWS CDK / Terraform) will be responsible for provisioning the parameters/secrets and injecting them into the relevant service environments (e.g., Lambda function environment variables, build-time injection for Frontend if necessary).
*   **Local Development:** Use `.env` files (git-ignored) in the respective service directories (`services/api`, `services/ai-bot`, `ui`, etc.) for local configuration. A `.env.example` file should be committed for each service, listing required variables without their values.
*   **Naming Convention:** Use `UPPER_SNAKE_CASE` for environment variable names.
*   **TypeScript Access:** Use a configuration loading utility (or plain `process.env`) within services to access variables with type safety where possible.

## Variables by Service

*(Note: This is an initial list and may evolve. Actual names might vary slightly based on IaC implementation.)*

### 1. Frontend (`ui/.env`)

```plaintext
# .env.example for ui

# AWS AppSync / API Gateway Endpoint
VITE_API_ENDPOINT= # e.g., https://<appsync_id>.appsync-api.<region>.amazonaws.com/graphql
VITE_API_REGION= # e.g., us-east-1

# AWS Cognito Configuration
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_USER_POOL_WEB_CLIENT_ID=
VITE_COGNITO_REGION= # e.g., us-east-1

# Optional: Analytics, feature flags, etc.
```
*   **Rationale:** Variables prefixed with `VITE_` are exposed to the frontend build process by Vite.

### 2. Backend API (`services/api/.env`)

```plaintext
# .env.example for services/api

# Database Connection (Provided by RDS via Secrets Manager)
# DB_HOST=
# DB_PORT=
# DB_USER=
# DB_PASSWORD=
# DB_NAME=
DATABASE_SECRET_ARN= # ARN of the Secrets Manager secret containing DB credentials

# AWS Region
AWS_REGION=us-east-1

# WhatsApp Integration Service Endpoint/ARN (If direct invocation needed)
WHATSAPP_SENDER_FUNCTION_ARN=

# AI Bot Service Endpoint/ARN (If direct invocation needed)
AI_BOT_FUNCTION_ARN=

# SQS Queue URL (If explicitly used)
MESSAGE_PROCESSING_QUEUE_URL=

# CORS Origins (for API Gateway if used)
ALLOWED_ORIGINS= # e.g., http://localhost:3000,https://yourdomain.com
```
*   **Note:** Database credentials should **not** be directly in environment variables in deployed stages; use integration with Secrets Manager.

### 3. AI Bot Service (`services/ai-bot/.env`)

```plaintext
# .env.example for services/ai-bot

# AWS Region
AWS_REGION=us-east-1

# WhatsApp Integration Service Endpoint/ARN (for sending messages)
WHATSAPP_SENDER_FUNCTION_ARN=

# Pre-defined Bot Messages (Can be env vars or config files)
BOT_WELCOME_MESSAGE="Welcome! Please fill out our form: {formLink}"
BOT_PHOTO_REQUEST_MESSAGE="Thanks! Could you please send a recent photo?"
BOT_AFFIRMATION_MESSAGE="Thank you! You look great. We've received your info and you're approved to proceed. We'll contact you about training soon."

# External Web Form Base URL (to construct unique links)
FORM_BASE_URL=https://forms.example.com/aspirant
```

### 4. WhatsApp Integration Service (`services/whatsapp-ingestor/.env`)

```plaintext
# .env.example for services/whatsapp-ingestor

# WhatsApp Provider Credentials (via Secrets Manager ideally)
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_WHATSAPP_NUMBER=
WHATSAPP_CREDENTIALS_SECRET_ARN= # ARN of the Secrets Manager secret

# S3 Bucket for Images
IMAGE_BUCKET_NAME=

# Backend API Endpoint / SQS Queue
MESSAGE_PROCESSING_QUEUE_URL=
# OR API_ENDPOINT= if calling API directly

# Webhook Validation Token (If required by provider)
WHATSAPP_WEBHOOK_TOKEN=

# AWS Region
AWS_REGION=us-east-1
```

## Security

*   **NEVER** commit `.env` files or actual secret values to version control.
*   Use AWS Secrets Manager for sensitive credentials (Database passwords, API keys).
*   Restrict permissions (IAM Roles) so that services can only access the configuration they need.

## Management

*   IaC code (CDK/Terraform) is the source of truth for configuration in deployed environments.
*   Update `.env.example` files whenever new required variables are added.
