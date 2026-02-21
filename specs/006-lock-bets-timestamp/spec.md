# Feature Specification: Lock Bets by Card-Section Start Timestamp

**Feature Branch**: `006-lock-bets-timestamp`  
**Created**: 2026-02-21  
**Status**: Draft  
**Input**: User description: "il faudrait trouver un moyen de lock les paris lorsque la carte preliminaire commence, et aussi lorsque la main card commence. Il y a un div lors du scrapping qui contient les infos qui pourrait nous permettre de lock ca correctement. Cette div se trouve a deux places. dans la div qui a id main-card et dans la div qui a id prelims-card. Voici un exemple de la div: `<div class='c-event-fight-card-broadcaster__time tz-change-inner' data-locale='en-can' data-timestamp='1771711200' data-format='D, M j / g:i A T'>Sat, Feb 21 / 5:00 PM EST</div>`. Il faudrait donc modifier le schema du fight pour recuperer le data-timestamp."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 – Prelim bets lock at prelim start time (Priority: P1)

A league member has placed bets on preliminary card fights. When the preliminary card's scheduled start time is reached, the system must refuse any new or modified bets on prelim fights, even if the main card has not started yet.

**Why this priority**: The prelim card starts before the main card (typically 1–2 hours earlier). Without a separate prelim lock, a user could change their prelim picks after watching early results, which is unfair to other participants.

**Independent Test**: Create a fight marked `isPrelim = true` with a `prelimsStartAt` timestamp in the past, and attempt to place a bet → the system must reject it. Fights in the same event marked `isMainCard = true` should still be bettable if `mainCardStartAt` is in the future.

**Acceptance Scenarios**:

1. **Given** a prelim fight and `now < prelimsStartAt`, **When** a user places a bet on that fight, **Then** the bet is accepted.
2. **Given** a prelim fight and `now >= prelimsStartAt`, **When** a user places a bet on that fight, **Then** the system returns an error "Betting is closed for preliminary card fights".
3. **Given** a main card fight and `now >= prelimsStartAt` but `now < mainCardStartAt`, **When** a user places a bet on that main card fight, **Then** the bet is accepted.

---

### User Story 2 – Main card bets lock at main card start time (Priority: P1)

A league member has placed bets on main card fights. When the main card's scheduled start time is reached, the system must refuse any new or modified bets on those fights.

**Why this priority**: The main card start is the definitive deadline for bets on main card fights. The current cutoff (event date) already approximates this, but the scraped timestamp from the UFC website makes it exact and per-section.

**Independent Test**: Create a fight marked `isMainCard = true` with a `mainCardStartAt` timestamp in the past, and attempt to place a bet → the system must reject it.

**Acceptance Scenarios**:

1. **Given** a main card fight and `now < mainCardStartAt`, **When** a user places a bet on that fight, **Then** the bet is accepted.
2. **Given** a main card fight and `now >= mainCardStartAt`, **When** a user places a bet on that main card fight, **Then** the system returns an error "Betting is closed for main card fights".
3. **Given** a main card fight with status `FINISHED`, **When** a user places a bet, **Then** the system returns an error regardless of timestamps.

---

### User Story 3 – Scraper captures card-section start timestamps (Priority: P2)

When the scraper runs against the UFC event page, it must extract the Unix timestamp from the `.c-event-fight-card-broadcaster__time` element found inside `#main-card` and `#prelims-card`, and store these as distinct fields on the event record.

**Why this priority**: Without scraping these values, the locking logic in Stories 1 and 2 cannot function. This is the data-acquisition step that enables the feature.

**Independent Test**: Run the scraper against a UFC event page (live or saved HTML fixture) and confirm the resulting event record contains valid `prelimsStartAt` and `mainCardStartAt` values different from each other.

**Acceptance Scenarios**:

1. **Given** a UFC event page with both `#main-card` and `#prelims-card` sections containing a `.c-event-fight-card-broadcaster__time` element with a `data-timestamp` attribute, **When** the scraper runs, **Then** the event record contains `prelimsStartAt = Date(data-timestamp * 1000)` and `mainCardStartAt = Date(data-timestamp * 1000)`.
2. **Given** a UFC event page where only one section has the timestamp element, **When** the scraper runs, **Then** only the present timestamp is stored; the missing one falls back to the event's general `date` field.
3. **Given** a UFC event page where neither section has the timestamp element, **When** the scraper runs, **Then** both fields remain null and betting behavior falls back to the existing `event.date` cutoff.

---

### User Story 4 – UI deadline indicator on each fight card (Priority: P2)

A league member viewing the event's fight cards sees a clear indicator on each fight showing when betting will be locked for that specific card section. If they have not yet placed their bet by that time, they will no longer be able to do so — no grace period, no override.

**Why this priority**: Without this indicator, users may miss the deadline without realizing it. The hint must be visible at the point of action (the fight card itself), so users can act before it's too late.

**Independent Test**: Open the event page before the prelim lock time. Confirm that prelim fight cards each display the prelim lock deadline. Wait until after the lock time passes (or simulate it) and confirm the bet action is disabled and the card shows a "locked" state.

**Acceptance Scenarios**:

1. **Given** a prelim fight and `now < prelimsStartAt`, **When** a user views the fight card, **Then** the card displays the prelim lock time (e.g., "🔒 Bets lock: Feb 21 at 5:00 PM EST").
2. **Given** a main card fight and `now < mainCardStartAt`, **When** a user views the fight card, **Then** the card displays the main card lock time.
3. **Given** any fight card where the card-section deadline has passed, **When** a user views it, **Then** the deadline indicator shows a locked state and the bet action is disabled — no error message is required, the UI itself communicates closure.
4. **Given** a fight card where the deadline timestamp is unavailable (null), **When** a user views it, **Then** no deadline indicator is shown (bet remains open until the system rejects it server-side).

---

### Edge Cases

- What happens when `prelimsStartAt` is after `mainCardStartAt` due to bad data? The system should apply the **earlier** of the two timestamps as the lock for prelim fights and the **later** for main card, or log a warning and fall back to `event.date`.
- What happens when the event has no prelim card (main-card-only events)? `prelimsStartAt` may be null; betting on all fights locks at `mainCardStartAt`.
- What if the UFC page updates the timestamp after the scraper has already run (rare reschedule scenario)? The scraper's next scheduled run will overwrite the stored timestamps.
- What if a user's local clock is incorrect? The server-side lock is authoritative; the UI indicator is informational only.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The scraper MUST extract the `data-timestamp` value from the `.c-event-fight-card-broadcaster__time` element within `#main-card` and store it as the main card start timestamp on the event record.
- **FR-002**: The scraper MUST extract the `data-timestamp` value from the `.c-event-fight-card-broadcaster__time` element within `#prelims-card` and store it as the prelim start timestamp on the event record.
- **FR-003**: When either timestamp is absent in the scraped HTML, the system MUST fall back gracefully to the existing `event.date` value without throwing an error.
- **FR-004**: The Event data model MUST be extended with two nullable timestamp fields: one for the prelim card start and one for the main card start.
- **FR-005**: The bet-placement logic MUST check `prelimsStartAt` for fights where `isPrelim = true`, and `mainCardStartAt` for fights where `isMainCard = true`, instead of always comparing against `event.date`.
- **FR-006**: If the relevant card-section timestamp is null, the system MUST fall back to `event.date` as the bet cutoff.
- **FR-007**: A bet on a fight whose associated card-section start time has passed MUST be rejected with a clear error message indicating which card section is locked.
- **FR-008**: Existing delivered bets (placed before the lock time) MUST remain valid and unaffected by the new locking logic.
- **FR-009**: Each individual fight card in the UI MUST display a deadline indicator showing the lock time for that fight's card section (prelims or main card), positioned near the bet action, as soon as the timestamp is available — the indicator is always visible, not proximity-gated to a time window.
- **FR-010**: Once the deadline for a card section has passed, the deadline indicator on each affected fight card MUST update to a "locked" visual state and the bet action MUST be disabled in the UI.

### Key Entities

- **Event**: Represents a UFC event. Extended with `prelimsStartAt` (nullable DateTime) and `mainCardStartAt` (nullable DateTime) alongside the existing `date` field.
- **Fight**: Existing entity with `isMainCard` and `isPrelim` boolean flags, used to determine which timestamp to check when a bet is placed.
- **Bet**: Existing entity; no schema change required. Bet placement validation logic is updated to use per-card-section timestamps.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of bets attempted on prelim fights after `prelimsStartAt` are rejected by the system.
- **SC-002**: 100% of bets attempted on main card fights after `mainCardStartAt` are rejected by the system.
- **SC-003**: Bets on main card fights remain open while `now < mainCardStartAt`, even when the prelim card has already started.
- **SC-004**: The scraper successfully captures both card-section timestamps on every UFC event page that contains the expected HTML structure (target: ≥ 95% of scraped events).
- **SC-005**: No previously placed valid bets are invalidated or lost when the new locking logic is deployed.
- **SC-006**: Every fight card in the UI shows the correct lock deadline when the timestamp is available, and the bet action is visually disabled after the deadline passes.

---

## Assumptions

- The UFC website consistently places at most one `.c-event-fight-card-broadcaster__time` element with `data-timestamp` per card-section div (`#main-card`, `#prelims-card`). If multiple elements appear, the first one is used.
- The `data-timestamp` value is a Unix epoch in seconds (consistent with the example in the feature description: `1771711200`).
- The existing `scrapeNextEvent` scheduler frequency is sufficient to capture the timestamps before the event day. No change to scheduling is required.
- Early prelim fights (if any) are excluded from this feature scope; they continue to fall back to `event.date` as before.
- The UI lock state is computed client-side using the fight card's deadline timestamp. The server remains the authoritative source for enforcement.

---

## Clarifications

### Session 2026-02-21

- Q: Where in the UI should the bet-lock deadline warning be displayed? → A: On each individual fight card, near the bet action (not a global banner).
- Q: When should the deadline indicator become visible on a fight card? → A: Always visible as soon as the timestamp is available (not gated to a proximity window).
