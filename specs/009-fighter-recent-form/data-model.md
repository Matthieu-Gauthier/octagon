# Data Model: Fighter Recent Form

## Entities

### `Fighter` (Modified)
The existing `Fighter` model will be extended to support storing the recent form.

**New Fields:**
- `recentForm`: `Json?`
  - Stores an array of up to 3 objects representing the fighter's most recent bouts.
  - **JSON Schema:**
    ```typescript
    type RecentFormEntry = {
      result: 'W' | 'L' | 'D' | 'NC';
      method: string;
      opponent?: string; // Optional, might be useful for display later
    };
    // recentForm will be RecentFormEntry[]
    ```

**Relationships:**
- Unchanged.

## Validation Rules
- The `recentForm` array should contain no more than 3 elements.
- `result` must be mapped from the scraped web data to one of the canonical states (`W`, `L`, `D`, `NC`).
- If parsing fails for a specific fight on the athlete's page, the system should gracefully skip or fallback to "Unknown" method rather than failing the whole scrap operation.
