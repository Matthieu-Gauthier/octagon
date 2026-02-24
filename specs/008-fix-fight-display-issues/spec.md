# Feature Specification: Fix Fight Display Issues

**Feature Branch**: `008-fix-fight-display-issues`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "Plusieur petits probleme a fixer. les combats doivent etre classer dans l'ordre ou tu les recuperes sur le scrapping. C'est important qu'il reste dans le meme ordre. Ensuite il faudrait afficher Height: 5' 7\" Weight: 125 lbs. Reach: 70\" STANCE: Orthodox de la meme maniere que tu affiches les wins by methods. Ensuite il te manque encore des pays dans les flags. et bouge les flags tout en bas vu que l'on va mettre les stats."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent Fight Order (Priority: P1)

As a user viewing an event, I want to see the fights listed in the exact same chronological order as they appear on the source website, so that the main event is always at the top and early prelims are at the bottom (or vice versa, matching the source).

**Why this priority**: Correct event ordering is fundamental to the user experience when browsing a fight card.

**Independent Test**: Can be independently verified by comparing the displayed fight order on the platform against the source UFC event page.

**Acceptance Scenarios**:

1. **Given** a newly scraped event, **When** I view the event card, **Then** the fights must be sorted in the exact order they were retrieved during scraping.

---

### User Story 2 - Complete Fighter Stats Display (Priority: P2)

As a user analyzing a fight, I want to see the fighters' height, weight, reach, and stance displayed clearly and consistently, so I can compare their physical attributes.

**Why this priority**: Physical stats are critical information for users making picks or analyzing matchups.

**Independent Test**: Can be tested by viewing any fighter card and verifying that the four specific stats (Height, Weight, Reach, Stance) are visible and formatted like the "wins by method" section.

**Acceptance Scenarios**:

1. **Given** a fighter card with available stats, **When** I view the card, **Then** I see Height, Weight, Reach, and Stance displayed prominently.
2. **Given** the fighter card UI, **When** I locate the flags, **Then** the flags should be positioned at the very bottom of the view, below the newly added stats.

---

### User Story 3 - Missing Country Flags (Priority: P3)

As a user viewing international fighters, I want to see the correct flag for their country, so that their nationality is properly represented.

**Why this priority**: Visual polish and accurate representation of fighters.

**Independent Test**: Can be independently tested by checking fighters from previously unmapped or missing countries and verifying their flags appear correctly.

**Acceptance Scenarios**:

1. **Given** a fighter from a previously missing country, **When** I view their profile/card, **Then** their correct national flag is displayed at the bottom of the card.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST maintain the original scraping order of fights when displaying them on an event page.
- **FR-002**: System MUST display the following stats for each fighter: Height, Weight, Reach, and Stance.
- **FR-003**: System MUST format the new physical stats visually similar to the existing "wins by method" display.
- **FR-004**: System MUST position the country flags at the absolute bottom of the fighter display area.
- **FR-005**: System MUST include updated flag mappings to support previously missing countries.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of fights in a given event are displayed in the identical order to the source website.
- **SC-002**: All 4 requested physical stats (Height, Weight, Reach, Stance) are visible on the fighter cards without requiring additional clicks.
- **SC-003**: 100% of scraped fighter nationalities correctly map to a visual flag icon (no generic/missing fallback for known missing countries).
