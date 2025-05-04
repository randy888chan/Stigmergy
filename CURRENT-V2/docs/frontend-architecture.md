# Frontend Architecture: WasaPrecruit MVP

This document provides a high-level overview of the WasaPrecruit frontend application architecture, built with React and TypeScript.

## 1. Overview

The frontend is a Single Page Application (SPA) designed to provide a real-time, multi-pane chat interface for recruiters.

*   **Framework:** React (v18+)
*   **Language:** TypeScript
*   **Build Tool:** Vite
*   **Key Libraries:**
    *   UI Components: Material UI (MUI) or Chakra UI
    *   State Management: Zustand
    *   API Communication: Apollo Client (for GraphQL/AppSync)
    *   Routing: React Router

## 2. Core Components & Structure

(Refer to `docs/project-structure.md` for the detailed directory layout within `ui/`)

*   **`main.tsx` / `App.tsx`:** Entry point, sets up routing, providers (Apollo, Zustand, Theme).
*   **`pages/`:** Top-level views corresponding to routes (e.g., `LoginPage`, `ChatDashboardPage`).
*   **`layouts/`:** Structural components defining the overall page layout (e.g., `DashboardLayout` with sidebar and main content area).
*   **`features/`:** Self-contained modules representing major application features:
    *   **`chat/`:** Components related to the conversation list, message display, message input area.
    *   **`aspirant/`:** Components for displaying the aspirant's profile data (from form/system).
    *   **`auth/`:** Login forms, authentication logic integration (with Cognito).
*   **`components/`:** Generic, reusable UI elements (Buttons, Inputs, Modals, etc.) used across features.
*   **`hooks/`:** Custom React hooks for shared logic (e.g., `useAuth`, `useRealtimeUpdates`).
*   **`services/`:** API interaction layer. Contains GraphQL query/mutation/subscription definitions and functions for interacting with the AppSync backend via Apollo Client.
*   **`store/`:** Zustand stores for managing global or feature-specific state.
*   **`types/`:** Frontend-specific TypeScript types, potentially importing/extending from `packages/common-types`.
*   **`styles/`:** Global CSS, theme configuration (e.g., MUI theme overrides).

## 3. State Management (Zustand)

*   Use Zustand for managing global state (e.g., authenticated user, connection status) and potentially complex feature state.
*   Create separate stores for different domains (e.g., `useAuthStore`, `useConversationStore`).
*   Leverage middleware as needed (e.g., persistence, logging).
*   Simpler component state can be managed with `useState` or `useReducer`.

## 4. API Communication (Apollo Client / AppSync)

*   Configure Apollo Client to connect to the AWS AppSync endpoint.
*   Use Apollo hooks (`useQuery`, `useMutation`, `useSubscription`) within components or the `services/` layer to interact with the GraphQL API.
*   Handle loading and error states gracefully.
*   Leverage Apollo cache for optimistic UI updates and minimizing redundant requests where appropriate.

## 5. Real-time Updates

*   Use Apollo Client's `useSubscription` hook to subscribe to relevant AppSync subscriptions (`onNewMessage`, `onAspirantUpdate`, `onNewConversation`).
*   Update the local state (Zustand store or component state) when new data arrives via subscriptions.
*   Ensure efficient updates, especially for the message list (potentially using virtualization libraries like `react-window` or `react-virtualized` if lists become very long).

## 6. Performance Considerations

*   **Code Splitting:** Leverage Vite's automatic code splitting to load code only when needed.
*   **Lazy Loading:** Use `React.lazy` and `Suspense` for lazily loading components/pages.
*   **Memoization:** Use `React.memo`, `useMemo`, `useCallback` to prevent unnecessary re-renders.
*   **List Virtualization:** Implement for potentially long lists (conversations, messages) to ensure UI responsiveness.
*   **Bundle Size Analysis:** Regularly analyze bundle size to identify optimization opportunities.

## 7. Authentication

*   Integrate with AWS Cognito using AWS Amplify UI components or a custom implementation using Amplify Auth library.
*   Secure routes requiring authentication.
*   Manage user sessions and tokens.

## 8. Future Considerations

*   **UI Testing:** Implement component tests using React Testing Library.
*   **Accessibility:** Ensure components meet WCAG standards.
*   **Internationalization (i18n):** Structure for potential future language support. 