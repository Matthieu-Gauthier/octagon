# Feature Specification: Frontend-Backend Integration

**Feature Branch**: `2-frontend-api-integration`
**Created**: 2026-02-19
**Status**: Draft
**Input**: User description: "creeons l'implementation de backend dans le frontend. tu peu te referer au document docs/FRONTEND_BACKEND_INTEGRATION.md"

## Clarifications

### Session 2026-02-19
- Q: How to handle 401/Auth errors? -> A: **Auto-refresh then Login**. Try to refresh token silently; if fail, redirect to login.
- Q: Live Updates strategy? -> A: **WebSockets (Realtime)**. Use Supabase Realtime for instant updates on fights/standings.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - API Foundation & Authentication (Priority: P1)

As a developer/user, I want the frontend to communicate securely with the backend so that I can access real data instead of mocks.

**Why this priority**: this is the prerequisite for all other data features.

**Independent Test**:
- Call `api.get('/health')` from frontend console -> returns 200.
- Logged in user makes request -> `Authorization: Bearer <token>` is present in headers.

**Acceptance Scenarios**:
1. **Given** I am logged into the frontend, **When** the app makes an API call, **Then** the request includes my Supabase JWT.
2. **Given** the backend is offline, **When** I load the app, **Then** a visual health indicator (or toast) warns me of connection failure.

---

### User Story 2 - Real Data: Events & Fighters (Priority: P1)

As a user, I want to see the actual fight cards and fighter details from the database so that my view is consistent with the server state.

**Why this priority**: Core value proposition; replaces the primary mock data.

**Independent Test**:
- Load Dashboard -> see events fetched from API (inspect network tab).
- Click specific event -> fetch event details from API.
- Replaces `MOCK_EVENTS` and `MOCK_FIGHTERS` usage.

**Acceptance Scenarios**:
1. **Given** the "Events" page, **When** it loads, **Then** it displays events fetched from `GET /events`.
2. **Given** data is loading, **When** I wait, **Then** I see skeleton loaders instead of a blank screen.

---

### User Story 3 - League Operations (Priority: P2)

As a user, I want to create and join leagues using the backend so that my membership is persisted.

**Why this priority**: Enables social features and persistence.

**Independent Test**:
- Create League form submit -> `POST /leagues` -> success.
- Join League form submit -> `POST /leagues/join` -> success.

**Acceptance Scenarios**:
1. **Given** I am on the "Create League" page, **When** I submit the form, **Then** a new league is created on the server and I am redirected to it.
2. **Given** a valid invite code, **When** I submitting the "Join" form, **Then** I become a member of that league.

---

### User Story 4 - Gameplay Integration (Priority: P2)

As a user, I want my bets and picks to be saved to the server so that they count towards the leaderboard.

**Why this priority**: Completes the core loop.

**Independent Test**:
- Place bet -> `POST /bets` -> 201 Created.
- View Leaderboard -> `GET /leagues/:id/standings` -> returns calculated scores.

**Acceptance Scenarios**:
1. **Given** I place a bet on a fight, **When** I confirm, **Then** the bet is sent to the backend.
2. **Given** a league timeframe, **When** I view the leaderboard, **Then** I see rankings based on real backend calculations.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Frontend MUST use a centralized API client (Axios or Fetch wrapper) for all backend requests.
- **FR-002**: API client MUST automatically inject the Supabase Session Access Token into the `Authorization` header.
- **FR-003**: Frontend MUST handle 401/403 errors by attempting to silently refresh the session token. If refresh fails, the system MUST redirect the user to the login page (Option A).
- **FR-004**: Frontend MUST display Skeleton/Loading states while waiting for async data.
- **FR-005**: All references to `MOCK_EVENTS`, `MOCK_FIGHTERS`, `MOCK_LEAGUES`, and `MOCK_BETS` MUST be replaced with API hooks.
- **FR-006**: Frontend MUST provide visual feedback (Toast/Alert) on API errors (e.g., "Network Error", "Validation Failed").
- **FR-007**: Betting UI MUST lock/disable if the backend returns a "Betting Closed" error (or based on event time).
- **FR-008**: System MUST use Supabase Realtime to subscribe to `fight` and `league_member` table changes for live score/status updates.

### Key Entities *(implementation)*

- **API Client**: `api.ts` (configured instance).
- **Hooks**: `useEvents`, `useLeagues`, `useBets` (custom hooks wrapping API calls).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Network tab shows 0 requests to `localhost` failing due to CORS (configured correctly).
- **SC-002**: 100% of "Read" operations (View Events, View Leagues) fetch data from Backend API.
- **SC-003**: "Create League" and "Place Bet" actions persist to the database (verified via refresh).
- **SC-004**: `MOCK_` data files are removed or completely unused in the codebase.
