# Feature Specification: Fighter Recent Form

**Feature Branch**: `009-fighter-recent-form`  
**Created**: 2026-02-28
**Status**: Draft  
**Input**: User description: "Il faudrait faire la feature complete concernant la recent form. Ajouter ca dans le model de fighter. Nous avons besoin de stocker les 3 derniers fight. Lors du scrapping cette data se trouve dans la div athlete-record de la fiche de l'athlete. On a seulement besoin de garder la method (c-card-event--athlete-results__result qui a pour c-card-event--athlete-results__result-label Method. recuperer c-card-event--athlete-results__result-text. Pour la win recuperer c-card-event--athlete-results__image c-card-event--athlete-results__red-image win qui a a l'interieur une href avec le lien href="https://www.ufc.com/athlete/charles-johnson" de l'athlete en cours. regarder si il possede une div avec c-card-event--athlete-results__plaque win. Si il ne l'a pas c'est losse ou no-contest. Pour le no contest verifie que l'autre combatant est la baniere. si il la c'est que le combat est losses. si personne ne l'as c'est que c'est no-contest. Ensuite integre ca au frontend. nous avons definit le ui dans le showcase Mixed Information Form"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Fighter Recent Form (Priority: P1)

Users viewing a fighter's profile or fight card can see the outcome and method of their last 3 fights, to quickly assess their recent performance.

**Why this priority**: Core value of the feature is displaying this new data to users.

**Independent Test**: Can be tested by viewing a fighter who has at least 3 recent fights and verifying the outcomes match their real-world record.

**Acceptance Scenarios**:

1. **Given** a fighter with past fights, **When** viewing their Mixed Information Form UI, **Then** the last 3 fight outcomes (Win/Loss/NC) and methods are displayed accurately.
2. **Given** a fighter with fewer than 3 fights, **When** viewing their Mixed Information Form UI, **Then** only the available past fights are shown without breaking the layout.

---

### User Story 2 - Automated Scraping of Recent Form (Priority: P1)

The system automatically extracts the last 3 fight results for each fighter during the regular scraping process, ensuring data is up-to-date without manual entry.

**Why this priority**: Without the data, the UI cannot be populated.

**Independent Test**: Can be tested by running the scraper on an athlete's page and verifying the database correctly updates the fighter's recent form field.

**Acceptance Scenarios**:

1. **Given** an athlete's UFC.com profile page, **When** the scraper processes it, **Then** it correctly identifies the last 3 fights from the `athlete-record` section.
2. **Given** a recent fight that ended in a Win, **When** the scraper processes it, **Then** it accurately records it as a Win and captures the method (e.g., KO/TKO, Decision).
3. **Given** a recent fight that ended in a Loss or No Contest, **When** the scraper processes it, **Then** it accurately distinguishes between Loss and No Contest and captures the method.

---

### Edge Cases

- What happens when a fighter has fewer than 3 total fights? The system should handle and store only the available fights gracefully.
- How does system handle missing method strings on the UFC website? It should fall back to an "Unknown" or empty method rather than failing the scrape.
- What happens if the `athlete-record` structure changes slightly? The scraper should fail gracefully for that specific fighter without crashing the entire batch process.

## Clarifications

### Session 2026-02-28
- Q: Handling "Draw" Results → A: Explicitly handle and store "Draw" as a separate result type.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expand the Fighter database model to store up to 3 of their most recent fight outcomes (Result, Method).
- **FR-002**: System MUST scrape the `athlete-record` div on the UFC athlete page to extract the last 3 fights.
- **FR-003**: System MUST extract the method of victory from `c-card-event--athlete-results__result-text` where the label is "Method".
- **FR-004**: System MUST determine a "Win" by verifying the presence of the `c-card-event--athlete-results__plaque win` div within the athlete's result block.
- **FR-005**: System MUST differentiate between "Loss", "Draw", and "No Contest" for non-wins by checking if the opponent has the win banner (Loss) or if neither has it (requires text/method inspection to differentiate Draw from No Contest).
- **FR-006**: System MUST update the frontend UI to display this information, integrating it into the "Mixed Information Form" showcase components.

### Key Entities *(include if feature involves data)*

- **Fighter**: Extended to include a `recentForm` attribute, representing an array of up to 3 objects containing the result (`Win`, `Loss`, `Draw`, `NC`) and the method string.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of newly scraped active fighters have their available last fights (up to 3) accurately populated in the database.
- **SC-002**: The scraper successfully extracts recent form data without increasing the failure rate of the overall scraping process.
- **SC-003**: The frontend Mixed Information Form component accurately renders the recent form for 100% of tested fighters without UI glitches.
