# Data Model & State Transitions: Fix Fight Display Issues

## Entity Updates

### 1. Fight (Prisma Model Update)
*Represents a single match within an event.*

**New Fields**:
- `order` (Int): Represents the absolute chronological order of the fight within the event, exactly as scraped from the source website. Expected to start at 0 or 1 and increment sequentially.

**Existing Relevant Fields**:
- `eventId` (String): Links the fight to its parent event.
- `isMainCard`, `isPrelim`, `isMainEvent`, `isCoMainEvent` (Boolean): Grouping flags. *Note: These are no longer sufficient for exact ordering.*

### 2. Fighter (Existing Prisma Model)
*Represents a competitor.*

**Existing Relevant Fields** (No schema changes needed, just need to be displayed):
- `height` (String?)
- `weight` (String?)
- `reach` (String?)
- `stance` (String?)
- `hometown` (String?): Used for flag mapping.

## State Transitions
No new state machines or background transition jobs are introduced in this feature. The `order` field is simply populated once during the scraping `upsert` process.
