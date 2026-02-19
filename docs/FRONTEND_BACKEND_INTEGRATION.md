# Frontend Implementation Plan: Backend Integration

## Phase 1: API Foundation (Planned)
- [ ] **API Client**: Create `api.ts` with Axios/Fetch and base URL handling.
- [ ] **Token Injection**: Middleware to inject Supabase JWT into `Authorization` header.
- [ ] **Health Check UI**: Visual indicator for backend connection status.

## Phase 2: Master Data Migration (Planned)
- [ ] **Event Hooks**: `useEvents` and `useEvent` replacing `MOCK_EVENTS`.
- [ ] **Fighter Hooks**: `useFighters` replacing `MOCK_FIGHTERS`.
- [ ] **Skeleton Loading**: UI feedback while fetching data.

## Phase 3: League & User Features (Planned)
- [ ] **League Hooks**: `useLeagues`, `useCreateLeague` replacing `MOCK_LEAGUES`.
- [ ] **Join Interface**: UI components for entering league invite codes.
- [ ] **Member Lists**: Fetching real member data for dashboards.

## Phase 4: Gameplay Integration (Planned)
- [ ] **Betting Submission**: POST bets to backend with error handling.
- [ ] **Survivor Fetching**: GET survivor status and POST picks.
- [ ] **Live Leaderboard**: Fetching computed standings from backend APIs.
