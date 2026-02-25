# Feature Specification: Live Event Scraper

**Feature Branch**: `001-live-event-scraper`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "j'aurais besoin d'implementer une cron job qui recupere les data des fights sur l'evenement de ufc en live lorsque l'evenement est commence. Il faudra aller scraper l'evenement et voir si les combats de la carte on change pour recuperer le winner du combat, la methode et le round afin d'actualiser le fight dans notre database pour injecter le resultat. Si tout les fights sont termine dans le combat. On peut passer l'evenement a completed et arreter la cron job sur les fights de l'evenement."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Live Event Result Injection (Priority: P1)

As the system, I want to automatically monitor live UFC events and update fight results in real-time, so that users can see their picks validated as the event progresses without manual intervention.

**Why this priority**: Real-time updates during an event are the core value proposition for a live betting/prediction application. P1 because it removes the need for manual admin grading.

**Independent Test**: Can be fully tested by simulating a live event scraping run against a mock HTML page reflecting an in-progress UFC event, verifying that the database fights are correctly updated with winners and methods.

**Acceptance Scenarios**:

1. **Given** an event is currently marked as "LIVE" and has scheduled fights, **When** the cron job runs and scrapes a newly finished fight, **Then** the system updates that fight's status in the database with the correct `winnerId`, `method`, and `round`.
2. **Given** a live event where all fights have received a final result, **When** the cron job runs, **Then** it updates the final fight, marks the overall event status as "COMPLETED", and ceases further scraping for this event.

---

### Edge Cases

- How does system handle fights being canceled last minute during the event?

## Clarifications

### Session 2026-02-24

- Q: Comment un événement passe-t-il au statut "LIVE" ? → A: En vérifiant si la date/heure actuelle a dépassé `prelimsStartAt` ou `maincardStartsAt` (les heures de début existantes sur l'Event).
- Q: Comment gérer les Draw et No Contest ? → A: Laisser `winnerId` vide (null) et définir `method` à "DRAW" ou "NC".
- Q: Si le scraper se fait bloquer (ex: erreur 403, timeout) pendant le live, que fait-on ? → A: Le scraper logue l'erreur en silence et s'arrête. Il réessaiera naturellement au prochain cycle (dans 5 minutes).

## Requirements *(mandatory)*

### Functional Requirements

### Functional Requirements

- **FR-001**: System MUST run a scheduled background task (cron job) at regular intervals during a live event.
- **FR-002**: System MUST identify events to target for scraping by checking if the current time has passed the event's `prelimsStartAt` or `maincardStartsAt` and the event is not yet `COMPLETED`. Status should transition to "LIVE" automatically.
- **FR-003**: System MUST scrape the event page to extract fight results including the winner, victory method (KO/TKO, SUB, DECISION, DRAW, NC), and ending round.
- **FR-004**: System MUST update the corresponding fight records in the database with the extracted results. In the case of a Draw or No Contest, `winnerId` MUST be null and `method` MUST indicate the special outcome.
- **FR-005**: System MUST detect when all fights within an event have a finished status.
- **FR-006**: System MUST automatically transition the event status to "COMPLETED" once all its fights are finished, preventing further unnecessary cron executions for that event.
- **FR-007**: System MUST handle the frequency of the cron job by running it every 5 minutes during a live event.
- **FR-008**: System MUST gracefully handle scraping errors (e.g., HTTP 403, 500, or timeouts) by logging a warning and safely aborting the current execution. The system will rely on the next scheduled 5-minute cycle to retry.

### Key Entities 

- **Event**: The UFC event being monitored. Needs to track its status (`SCHEDULED`, `LIVE`, `COMPLETED`).
- **Fight**: Individual matches within the event. Needs to be updated with `status`, `winnerId`, `method`, and `round`.
- **Cron Job / Scheduler**: The backend process orchestrating the periodic scraping.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The system updates a fight's result in the database within 5 minutes of the official outcome being published on the target website.
- **SC-002**: The event is marked as COMPLETED automatically without any manual admin intervention 100% of the time.
- **SC-003**: The scraper successfully parses methods and rounds for at least 95% of finished fights without throwing parsing errors.
