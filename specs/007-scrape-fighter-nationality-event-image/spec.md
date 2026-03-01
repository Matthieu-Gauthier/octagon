# Feature Specification: Scrape Fighter Nationality & Event Image

**Feature Branch**: `007-scrape-fighter-nationality-event-image`  
**Created**: 2026-02-21  
**Status**: Draft  
**Input**: User description: "Il faudrai recuperer la nationnalite du combatant lors du scrapping. Elle se trouve en bas de la vue de l atlethe <div class=\"c-bio__field c-bio__field--border-bottom-small-screens\"> <div class=\"c-bio__label\">Hometown</div> <div class=\"c-bio__text\">United States</div> </div> Afficher un drapeau du combatant dans la la fightCard. Dans un event il faudrait aussi recuperer lors du scrapping l eventImg que l on stockerait dans la database events. l image de l event se trouve dans la div qui a la class=\"c-hero__image\" il y a un element picture qui a une img recuperer le lien dans src. afficher ensuite cette image dans en background de la card de titre de la vue fightCard."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fighter Nationality Flags (Priority: P1)

As a user viewing a fight card, I want to see the national flags of the competing fighters so I can easily identify their home countries and add visual flair to the cards.

**Why this priority**: Enhances the visual experience of the fight card UI and adds valuable context about the athletes.

**Independent Test**: Can be independently verified by checking if the scraper extracts the 'Hometown' data, maps it to a flag, and the UI successfully displays it within the `FightCard`.

**Acceptance Scenarios**:

1. **Given** an upcoming or past fight card, **When** I view the fighters on the card, **Then** I should see a flag icon corresponding to their parsed nationality displayed next to their name or portrait.
2. **Given** a fighter whose 'Hometown' is not provided on the source site, **When** the fight card is rendered, **Then** a graceful fallback (like a globe icon or omitted flag) should be displayed without breaking the UI.

---

### User Story 2 - Event Hero Images (Priority: P2)

As a user browsing the app, I want to see a high-quality background image for the event in the header of the FightCard or Event Details view, rather than a generic background, making the UI feel more premium and connected to the real event.

**Why this priority**: Significant visual upgrade for the application, making the events feel more authentic and distinct.

**Independent Test**: Can be verified by checking if the scheduled event object in the database contains a valid image URL parsed from the event source page, and if the frontend renders this URL as a background image.

**Acceptance Scenarios**:

1. **Given** a new event being scraped, **When** the scraper processes the event page, **Then** it extracts the source URL of the main hero image.
2. **Given** an event with a stored background image, **When** I view the event's fight cards, **Then** the title card/header uses the event image as its background.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The event scraper MUST extract the full text value from the `c-bio__text` element that follows the `c-bio__label` containing "Hometown" on individual fighter pages.
- **FR-002**: The system MUST map the scraped hometown string to a corresponding country/nationality identifier to display the appropriate flag asset.
- **FR-003**: The event scraper MUST extract the image URL (`src` attribute) from the `img` tag nested within the `<picture>` element inside the `<div class="c-hero__image">` container on the event's main page.
- **FR-004**: The system MUST persist the scraped event image URL into the `events` database table.
- **FR-005**: The frontend `FightCard` component MUST be updated to accept and display national flags for both fighters.
- **FR-006**: The frontend view for the event title card MUST be updated to accept and display the event image URL as a background image.

### Key Entities

- **Event**: Needs a new optional attribute/field to store the `eventImg` URL string.
- **Fighter**: Needs a new optional attribute/field to store the `hometown` or `nationality` string.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Data Extraction: 100% of future scraped events successfully capture the hero image URL if it exists on the source page.
- **SC-002**: Data Extraction: 95% of newly scraped fighters have their hometown extracted correctly.
- **SC-003**: UI Visuals: The event title card displays the custom background image without visual distortion or unreadable text overlap.
- **SC-004**: UI Visuals: The fighter portraits display the correct national flag based on the scraped hometown data with no console errors for missing image assets.
