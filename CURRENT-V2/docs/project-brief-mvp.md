# Project Brief: WasaPrecruit - MVP

## Introduction / Problem Statement

The current process of managing initial recruitment conversations with potential modeling aspirants via standard WhatsApp is inefficient and prone to inconsistencies, hindering the agency's ability to scale recruitment and effectively convert interested leads. Key problems include:

1.  **Inefficient Communication Handling:** Recruiters struggle to manage a high volume of incoming WhatsApp messages effectively, leading to delays, missed conversations, and difficulty tracking interactions across multiple chats without a centralized system.
2.  **Manual & Repetitive Tasks:** Sending initial greetings, sharing application form links, and re-collecting basic information manually consumes significant recruiter time, detracting from higher-value activities like building rapport and qualifying aspirants.
3.  **Lack of Centralized Aspirant Data:** Recruiter access to essential aspirant information (submitted via a separate process or gathered piecemeal in chat) is often delayed or disorganized. This prevents recruiters from quickly personalizing communication and proactively addressing potential concerns revealed in the aspirant's profile (e.g., childcare needs mentioned due to `has_kids` flag).
4.  **Inconsistent Communication & Trust Building:** Without standardized tools and easy access to context (like chat history and structured data), maintaining a consistent, empathetic, and reassuring brand persona across all recruiter interactions is challenging. This can fail to address aspirant anxieties effectively, leading to drop-offs.
5.  **Lost Conversion Opportunities:** The combination of inefficiency, lack of personalization, and potential inconsistencies results in a suboptimal experience for aspirants, contributing to lower conversion rates from initial contact to formal application/onboarding. Aspirant doubts regarding pay, safety, flexibility, and qualifications are not systematically addressed early in the process.

This platform aims to solve these problems by centralizing communication, automating initial steps, providing immediate access to aspirant data, and equipping recruiters to address concerns more effectively, ultimately improving both recruiter efficiency and aspirant conversion rates.

## Goals & Objectives (MVP)

The primary goals for the Minimum Viable Product (MVP) are:

1.  **Enable Core Communication:** Provide recruiters with a stable web-based platform to reliably receive, view, and reply to WhatsApp messages from potential aspirants.
2.  **Streamline Initial Contact:** Automate the initial greeting and web form link delivery to aspirants via an AI bot upon receiving their first message.
3.  **Centralize Aspirant Data:** Capture key aspirant information (e.g., name, contact, location, `has_kids`, preferred modeling type) through a web form and display it clearly to the recruiter within the chat interface.
4.  **Improve Recruiter Efficiency:** Reduce the time recruiters spend on initial message handling and information gathering compared to manual WhatsApp usage.
5.  **Address Aspirant Doubts:** Equip recruiters with the necessary tools and readily available information (aspirant data from form, chat history) to proactively identify and address common aspirant concerns and anxieties (regarding pay, safety, flexibility, qualifications, etc.) early and effectively within the chat interface.
6.  **Boost Conversion Foundation:** Establish the platform foundation necessary to significantly improve the aspirant application-to-onboarding conversion rate by facilitating trust-building communication and addressing key drop-off points.
7.  **Establish Scalable Foundation:** Build the MVP on a **highly scalable technical architecture** capable of handling significant growth in aspirant volume and recruiter usage from day one, ensuring performance under load.

## Target Audience / Users

1.  **Primary Users: Agency Recruiters**
    *   **Role:** Full-time or part-time recruitment agents employed by the modeling agency.
    *   **Location:** Likely operating from an agency office or potentially remotely within Colombia.
    *   **Core Tasks:** Manage initial WhatsApp communications with a high volume of potential modeling aspirants, guide them through the initial application steps (form submission), answer questions, address concerns, build rapport using a defined persona, and qualify leads for the next stage of the onboarding process.
    *   **Needs:** An efficient, centralized platform to handle multiple WhatsApp conversations simultaneously. Quick access to aspirant-submitted data (from the web form) and conversation history to personalize interactions and address concerns effectively. Tools that reduce repetitive tasks (like initial greetings) and allow focus on relationship-building and qualification.
    *   **Assumed Technical Proficiency:** Comfortable using standard web-based applications and chat interfaces. The platform should be intuitive and require minimal specialized technical training. They need reliability and speed to manage conversation flow effectively.

2.  **Secondary Audience: Potential Modeling Aspirants**
    *   **Role:** Individuals in Colombia interested in modeling opportunities offered by the agency.
    *   **Interaction:** Communicate with the agency primarily via their personal WhatsApp accounts. They will receive automated messages (greetings, form links) and engage in chat conversations with the Primary Users (recruiters). They will also interact with a web form to submit their initial application details.
    *   **Key Characteristics & Needs:** Seeking clear, trustworthy information about modeling opportunities, payment, scheduling flexibility, and safety protocols. They respond positively to personalized, empathetic communication that addresses their potential anxieties and makes them feel valued. They require a simple, mobile-friendly way to provide their information (web form) and communicate (WhatsApp). They expect reasonably prompt responses.

## Key Features / Scope (MVP)

1.  **WhatsApp Integration (Core Engine):**
    *   Ability to connect to the WhatsApp Business API (or chosen intermediary like Twilio).
    *   Reliably send and receive messages between the platform and aspirant WhatsApp numbers.
    *   Handle incoming messages and route them to the appropriate recruiter/view.

2.  **Recruiter Web Interface (Chat Client):**
    *   Secure login for recruiters.
    *   A multi-pane view displaying: List of active conversations, selected conversation's chat history, input area for composing/sending replies, and a dedicated panel for aspirant data from the web form.
    *   Real-time updates for new incoming messages.
    *   Ability to view message history for each conversation.

3.  **AI Bot (Initial Contact & Basic FAQ):**
    *   Automatically detect the first message from a new aspirant number.
    *   Send a pre-defined, persona-aligned welcome message.
    *   Send a unique link to the web application form.
    *   Respond automatically to 1-2 pre-defined, high-frequency initial questions (e.g., regarding payment structure) with pre-written answers/links.

4.  **Web Application Form Integration:**
    *   Mechanism to generate a unique link to an external web form (assume form exists or is built separately for MVP).
    *   API endpoint or method to receive submitted form data (e.g., Name, Phone, Location, `has_kids`, Preferred Modeling Type).
    *   Store submitted data associated with the correct aspirant/conversation.
    *   Display submitted data clearly within the recruiter's chat interface panel.

5.  **Basic Conversation Management:**
    *   Indication of unread messages.
    *   Ability to mark conversations as needing attention or perhaps archive/close (basic status).

**Out of Scope for MVP (Examples):** Advanced AI replies, payment integration, analytics dashboard, internal recruiter chat, bulk messaging, specific conversation assignment, advanced filtering/searching.

## Success Metrics (MVP)

1.  **System Uptime & Reliability:** >99% operational uptime.
2.  **Recruiter Adoption Rate:** % of target recruiters actively using daily/weekly within first month.
3.  **Reduction in Initial Response Time:** Measure bot response time vs. manual baseline.
4.  **Form Submission Rate:** % of aspirants receiving link who submit the form.
5.  **Recruiter Efficiency Feedback:** Qualitative feedback via surveys/interviews.
6.  **Conversion Rate Benchmark:** Establish baseline conversion rate (Contact -> Form -> Next Step).
7.  **Qualitative Feedback on Addressing Doubts:** Assess recruiter perception of platform's helpfulness in addressing concerns.

## Technical Considerations / Platform (Initial Thoughts)

*   **Platform:** Web Application.
*   **Core Architectural Driver: High Scalability:** The chosen technologies and architecture *must* support significant, cost-effective scaling to handle potentially large numbers of concurrent recruiters and high message throughput. This is a non-negotiable requirement for the MVP.
*   **Deployment:** Cloud-native design (AWS, GCP, Azure) is mandated to facilitate scalability, reliability, and maintainability.
*   **Interfaces:** WhatsApp Business API (e.g., Twilio), External Web Form API/Webhook.
*   **Frontend:** Modern JavaScript framework (React, Vue, Angular).
*   **Backend:** Technology choice must prioritize demonstrable scalability and real-time capabilities (e.g., Python/Node.js frameworks suitable for WebSockets and scalable deployments).
*   **Database:** Choice must support scalability and potentially high write/read loads (e.g., PostgreSQL, MySQL with appropriate scaling strategies, or managed NoSQL options).
*   **Critical Requirements:** Real-time message display in the recruiter UI; **Demonstrable Architectural Scalability** from launch.

## Key Assumptions & Success Factors

1.  **WhatsApp API Stability:** Assumes reliable performance of the chosen provider.
2.  **External Web Form:** Assumes a functional external form and API exist.
3.  **Recruiter Training & Adoption:** Relies on user training and buy-in.
4.  **Persona Implementation:** Success depends on recruiters using the platform tools *and* the defined persona effectively.
5.  **FAQ Accuracy:** Assumes bot's pre-defined answers are accurate and helpful.
6.  **Tools -> Conversion Link:** Assumes platform improvements will lead to better conversion.
7.  **Network Stability:** Requires stable internet for users.
8.  **Scalable MVP Architecture Achieved:** The successful implementation of an inherently scalable architecture *within the MVP phase* is critical for long-term viability and achieving efficiency goals under expected load.

## Future Considerations / Potential Enhancements

*   **Advanced AI:** Conversational AI, sentiment analysis, suggested replies.
*   **Integrations:** Payment systems, CRM, Calendars.
*   **Workflow Tools:** Conversation assignment, advanced status tracking, internal notes, tagging.
*   **Analytics:** Detailed reporting dashboard.
*   **Multi-channel Support:** SMS, FB Messenger, etc.
*   **In-Platform Training Resources.** 