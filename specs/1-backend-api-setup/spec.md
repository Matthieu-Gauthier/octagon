# Feature Specification: Backend Implementation

**Feature Branch**: `1-backend-api-setup`
**Created**: 2026-02-18
**Status**: Draft
**Input**: User description: "le frontend est deja monter correctement avec des datas mock. Nous allons utiliser speckit pour generer l'ensemble des taches backend afin de monter notre backend et remplacer nos data mock"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Core Backend & Auth (Priority: P1)

As a user, I want to authenticate with the backend so that I can access protected resources.

**Why this priority**: Validates the core infrastructure and connection between frontend and backend.

**Independent Test**:
- Call `/health` -> returns 200 OK.
- Call `/auth/login` (Supabase) -> returns JWT.
- Call protected endpoint with JWT -> returns 200 OK.

**Acceptance Scenarios**:
1. **Given** a running backend, **When** I request `GET /health`, **Then** I receive a status 200 "OK".
2. **Given** a valid Supabase token, **When** I request a protected route, **Then** the request is allowed.
3. **Given** no token, **When** I request a protected route, **Then** I receive 401 Unauthorized.

---

### User Story 2 - Events & Fighters Data (Priority: P1)

As a user, I want to view relevant fight cards so that I can see what I can bet on and review my past performance.

**Why this priority**: Essential for the main application view. Replaces `MOCK_EVENTS` and `MOCK_FIGHTERS`.

**Independent Test**:
- Seed DB with mock data (past event with bets, future event, past event without bets).
- Call `GET /events` (authenticated) -> returns future event + past event (with bets).
- Verify past event (without bets) is NOT returned.

**Acceptance Scenarios**:
1. **Given** the backend is seeded, **When** I request `GET /events`, **Then** I see the "Current/Next" event.
2. **Given** I have placed bets on a past event, **When** I request `GET /events`, **Then** I also see that past event.
3. **Given** there is a past event where I placed NO bets, **When** I request `GET /events`, **Then** that event is HIDDEN from the list.
4. **Given** an event ID, **When** I request `GET /events/:id`, **Then** I receive the full event details including fights, fighters, and my existing bets (if any).

---

### User Story 3 - Leagues System (Priority: P2)

As a user, I want to create and join leagues so that I can compete with friends.

**Why this priority**: Core social feature, replaces `MOCK_LEAGUES`.

**Independent Test**:
- Call `POST /leagues` -> creates league.
- Call `POST /leagues/join` -> adds member.

**Acceptance Scenarios**:
1. **Given** I am authenticated, **When** I create a league, **Then** a new league is stored and I am the admin.
2. **Given** a league code, **When** I join a league, **Then** I am added to the member list.
3. **Given** I am a member, **When** I request `GET /leagues`, **Then** I see my leagues.

---

### User Story 4 - Betting Engine (Priority: P2)

As a user, I want to place bets on fights so that I can participate in the league.

**Why this priority**: Core gameplay mechanic, replaces `MOCK_USER_BETS`.

**Independent Test**:
- Call `POST /bets` -> bet stored.
- Call `GET /bets` -> returns my bets.

**Acceptance Scenarios**:
1. **Given** an upcoming fight, **When** I place a bet, **Then** the bet is saved.
2. **Given** a past fight, **When** I try to place a bet, **Then** the request is rejected.
3. **Given** I am in a league, **When** I view the fight card, **Then** I see my existing bets.

---

### User Story 5 - Live Standings (Priority: P2)

As a user, I want to see the league standings update live as fights finish so that I can track my progress against friends during the event.

**Why this priority**: Enhances the live event experience.

**Independent Test**:
- Place bets for users in a league.
- Submit a fight result via Backend API.
- Call `GET /leagues/:id/standings?eventId=:id` -> returns updated scores.

**Acceptance Scenarios**:
1. **Given** a fight just finished and results are entered, **When** I view the standings, **Then** the scores reflect the new results calculation.
2. **Given** different league rules, **When** I view standings, **Then** scores are calculated according to *that* league's settings.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST be built with NestJS (Backend) and PostgreSQL (Database).
- **FR-002**: System MUST use Prisma ORM for database interactions.
- **FR-003**: System MUST authenticate users using Supabase JWT validation (Passport Strategy).
- **FR-004**: System MUST expose a `GET /health` endpoint for connectivity checks.
- **FR-005**: System MUST provide API endpoints to serve Events (filtered by status and user bets), Fighters, Leagues, and Bets data matching the frontend interfaces.
- **FR-006**: System MUST include a seeding script to populate the database with the existing frontend mock data (`MOCK_EVENTS`, `MOCK_USERS`, `MOCK_LEAGUES`).
- **FR-007**: System MUST automatically reject bets if `server_time >= fight.date`.
- **FR-008**: System MUST support Survivor mode toggling per league.
- **FR-009**: System MUST allow League Admins to archive a league (soft delete/hide status).
- **FR-010**: System MUST support mapping Fighters to local image assets (downloaded/stored locally).
- **FR-011**: System MUST provide a `GET /leagues/:id/standings` endpoint, optionally filtered by `eventId`.
- **FR-012**: System MUST recalculate league standings whenever a fight result is recorded.
- **FR-013**: System MUST provide a protected Admin endpoint to submit fight results (`POST /events/:id/fights/:fightId/result`).

### Key Entities

- **User**: ID (UUID/Supabase ID), username, email. **Source of Truth**: Supabase Auth.
- **Event**: ID, name, date, location, status.
- **Fighter**: ID, name, record, specific stats, **imagePath/slug** (for local asset mapping).
- **Fight**: ID, eventId, fighterA, fighterB, division, rounds, result (winner, method, round, time).
- **League**: ID, name, code, adminId, settings (survivorEnabled, scoring), **isArchived** (boolean).
- **LeagueMember**: leagueId, userId, role.
- **Bet**: ID, leagueId, userId, fightId, winnerId, method, round.
- **SurvivorPick**: ID, leagueId, userId, eventId, fightId, status.

## Clarifications

### Session 2026-02-18
- Q: League filtering/archiving? -> A: Return single list of all leagues; ADD feature to archive leagues.
- Q: User Profile Updates? -> A: MVP Read-Only. User details (username/avatar) synced/read from Supabase Auth token or metadata. No dedicated API to update `User` table directly.
- Q: Fighter Images? -> A: Local Assets. Images will be downloaded and stored locally. `Fighter` entity should store a reference (e.g. `slug` or `imagePath`) to the local file.
- Q: Event List Filtering? -> A: Start smart filtering immediately. Show Current/Next Event AND Past Events ONLY IF user has placed bets on them. Hide unrelated past events.
- Q: Live Standings? -> A: Backend MUST calculate standings on-the-fly (or via trigger) when fight results are entered, based on League rules. Provide `GET` endpoint.
- Q: Result Source? -> A: Manual Admin API. Expose `POST /events/:id/fights/:fightId/result` for manual entry. Automation deferred.
- Q: Bet Locking? -> A: Scheduled Time (Auto). Bets strictly locked when `server_time >= fight.date`. No manual status change required.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of frontend mock data types are supported by the Backend API.
- **SC-002**: Frontend can successfully display the "My Leagues" dashboard using data fetched solely from the API.
- **SC-003**: Frontend can successfully submit a bet that persists to the database.
- **SC-004**: `GET /health` returns 200 OK response within 200ms.
