# Feature Specification: Real-time Standings Updates

**Feature Branch**: `4-realtime-standing-updates`  
**Created**: 2026-02-19  
**Status**: Draft  
**Input**: User description: "Fix websocket updates for fight results affecting standings"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Live Standings Updates (Priority: P1)

As a league member watching the event, I want the standings table to update immediately when a fight result is entered by the admin, so that I can see my new rank without refreshing the page.

**Why this priority**: Core value proposition of a "live" event dashboard. Reduces server load from manual refreshes and improves user engagement.

**Independent Test**:
1. Open two browser windows: one as Admin, one as User (viewing Dashboard).
2. Admin updates a fight result.
3. User window automatically updates the Standings table and the Fight Card result within 2 seconds.

**Acceptance Scenarios**:

1. **Given** a user is viewing the League Dashboard, **When** an admin submits a fight result (e.g., Winner: Fighter A), **Then** the "My Picks" dot matrix and the Standings table should update to reflect the new points.
2. **Given** a user is viewing the Dashboard, **When** an admin corrects a result (e.g., changes Winner from A to B), **Then** the standings should update to reflect the simplified points (remove points for A, add for B).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST emit a real-time event (e.g., `fight_updated` or `standings_updated`) when a fight result is modified via the Admin API.
- **FR-002**: The `LeagueDashboard` component MUST listen for fight update events.
- **FR-003**: Upon receiving an update event, the Dashboard MUST trigger a re-fetch or optimistically update:
    - The detailed Standings list.
    - The "My Picks" summary.
    - The specific Fight Card that was modified.
- **FR-004**: The update MUST happen without requiring a full page reload.

### Key Entities

- **Fight**: The entity being modified (status, winner, method, etc.).
- **LeagueStanding**: The derived data that needs to be recalculated and pushed/fetched.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Standings update on client devices within 2 seconds of admin submission.
- **SC-002**: Data consistency is maintained (no "stale" standings displayed after an update event).
