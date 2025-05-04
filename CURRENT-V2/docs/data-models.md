# Data Models: WasaPrecruit MVP

This document describes the core data entities and their structures stored in the database (PostgreSQL) for the WasaPrecruit MVP.

**Notation:**

*   Types follow TypeScript syntax.
*   `PK`: Primary Key
*   `FK`: Foreign Key
*   `?`: Optional field

## 1. `Aspirant`

Represents a potential modeling aspirant who has interacted with the system via WhatsApp and potentially submitted the web form.

```typescript
interface Aspirant {
  id: string; // PK - Generated UUID or unique identifier
  whatsappId: string; // Unique - Aspirant's WhatsApp phone number (e.g., E.164 format)
  whatsappName?: string; // Name provided by WhatsApp profile (can be unreliable)
  
  // Data from Web Form
  firstName?: string;
  lastName?: string;
  email?: string; // Optional, depending on form
  location?: string; // e.g., City/Region
  preferredModelingType?: string[]; // Array of strings (e.g., ['Runway', 'Commercial'])
  hasKids?: boolean;
  preferredShift?: 'morning' | 'afternoon' | 'evening' | 'flexible' | 'any';
  unavailableShifts?: ('morning' | 'afternoon' | 'evening')[];
  notes?: string; // Any additional notes from the form
  formSubmittedAt?: Date;

  // System Data
  photoUrl?: string; // URL to the photo stored in S3 (submitted via WhatsApp)
  conversationId?: string; // FK to Conversation (might be implicitly linked via whatsappId)
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**

*   `whatsappId` (Unique)
*   `createdAt`
*   `formSubmittedAt`

## 2. `Conversation`

Represents a chat conversation between the system/recruiter and an aspirant.

```typescript
interface Conversation {
  id: string; // PK - Generated UUID
  aspirantWhatsappId: string; // FK (conceptually) to Aspirant via whatsappId - identifies the participant
  // OR alternatively: aspirantId: string; // FK to Aspirant.id if preferred
  
  status: 'new' | 'open' | 'pending_form' | 'pending_photo' | 'needs_attention' | 'closed' | 'archived'; // Conversation status
  assignedRecruiterId?: string; // FK to Recruiter/User (if assignment is implemented later)
  lastMessageTimestamp?: Date; // Timestamp of the last message for sorting
  unreadCount: number; // For recruiter view

  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**

*   `aspirantWhatsappId`
*   `status`
*   `lastMessageTimestamp`
*   `assignedRecruiterId` (if used)

**Note:** A conversation might be implicitly defined by messages associated with a unique `aspirantWhatsappId`. A separate `Conversation` table is useful for managing state (`status`, `assignedRecruiterId`, `unreadCount`) independent of individual messages.

## 3. `Message`

Represents a single message within a conversation.

```typescript
interface Message {
  id: string; // PK - Generated UUID or provider's message ID (if unique and suitable)
  conversationId: string; // FK to Conversation
  senderType: 'aspirant' | 'recruiter' | 'bot';
  senderId?: string; // FK to Recruiter/User ID if senderType is 'recruiter'
  aspirantWhatsappId: string; // Denormalized for easier querying by aspirant
  
  text?: string; // Message content (if text)
  mediaUrl?: string; // URL to media (e.g., photo in S3)
  mediaType?: 'image' | 'video' | 'audio' | 'document'; // Type of media
  
  providerMessageId?: string; // Original message ID from WhatsApp provider (e.g., Twilio SID)
  status: 'sent' | 'delivered' | 'read' | 'failed'; // Status of outbound messages
  timestamp: Date; // Time the message was sent/received
  
  createdAt: Date;
}
```

**Indexes:**

*   `conversationId`
*   `aspirantWhatsappId`
*   `timestamp`
*   `senderType`

## 4. `Recruiter` (User Model)

Represents an agency recruiter using the platform (details depend on authentication provider like Cognito).

```typescript
interface Recruiter {
  id: string; // PK - Often corresponds to Cognito User Sub
  name: string;
  email: string; // Unique
  // Add roles/permissions if needed later
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**

*   `email` (Unique)

## Relationships

*   One `Aspirant` potentially relates to one `Conversation` (based on `whatsappId`).
*   One `Conversation` contains many `Messages`.
*   One `Recruiter` can send many `Messages`.

## Notes on Evolution

*   **Normalization:** Some fields like `aspirantWhatsappId` are denormalized onto `Message` for query performance. Assess trade-offs if data consistency becomes complex.
*   **JSONB:** Consider using PostgreSQL's JSONB type for flexible fields like `formDetails` if the web form structure is expected to change frequently, though explicit columns offer better indexing and type safety initially.
*   **Scalability:** Partitioning message tables by date or `conversationId` might be necessary for very high volumes in the future.

## Change Log

| Change        | Date       | Version | Description   | Author         |
| ------------- | ---------- | ------- | ------------- | -------------- |
| Initial draft | YYYY-MM-DD | 0.1     | Initial draft | {Agent/Person} |
| ...           | ...        | ...     | ...           | ...            |
