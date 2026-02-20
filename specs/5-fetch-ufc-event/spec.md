# Feature Specification: Fetch UFC Event

**Feature Branch**: `5-fetch-ufc-event`  
**Created**: 2026-02-20  
**Status**: Draft  
**Input**: User description: "Nous allons maintenant creer une feature qui va s'occuper d'aller chercher le prochain evenement UFC. Il faudrait voir si il existe une api gratuite ou si nous allons scrapper le site de UFC. Nous avons besoin de recuperer Event, Fight et Fighter de l'evenement. Seul les combats de la main card et des prelims seront recuperer. Pour des raisons de tests nous mettrons un bouton remove dans la vue admin qui va s'occuper de supprimer un evenement. Les bets et fights de cet evenement seront eux aussi supprimer."

## Clarifications

### Session 2026-02-20
- Q: How should we handle existing fighters when fetching an event? → A: Verify existence using a logical ID. If they exist, update their score card and fetch their image if it's missing.
- Q: How should fighter images be handled? → A: Download the image from the UFC site, save it to a folder, and store the path in the database.
- Q: Fighter Logical ID Strategy? → A: Use the UFC website's specific URL slug for the fighter (e.g., `jon-jones-1`).
- Q: How should image download failures be handled? → A: Continue the import and leave the image path empty (fallback to a default silhouette on the UI later).
- Q: What data source should we prioritize for events and images? → A: Prioritize researching and utilizing a clean, free API for all data (including images). Scraping the UFC website should only be the fallback if no suitable API exists.
- Q: Which additional Fighter data fields to store? → A: Add basic physical attributes, significant strikes, takedowns, and separate the `record` field into distinct integer fields (`wins`, `losses`, `draws`, `noContests`, `winsByKo`, `winsBySub`, `winsByDec`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fetch Next UFC Event Data (Priority: P1)

As an administrator, I need a mechanism to automatically retrieve the details of the next upcoming UFC event, so that users can view the event and place bets without me having to manually enter all the data.

**Why this priority**: Core functionality needed to populate the application with real-world upcoming event data, which is essential for the betting mechanism.

**Independent Test**: Can be tested by triggering the fetch process and verifying that the correct event, fighters, and fights (for Main Card and Prelims) appear in the database/admin view.

**Acceptance Scenarios**:

1. **Given** there is an upcoming UFC event, **When** the admin triggers the fetch action, **Then** the event details, fighters, and fights for the main card and prelims are saved to the system.
2. **Given** the fetch action processes an event with early prelims, **When** the data is saved, **Then** the early prelim fights are correctly excluded from the system.

---

### User Story 2 - Remove UFC Event and Cascading Data (Priority: P2)

As an administrator, I want to be able to delete an event from the admin dashboard, so that I can clean up test data or remove an incorrectly fetched event along with all its related records.

**Why this priority**: Important for testability and data management, ensuring that incorrect or test events don't clutter the system or affect user standing.

**Independent Test**: Can be fully tested by creating a dummy event with associated fights and bets, clicking the remove button, and verifying the database no longer contains those records.

**Acceptance Scenarios**:

1. **Given** an existing event with associated fights and user bets, **When** the admin clicks the "remove" button for that event, **Then** the event, its fights, and its connected bets are entirely removed from the system.

### Edge Cases

- **Image Download Failures**: If the system fails to download a fighter's image (e.g., due to a 404 or timeout), the import for the fighter and the overall event MUST continue. The image path for that fighter will be left empty, and the UI will use a fallback silhouette.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST fetch the next UFC event details (prioritizing a clean, free structured API, otherwise falling back to scraping the official UFC website).
- **FR-002**: System MUST extract and store `Event`, `Fight`, and `Fighter` data from the source.
- **FR-003**: System MUST filter fetched fights to include ONLY those on the "Main Card" and "Prelims" (excluding "Early Prelims").
- **FR-004**: System MUST check if a fighter already exists in the database using a logical ID before creating a new record.
- **FR-005**: If a fighter exists, the system MUST update their record (e.g., score card) and fetch/save their image if the image path is missing.
- **FR-006**: System MUST obtain fighter images (ideally via the same free API, or by scraping the UFC site as a fallback), store them in a directory, and save the file path in the database.
- **FR-007**: System MUST provide an administrative interface with a "Remove" action for events.
- **FR-008**: System MUST cascade the deletion of an event to ensure all associated `Fight` and `Bet` records are permanently removed.

### Key Entities

- **Event**: Represents a UFC event (includes details like name, date, location).
- **Fight**: Represents a matchup between two fighters within an event (includes attributes indicating whether it is a Main Card or Prelim fight).
- **Fighter**: Represents an individual athlete participating in a fight (includes a logical ID based on the UFC URL slug for uniqueness, detailed win/loss integer records, a local image path, basic physical attributes like height/weight/reach/stance, and key combat statistics).
- **Bet**: Represents a user's wager placed on a specific fight within the event.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: System successfully imports 100% of the fighters and fights from the main card and prelims of the next UFC event without manual data entry.
- **SC-002**: Fetch operation completes and populates the database in under 1 minute.
- **SC-003**: Event deletion process fully executes in under 5 seconds, leaving zero orphaned `Fight` or `Bet` records in the database.
