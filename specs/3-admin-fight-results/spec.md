# Feature Specification: Admin Fight Results

**Feature Branch**: `3-admin-fight-results`
**Created**: 2026-02-19
**Status**: Draft
**Input**: User description: "implement admin tool to select results of fights of an event. This will allow me to test that the standings and rest of fightCard work"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Enter Fight Results (Priority: P1)

As an Admin, I want to be able to enter the results (Winner, Method, Round) for each fight in an event, so that the system can calculate league standings and settle bets.

**Why this priority**: ensuring bets are settled and standings are updated is the core value loop of the application. Without results, the betting functionality is incomplete.

**Independent Test**: Can be tested by an Admin user logging in, navigating to an event, and updating fight results. Success is verified by checking the fight status change and the standings updating.

**Acceptance Scenarios**:

1. **Given** an event with pending fights, **When** the Admin selects a winner, method, and round for a fight and saves, **Then** the fight status updates to 'FINISHED', the result is persisted, and the league standings are recalculated.
2. **Given** a finished fight, **When** the Admin detects an error and corrects the result, **Then** the bet outcomes and standings are updated to reflect the correction.
3. **Given** a fight ending in a Draw or No Contest, **When** the Admin selects this outcome, **Then** the system handles it appropriately (e.g., no points awarded or specific rules applied).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an interface for Admins to view all fights within a specific event.
- **FR-002**: System MUST allow Admins to update the following properties of a fight:
    - Winner (Fighter A or Fighter B or Draw/NC)
    - Method (KO/TKO, Submission, Decision, DQ, etc.)
    - Round (1, 2, 3, 4, 5) - Optional if method is Decision.
    - Status (SCHEDULED -> FINISHED)
- **FR-003**: System MUST validate that a Winner and Method are selected before marking a fight as FINISHED.
- **FR-004**: System MUST trigger a recalculation of all associated league standings whenever a fight result is updated.
- **FR-005**: System MUST allow any **authenticated user** to access this functionality (for MVP/Testing purposes).

### Key Entities *(include if feature involves data)*

- **Fight**: Being updated with `winnerId`, `method`, `round`, and `status`.
- **League**: `standings` are derived from the aggregate of `Fight` results and `Bet` outcomes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin can enter results for a 5-fight card in under 2 minutes.
- **SC-002**: Standings are updated and visible to users within 5 seconds of result submission.
- **SC-003**: 100% of validated bets are correctly marked as won/lost based on the entered results.
