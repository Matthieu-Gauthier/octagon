# Feature Specification: Fighter Ranking & Champion Status

**Feature Branch**: `013-fighter-ranking`
**Created**: 2026-03-21
**Status**: Draft

## Context

The app scrapes fighter profiles from UFC.com to populate the fighter database. Each fighter profile page includes tags showing their division ranking (e.g. "#13 Welterweight Division") and, for title holders, a "Title Holder" tag. This data is not currently captured. Adding it enriches the fight card experience, letting users immediately see at a glance who is ranked and who holds a title — key context when placing picks.

---

## User Scenarios & Testing

### User Story 1 - Ranking & Champion Status Scraped (Priority: P1)

When the scraper processes a fighter's UFC.com profile, it captures their division rank number and division name if a ranked tag is present, and marks them as champion if a title-holder tag is present. This data is stored on the fighter record.

**Why this priority**: All display depends on having accurate data in the database first.

**Independent Test**: Trigger a scrape for a known ranked fighter (e.g., #3 in a division) and a known champion. Verify their records contain the correct rank/division and champion flag.

**Acceptance Scenarios**:

1. **Given** a fighter profile with a tag like "#13 Welterweight Division", **When** the scraper runs, **Then** the fighter record stores rank `13` and division `Welterweight`.
2. **Given** a fighter profile with a "Title Holder" tag, **When** the scraper runs, **Then** the fighter record marks the fighter as champion (no rank number stored).
3. **Given** a fighter profile with no ranking tag, **When** the scraper runs, **Then** the rank and champion fields are left null — no error occurs.
4. **Given** a fighter whose rank changes between scrapes, **When** the scraper re-runs, **Then** the stored rank is updated to the new value.
5. **Given** a ranking tag with extra whitespace or newlines, **When** the scraper runs, **Then** the rank is still parsed correctly.

---

### User Story 2 - Ranking Badge Displayed on Fight Card (Priority: P2)

When a user views a fight card — on browser or mobile — each fighter's ranking status is shown as a small badge next to their name:
- Champions display a gold **C** badge
- Ranked fighters display a white **#N** badge (e.g. `#3`)
- Unranked fighters show nothing

**Why this priority**: Visible context that directly helps users make informed picks.

**Independent Test**: Load a fight card where one fighter is a champion and another is ranked. Verify the gold C and white #N badges appear correctly on both browser and mobile layouts. Verify an unranked fighter shows no badge.

**Acceptance Scenarios**:

1. **Given** a fight card with a champion fighter, **When** the user views the card, **Then** a gold **C** badge appears next to that fighter's name on both browser and mobile.
2. **Given** a fight card with a ranked fighter (e.g. #5), **When** the user views the card, **Then** a white **#5** badge appears next to that fighter's name on both browser and mobile.
3. **Given** a fight card where both fighters are ranked, **When** the user views the card, **Then** both badges appear — each next to their respective fighter.
4. **Given** a fight card where a fighter is unranked, **When** the user views the card, **Then** no badge appears next to that fighter's name.
5. **Given** a champion fighter, **When** the card is displayed, **Then** no rank number is shown — only the **C** badge.

---

### Edge Cases

- **Multiple tags**: A fighter profile may have several `.hero-profile__tag` elements — only the first one containing `#` followed by a number is used for ranking; others are ignored.
- **Champion with rank tag**: If both a title-holder tag and a rank tag exist, champion status takes precedence and no rank number is shown.
- **Interim champion**: Some tags may say "Interim Title Holder" — treated the same as champion.
- **Unranked**: No tag matching the rank pattern → rank and champion fields are null/absent; no badge shown in UI.
- **Rank number out of expected range**: A very high rank number (e.g. #99) is stored and displayed as-is without filtering.
- **Division name variations**: Division name may include "Women's" prefix or weight qualifier (e.g. "Women's Strawweight") — stored as-is from the tag text.

## Requirements

### Functional Requirements

**Backend — Scraping**

- **FR-001**: When scraping a fighter profile, the system MUST scan all `.hero-profile__tag` elements and find the first one whose text matches the pattern `#<number> <division name>`.
- **FR-002**: From a matched ranking tag, the system MUST extract the rank as an integer (without the `#`) and the division name as a trimmed string.
- **FR-003**: The system MUST detect champion status by checking if any `.hero-profile__tag` element contains "Title Holder" (including "Interim Title Holder"), case-insensitively and whitespace-tolerant.
- **FR-004**: If a fighter is a champion, the system MUST store the champion flag as true and MUST NOT store a rank number.
- **FR-005**: If no ranking tag and no champion tag are found, the system MUST leave both fields null — no error, no empty string.
- **FR-006**: Rank and champion fields MUST be optional on the fighter data model.
- **FR-007**: Scraping rank/champion MUST occur within the existing fighter scrape flow — no new network requests.
- **FR-008**: Rank and champion data MUST be included in the fighter data returned by the API.

**Frontend — Display**

- **FR-009**: When a fighter has champion status, the fight card MUST display a **C** badge in gold color next to their name, on both browser and mobile layouts.
- **FR-010**: When a fighter has a rank number (and is not a champion), the fight card MUST display a **#N** badge in white next to their name, on both browser and mobile layouts.
- **FR-011**: When a fighter is unranked and not a champion, no badge MUST appear — no empty element or placeholder.
- **FR-012**: The badge MUST be positioned inline with the fighter's name, consistent with the nickname display already in place.

### Key Entities

- **Fighter**: Gains two optional fields — `rankingPosition` (integer, the rank number) and `isChampion` (boolean flag). Both are absent/null for unranked fighters.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of ranked fighters on UFC.com have their correct rank number and division stored after a full scrape.
- **SC-002**: 100% of title holders on UFC.com are marked as champion after a full scrape.
- **SC-003**: 100% of unranked fighters have null rank and champion fields — no false positives.
- **SC-004**: On any fight card with a champion or ranked fighter, the correct badge appears on both browser and mobile within one scrape cycle.
- **SC-005**: No existing scrape jobs fail or regress due to this addition.

## Assumptions

- The `.hero-profile__tag` elements are reliably present on UFC.com fighter profiles when ranking data exists.
- "Title Holder" and "Interim Title Holder" are the only champion-indicating tag texts; other variations are treated as non-champion.
- The rank tag format is consistently `#<number> <division name>` with possible leading/trailing whitespace or newlines.
- Champion fighters may also appear on divisional rankings pages with a rank listed, but for this feature the profile-page tag is the source of truth — if the champion tag is present, `isChampion` is true and no rank is stored.
- No changes to the scoring, betting, or league logic are in scope.
- The badge is displayed in the same location as the nickname (inline with the fighter name row) and does not replace it.
