# WasaPrecruit - Product Backlog (Brainstorm)

This document captures potential features, enhancements, and ideas for future development beyond the initial MVP. Items are loosely categorized and range from concrete next steps to vague, long-term possibilities.

## AI & Automation

*   **Conversational AI:** Expand AI capabilities beyond basic FAQ to handle more complex questions or initial qualification dialogues.
*   **Sentiment Analysis:** Analyze aspirant message sentiment to flag potential issues or positive engagement for recruiters.
*   **AI-Suggested Replies:** Provide recruiters with context-aware reply suggestions.
*   **Advanced FAQ Handling:** Allow AI to manage a broader, more dynamic set of FAQs based on aspirant questions.
*   **Persona Consistency AI:** Explore AI assistance in helping recruiters maintain the target persona (e.g., tone checks).
*   **A/B Testing (Bot Messages):** Allow testing different initial contact messages or FAQ responses.

## Recruiter Workflow & UI/UX

*   **Conversation Assignment:** Manually or automatically assign conversations to specific recruiters.
*   **Advanced Routing/Assignment Logic (e.g., load, skills):** Implement sophisticated chat routing beyond basic assignment.
*   **Advanced Status Tracking:** Implement custom conversation stages/pipeline (e.g., "Form Sent," "Qualified," "Interview Scheduled").
*   **Qualification Workflow Support:** UI elements/steps to guide recruiters through standardized qualification.
*   **Internal Notes & Tagging:** Allow recruiters to add private notes or tags (e.g., #urgent, #followup) to conversations.
*   **Canned Responses:** Enable recruiters to quickly insert pre-written responses for common complex questions.
*   **Bulk messaging capabilities:** Allow sending messages to multiple aspirants simultaneously (use with caution regarding WhatsApp policies).
*   **UI Highlighting:** Automatically highlight key data points in the aspirant info panel (e.g., location, `has_kids`).
*   **Proactive Aspirant Data Utilization (Automated triggers/highlights based on form data):** Use form data for more than just display.
*   **Scheduled Messages:** Allow recruiters to schedule messages for later delivery.
*   **Recruiter Gamification:** Introduce elements to track and incentivize performance (e.g., conversion leaderboards).
*   **Rich Media Handling:** Improve support for sending/receiving images or documents directly in the chat interface (beyond basic WA support).
*   **In-Platform Training:** Embed guidelines, persona docs, or training materials.
*   **Persona Guidance Tools (UI elements/reminders):** Subtle prompts/links in UI to aid persona consistency.
*   **Easy Privacy Policy Sharing:** One-click button for recruiters to send the privacy policy link.

## Integrations

*   **Payment System Integration:** Connect with payment platforms for tracking or initiating payments.
*   **CRM Integration:** Sync aspirant data and conversation status with the main agency CRM.
*   **Calendar Integration:** Facilitate scheduling interviews or calls directly from the platform.
*   **Multi-channel Support:** Integrate other messaging channels (SMS, Facebook Messenger, etc.).
*   **Internal Comms Integration:** Link with Slack/Teams for notifications or internal discussion about aspirants.

## Analytics & Reporting

*   **Comprehensive Dashboard:** Develop a dashboard with detailed metrics on recruiter activity, conversion funnels, message volume, FAQ usage, etc.
*   **Aspirant Insights:** Analyze aggregated data for insights into common pain points, drop-off reasons, or successful communication patterns.

## Operational & Technical

*   **Robust Error Handling/Monitoring:** Enhanced monitoring and alerting for API failures (WhatsApp, Form).
*   **Performance Optimization:** Specific efforts to optimize for high concurrency and message volume.
*   **Load Testing:** Implement regular load testing.
*   **Specific Scalability/Security/Compliance Targets Definition:** Define concrete NFRs for future iterations.
*   **Automated E2E Testing:** Build out a comprehensive automated testing suite.
*   **Role-Based Access Control:** Introduce different permission levels (e.g., Recruiter, Manager, Admin).
*   **Audit Log:** Detailed logging of user actions within the platform.

## Long-Term / Vague Ideas

*   **Aspirant Portal:** A simple web portal for aspirants to check status, update info, or access resources (significant effort).
*   **Video Call Integration:** Initiate video calls directly from the chat interface.
*   **Automated Qualification Scoring:** AI-based scoring of aspirant potential based on form data and chat interaction.
*   **Integrated Web Form Builder/Management:** Build form capabilities directly into the platform. 