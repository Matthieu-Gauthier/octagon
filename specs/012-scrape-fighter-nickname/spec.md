# Feature Specification: Fighter Nickname — Scraping & Display

**Feature Branch**: `012-scrape-fighter-nickname`
**Created**: 2026-03-21
**Status**: Draft

## Context

The app scrapes fighter profiles from UFC.com to populate the fighter database. Currently, only core fields (name, record, weight class, etc.) are collected. UFC fighter profiles display a nickname (e.g., "The Machine", "The Notorious") in a dedicated HTML element on the profile page. This feature adds nickname scraping on the backend and surfaces the nickname in the fight card UI on both the mobile and browser views, displayed adjacent to each fighter's name.

---

## User Scenarios & Testing

### User Story 1 - Nickname Captured During Scrape (Priority: P1)

When the scraper fetches or updates a fighter's profile from UFC.com, it also captures the fighter's nickname if one is listed on their profile. The nickname is stored alongside the fighter's other data and becomes available to the app.

**Why this priority**: This is the prerequisite — the nickname must be scraped and persisted correctly before it can be displayed.

**Independent Test**: Trigger a scrape for a fighter known to have a nickname (e.g., Conor McGregor — "The Notorious"). Verify the fighter record in the database now contains the correct nickname.

**Acceptance Scenarios**:

1. **Given** a fighter profile on UFC.com that includes a nickname, **When** the scraper processes that profile, **Then** the fighter's nickname is stored in the database.
2. **Given** a fighter profile on UFC.com that has no nickname, **When** the scraper processes that profile, **Then** the fighter's nickname field is left empty/absent — no error occurs and the scrape completes normally.
3. **Given** a fighter already in the database without a nickname, **When** a scrape runs and finds a nickname on their profile, **Then** the nickname is added to their existing record.
4. **Given** a fighter already in the database with a nickname, **When** a scrape runs and their profile no longer shows a nickname, **Then** the nickname field is cleared.

---

### User Story 2 - Nickname Displayed on Fight Card (Priority: P2)

When a user views a fight card — on mobile or in the browser — each fighter's nickname (if available) is shown adjacent to their name: to the right of the name for the left-side fighter, and to the left of the name for the right-side fighter. The nickname appears in uppercase and italic, enclosed in parentheses.

**Why this priority**: This is the visible user-facing value. Once the data is available, users can immediately see each fighter's nickname in the fight card.

**Independent Test**: Open a fight card containing fighters with known nicknames. Verify the nickname appears correctly positioned, styled, and formatted next to each fighter's name on both the mobile and browser layouts.

**Acceptance Scenarios**:

1. **Given** a fight card is displayed and both fighters have nicknames, **When** the user views the card, **Then** the left fighter's nickname appears to the right of their name and the right fighter's nickname appears to the left of their name — both in uppercase, italic, and enclosed in parentheses.
2. **Given** a fight card is displayed and one fighter has no nickname, **When** the user views the card, **Then** the fighter with a nickname shows it correctly and the fighter without a nickname shows only their name — no empty parentheses or placeholder.
3. **Given** a fight card is displayed and neither fighter has a nickname, **When** the user views the card, **Then** both fighters show only their names — layout is unchanged and no empty elements appear.
4. **Given** a mobile user views a fight card, **When** nicknames are present, **Then** the same positioning and styling rules apply as on the browser view.

---

### Edge Cases

- **Missing nickname**: Fighter has no nickname — only the fighter's name is shown, no parentheses.
- **Long nickname**: A very long nickname (e.g., "The American Gangster") must not break the layout — text wraps or truncates gracefully without overlapping other elements.
- **Special characters**: Nickname contains apostrophes or accented characters — displayed correctly without encoding artifacts.
- **Wrapper quotes in HTML**: The scraped nickname element may include surrounding typographic quotes (e.g., `"The Machine"`) — the stored and displayed value strips those redundant outer quotes.
- **Scrape failure**: If a profile is unavailable, the nickname field stays null and the UI falls back to name-only display.

## Requirements

### Functional Requirements

**Backend — Scraping**

- **FR-001**: When scraping a fighter profile, the system MUST attempt to read the nickname from the designated nickname element on the page.
- **FR-002**: If a nickname is found, the system MUST store it on the fighter record.
- **FR-003**: If no nickname element is present or the element is empty, the system MUST leave the nickname field absent/null — it MUST NOT store an empty string or throw an error.
- **FR-004**: The nickname field MUST be optional on the fighter data model — existing fighters without a nickname remain valid records.
- **FR-005**: Nickname scraping MUST occur as part of the existing fighter scrape flow — no separate scrape job is required.
- **FR-006**: The nickname MUST be included in the fighter data returned by the app so the frontend can access it.

**Frontend — Display**

- **FR-007**: On the fight card, if a fighter has a nickname, it MUST be displayed in parentheses, in uppercase, and in italic style.
- **FR-008**: For the left-side fighter, the nickname MUST appear to the right of their name.
- **FR-009**: For the right-side fighter, the nickname MUST appear to the left of their name.
- **FR-010**: If a fighter has no nickname, no parentheses, placeholder, or empty element MUST appear next to their name.
- **FR-011**: The nickname display MUST work correctly on both the mobile layout and the browser (desktop) layout.
- **FR-012**: A long nickname MUST NOT break or overflow the fight card layout — it wraps or truncates gracefully.

### Key Entities

- **Fighter**: Gains an optional `nickname` attribute (plain text). All other fighter attributes remain unchanged.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of fighters with a nickname on UFC.com have that nickname correctly stored after a full scrape run.
- **SC-002**: 100% of fighters without a nickname on UFC.com have no nickname value stored — no empty-string artifacts.
- **SC-003**: No existing scrape jobs fail or regress due to this addition.
- **SC-004**: On any fight card containing fighters with nicknames, 100% of those nicknames are correctly positioned and styled on both mobile and browser views.
- **SC-005**: Fighters without nicknames show no empty parentheses or extra whitespace next to their name.
- **SC-006**: The fight card layout remains intact (no overflow, no overlap) even with long nicknames.

## Assumptions

- The nickname HTML element is consistently present on UFC.com fighter profiles when a nickname exists, and absent when it does not.
- The displayed text may include surrounding typographic quotes (e.g., `"The Machine"`) that should be stripped before storage.
- "Left fighter" and "right fighter" refer to the two sides of the versus layout on the fight card, as currently implemented.
- The existing fighter scrape pipeline already visits individual fighter profile pages, so this is an additive field extraction with no new network requests needed.
- Both mobile and browser fight card views share the same left/right positioning rule for nicknames.
