# {Project Name} API Reference

## External APIs Consumed

{Repeat this section for each external API the system interacts with.}

### {External Service Name} API

- **Purpose:** {Why does the system use this API?}
- **Base URL(s):**
  - Production: `{URL}`
  - Staging/Dev: `{URL}`
- **Authentication:** {Describe method - e.g., API Key in Header (Header Name: `X-API-Key`), OAuth 2.0 Client Credentials, Basic Auth. Reference `docs/environment-vars.md` for key names.}
- **Key Endpoints Used:**
  - **`{HTTP Method} {/path/to/endpoint}`:**
    - Description: {What does this endpoint do?}
    - Request Parameters: {Query params, path params}
    - Request Body Schema: {Provide JSON schema or link to `docs/data-models.md`}
    - Example Request: `{Code block}`
    - Success Response Schema (Code: `200 OK`): {JSON schema or link}
    - Error Response Schema(s) (Codes: `4xx`, `5xx`): {JSON schema or link}
    - Example Response: `{Code block}`
  - **`{HTTP Method} {/another/endpoint}`:** {...}
- **Rate Limits:** {If known}
- **Link to Official Docs:** {URL}

### {Another External Service Name} API

{...}

## Internal APIs Provided (If Applicable)

{If the system exposes its own APIs (e.g., in a microservices architecture or for a UI frontend). Repeat for each API.}

### {Internal API / Service Name} API

- **Purpose:** {What service does this API provide?}
- **Base URL(s):** {e.g., `/api/v1/...`}
- **Authentication/Authorization:** {Describe how access is controlled.}
- **Endpoints:**
  - **`{HTTP Method} {/path/to/endpoint}`:**
    - Description: {What does this endpoint do?}
    - Request Parameters: {...}
    - Request Body Schema: {...}
    - Success Response Schema (Code: `200 OK`): {...}
    - Error Response Schema(s) (Codes: `4xx`, `5xx`): {...}
  - **`{HTTP Method} {/another/endpoint}`:** {...}

## AWS Service SDK Usage (or other Cloud Providers)

{Detail interactions with cloud provider services via SDKs.}

### {AWS Service Name, e.g., S3}

- **Purpose:** {Why is this service used?}
- **SDK Package:** {e.g., `@aws-sdk/client-s3`}
- **Key Operations Used:** {e.g., `GetObjectCommand`, `PutObjectCommand`}
  - Operation 1: {Brief description of usage context}
  - Operation 2: {...}
- **Key Resource Identifiers:** {e.g., Bucket names, Table names - reference `docs/environment-vars.md`}

### {Another AWS Service Name, e.g., SES}

{...}

## 5. Change Log

| Change        | Date       | Version | Description   | Author         |
| ------------- | ---------- | ------- | ------------- | -------------- |
| Initial draft | YYYY-MM-DD | 0.1     | Initial draft | {Agent/Person} |
| ...           | ...        | ...     | ...           | ...            |

# API Reference: WasaPrecruit MVP

This document defines the APIs exposed by the WasaPrecruit backend services, primarily focusing on the GraphQL API for frontend interaction and webhook endpoints for external integrations.

## 1. GraphQL API (AWS AppSync)

This API is the main interface for the Recruiter Frontend (React App) to fetch data, send messages, and receive real-time updates.

**Endpoint:** (Provided via Environment Variable `VITE_API_ENDPOINT`)
**Authentication:** AWS Cognito User Pools (Recruiter logins)

### 1.1. Schema Definition (`schema.graphql`)

```graphql
# Schema definition based on docs/data-models.md

scalar AWSDateTime # Represents ISO 8601 DateTime string
scalar AWSJSON     # Represents a JSON string

type Query {
  "Fetches a list of conversations, potentially filtered or paginated."
  listConversations(filter: ConversationFilterInput, limit: Int, nextToken: String): ConversationConnection
  
  "Fetches details for a specific conversation, including recent messages."
  getConversation(id: ID!): Conversation

  "Fetches messages for a specific conversation, with pagination."
  listMessages(conversationId: ID!, sortDirection: ModelSortDirection, limit: Int, nextToken: String): MessageConnection
  
  "Fetches the profile details of an aspirant by their WhatsApp ID."
  getAspirant(whatsappId: String!): Aspirant
}

type Mutation {
  "Sends a message from a logged-in recruiter to an aspirant."
  sendMessage(input: SendMessageInput!): Message
    @aws_auth(cognito_groups: ["Recruiters"]) # Example authorization
    
  "Updates the status of a conversation."
  updateConversationStatus(input: UpdateConversationStatusInput!): Conversation
    @aws_auth(cognito_groups: ["Recruiters"])
    
  # Internal mutation potentially called by webhook handler
  # processFormSubmission(input: FormSubmissionInput!): Aspirant 
  
  # Mutation to handle incoming WhatsApp messages (triggered internally)
  # processIncomingMessage(input: IncomingMessageInput!): Message
}

type Subscription {
  "Subscribes to new messages within a specific conversation."
  onNewMessage(conversationId: ID!): Message
    @aws_subscribe(mutations: ["sendMessage", "processIncomingMessage"])
    
  "Subscribes to updates for a specific aspirant profile (e.g., after form submission)."
  onAspirantUpdate(whatsappId: String!): Aspirant
    @aws_subscribe(mutations: ["processFormSubmission"])
    
  "Subscribes to new conversations appearing (for list updates)."
  onNewConversation: Conversation
    @aws_subscribe(mutations: ["processIncomingMessage"]) # Triggered when first message creates conversation
}

# --- Types --- (Based on docs/data-models.md)

type Aspirant {
  id: ID!
  whatsappId: String!
  whatsappName: String
  firstName: String
  lastName: String
  email: String
  location: String
  preferredModelingType: [String!]
  hasKids: Boolean
  preferredShift: ShiftType
  unavailableShifts: [ShiftType!]
  notes: String
  formSubmittedAt: AWSDateTime
  photoUrl: String
  conversationId: ID
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  # Potentially add conversation link here
  # conversation: Conversation 
}

type Conversation {
  id: ID!
  aspirantWhatsappId: String!
  status: ConversationStatus!
  assignedRecruiterId: String
  lastMessageTimestamp: AWSDateTime
  unreadCount: Int!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  # Associated aspirant details
  aspirant: Aspirant 
  # Paginated messages within the conversation
  messages(limit: Int, nextToken: String, sortDirection: ModelSortDirection): MessageConnection
}

type Message {
  id: ID! # Can be provider ID or generated
  conversationId: ID!
  senderType: SenderType!
  senderId: String # Recruiter ID if applicable
  aspirantWhatsappId: String! # Denormalized
  text: String
  mediaUrl: String
  mediaType: MediaType
  providerMessageId: String
  status: MessageDeliveryStatus # For outbound messages
  timestamp: AWSDateTime!
  createdAt: AWSDateTime!
}

type Recruiter {
  id: ID!
  name: String!
  email: String!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

# --- Enums ---

enum ConversationStatus {
  NEW
  OPEN
  PENDING_FORM
  PENDING_PHOTO
  NEEDS_ATTENTION
  CLOSED
  ARCHIVED
}

enum SenderType {
  ASPIRANT
  RECRUITER
  BOT
}

enum MediaType {
  IMAGE
  VIDEO
  AUDIO
  DOCUMENT
}

enum MessageDeliveryStatus {
  SENT
  DELIVERED
  READ
  FAILED
}

enum ShiftType {
  MORNING
  AFTERNOON
  EVENING
  FLEXIBLE
  ANY
}

enum ModelSortDirection {
  ASC
  DESC
}

# --- Inputs ---

input SendMessageInput {
  conversationId: ID!
  aspirantWhatsappId: String! # Target recipient
  text: String! # Simple text messages for MVP
  # mediaUrl: String # Future enhancement
  # mediaType: MediaType # Future enhancement
}

input UpdateConversationStatusInput {
  conversationId: ID!
  status: ConversationStatus!
}

input ConversationFilterInput {
  # Example filters
  status: ConversationStatus
  # assignedRecruiterId: ID
}

# Input types for internal processing/webhooks (might not be directly exposed)
# input FormSubmissionInput { ... }
# input IncomingMessageInput { ... }

# --- Connections (for Pagination) ---

type ConversationConnection {
  items: [Conversation!]
  nextToken: String
}

type MessageConnection {
  items: [Message!]
  nextToken: String
}

```

### 1.2. Key Operations

*   **`listConversations` (Query):** Fetches the list of conversations for the recruiter's main view. Supports basic filtering and pagination.
*   **`listMessages` (Query):** Fetches the message history for a selected conversation, ordered by timestamp (likely descending), with pagination.
*   **`getAspirant` (Query):** Retrieves the detailed profile information for the aspirant associated with the current conversation.
*   **`sendMessage` (Mutation):** Allows a logged-in recruiter to send a text message to an aspirant within a specific conversation.
*   **`updateConversationStatus` (Mutation):** Allows a recruiter to change the status of a conversation (e.g., close, archive).
*   **`onNewMessage` (Subscription):** Pushes new messages (from aspirant, bot, or other recruiters) to subscribed clients viewing a specific conversation.
*   **`onAspirantUpdate` (Subscription):** Pushes updates to an aspirant's profile (e.g., after form submission) to clients viewing that aspirant's details.
*   **`onNewConversation` (Subscription):** Notifies clients when a new conversation is initiated (useful for updating the conversation list).

## 2. Webhook Endpoints (AWS API Gateway + Lambda)

These endpoints receive asynchronous events from external services.

### 2.1. WhatsApp Inbound Message/Event Webhook

*   **Method:** `POST`
*   **Path:** `/webhook/whatsapp`
*   **Authentication:** Provider-specific signature validation (e.g., Twilio request validation using `X-Twilio-Signature`, or Meta's `X-Hub-Signature-256`). A shared secret/token might also be used (`WHATSAPP_WEBHOOK_TOKEN`).
*   **Request Body:** Payload structure defined by the WhatsApp provider (e.g., Twilio, Meta). Contains message details (sender, content, media type/URL), status updates, etc.
*   **Handler (`whatsapp-ingestor` Lambda):**
    1.  Validate the incoming request signature/token.
    2.  Parse the payload to extract relevant information.
    3.  If it's an image/media message, trigger upload to S3 and get the `mediaUrl`.
    4.  Determine the `conversationId` based on `aspirantWhatsappId` (create if not exists).
    5.  Construct an internal message representation.
    6.  Place the message onto an SQS queue (`MESSAGE_PROCESSING_QUEUE_URL`) for asynchronous processing OR invoke a backend API mutation (`processIncomingMessage`) directly.
    7.  Return an immediate `200 OK` response to the provider to acknowledge receipt.

### 2.2. External Web Form Submission Webhook

*   **Method:** `POST`
*   **Path:** `/webhook/form`
*   **Authentication:** Depends on the form provider. Could be a simple secret in the URL/header, or more complex signature validation.
*   **Request Body:** Payload structure defined by the external form service. Contains submitted data (name, location, preferences, `whatsappId`, etc.).
*   **Handler (Backend API Lambda via API Gateway):**
    1.  Validate the incoming request (if applicable).
    2.  Parse the payload.
    3.  Find or update the `Aspirant` record in the database using the provided `whatsappId` or other unique identifier.
    4.  Update relevant `Conversation` status (e.g., from `PENDING_FORM` to `OPEN` or `PENDING_PHOTO`).
    5.  Trigger the `onAspirantUpdate` AppSync subscription.
    6.  Return `200 OK` to the form provider.

## 3. Internal Service Communication

*   **Backend API -> AI Bot:** Likely asynchronous invocation via Lambda triggers based on events (e.g., new conversation created, form submitted). Passes necessary context (e.g., `conversationId`, `aspirantWhatsappId`).
*   **Backend API -> WhatsApp Integration (for sending):** Direct Lambda invocation (`WHATSAPP_SENDER_FUNCTION_ARN`) or placing a message on a dedicated outbound SQS queue.
*   **AI Bot -> WhatsApp Integration (for sending):** Direct Lambda invocation (`WHATSAPP_SENDER_FUNCTION_ARN`).
*   **WhatsApp Integration -> Backend API (after ingestion):** SQS Queue or direct Lambda/API call to process the message data.
