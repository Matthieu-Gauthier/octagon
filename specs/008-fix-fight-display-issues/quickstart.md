# Feature Quickstart: Fix Fight Display Issues

## Overview
This feature ensures that fights are displayed in the exact chronological order they were scraped, instead of being randomly ordered within main card/prelim groupings. It also adds physical stats (Height, Weight, Reach, Stance) to the fighter cards and repositions the country flags to the bottom of the card while adding support for missing countries.

## Development Setup

1. **Database Migration**:
   - A new `order` field is being added to the `Fight` model in `schema.prisma`.
   - Run `npx prisma db push` (or migrate dev) in the `backend` directory after the schema update.
   - Run a fetch/scrape command to populate the new `order` values for upcoming events.

2. **Frontend Adjustments**:
   - The UI changes are primarily in `frontend/src/components/FightCard.tsx` (or related fighter portrait components).
   - Flag mappings are in `frontend/src/lib/flags.ts`.
   
## Testing the Feature

1. **Fight Order**: Navigate to an event page. The main event should be clearly at the top, and early prelims at the absolute bottom, matching the exact visual order from the UFC website.
2. **Physical Stats**: Look at any fighter card. You should see "Height", "Weight", "Reach", and "Stance" displayed in a styled row, similar to the existing "Wins by Method" breakdown.
3. **Flags**: Verify that flags are no longer overlapping the VS badge in the center, but are anchored to the bottom of the fighter card. Search for fighters from previously missing regions (like smaller European or African nations) to test the augmented `flags.ts` map.
