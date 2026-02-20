# Research Findings: Frontend-Backend Integration

## Decisions

### 1. Data Fetching & Caching
- **Decision**: Use `@tanstack/react-query`.
- **Rationale**: It is the industry standard for managing server state in React. It handles caching, deduplication, loading states, and re-fetching out of the box, which is critical for a data-heavy app like Octagon.
- **Action**: Install `@tanstack/react-query`.

### 2. Realtime Updates
- **Decision**: Use a custom `useRealtime` hook wrapping Supabase standard subscription.
- **Rationale**: Supabase's JS client provides a simple subscription API. We don't need a heavy abstraction, just a hook that accepts a table/channel and a callback to update `react-query` cache (`queryClient.invalidateQueries`).
- **Alternatives**: Polling (rejected per user request for WebSockets).

### 3. API Client
- **Decision**: Use `axios` with interceptors.
- **Rationale**: Interceptors are cleaner for injecting the JWT token from Supabase session and handling 401 auto-refreshes centrally.

## Backend Verification
- Checked `events.controller.ts`: Endpoints return flattened DTOs. Frontend interfaces must match.
