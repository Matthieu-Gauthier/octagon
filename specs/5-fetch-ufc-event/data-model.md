# Data Model: Fetch UFC Event

The core entities (`Event`, `Fight`, `Fighter`, `Bet`, `SurvivorPick`) already exist in the `backend/prisma/schema.prisma`. This feature will utilize the existing schema but requires strict adherence to the new logic.

## Entities & Usage

### 1. `Fighter`
- **Identity/Uniqueness**: Uses `id` as the primary key, mapping to the UFC URL slug (e.g., `jon-jones-1`).
- **Updates**: When fetching an event, if a fighter with this slug already exists, their detailed win/loss records must be updated.
- **Images**: If `imagePath` is `null`, the system will attempt to download the image, save it locally (e.g., to `public/fighters/`), and update `imagePath`.

### 2. `Event`
- **Identity**: `id` will be the event slug (e.g., `ufc-300`).
- **Fields**: `name`, `date`, `location`, `status`.

### 3. `Fight`
- **Filtering**: The fetch service will only save fights where the division/card classification indicates "Main Card" or "Prelims". "Early Prelims" are ignored.
- **Fields**: Sets `isMainCard` and `isPrelim` accordingly based on the source data.

## Database Schema Updates (Migration)

To satisfy **FR-008** (Cascading deletion of an event and all associated records), we must either handle it manually in a Prisma transaction OR update the Prisma schema to use native database cascades.

**Proposed Prisma Schema Updates:**
```prisma
model Fighter {
  // ... existing fields (remove 'record' String field)
  wins        Int?
  losses      Int?
  draws       Int?
  noContests  Int?
  winsByKo    Int?
  winsBySub   Int?
  winsByDec   Int?
  height      String?
  weight      String?
  reach       String?
  stance      String?
  sigStrikesLandedPerMin Float?
  takedownAvg Float?
}

model Fight {
  // ... existing fields
  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
}

model Bet {
  // ... existing fields
  fight Fight @relation(fields: [fightId], references: [id], onDelete: Cascade)
}

model SurvivorPick {
  // ... existing fields
  fight Fight @relation(fields: [fightId], references: [id], onDelete: Cascade)
}
```
*Note: If updating the schema is disruptive, the Admin service can map `.delete({ where: { eventId } })` sequentially across `Bet`, `SurvivorPick`, and `Fight` in a `$transaction` before deleting the `Event`.*
