# Research: Fighter Nickname — Scraping & Display

**Feature**: 012-scrape-fighter-nickname | **Date**: 2026-03-21

## Summary

All unknowns resolved. No external research was required — the selector and display rules were explicitly specified by the user, and the existing codebase patterns are sufficient.

---

## Finding 1: UFC.com Nickname HTML Selector

- **Decision**: `p.hero-profile__nickname`
- **Rationale**: Explicitly confirmed by the user from live UFC.com HTML inspection. Consistent with the existing name selector `h1.hero-profile__name` already used in `scraper.service.ts`.
- **Alternatives considered**: None.

---

## Finding 2: Wrapper Quote Stripping

- **Decision**: Strip leading/trailing typographic and ASCII double-quotes after `.text().trim()`.
- **Rationale**: UFC.com wraps nicknames in display quotes in the HTML text content (e.g., `"The Machine"`). Storing raw text would include these decorative quotes.
- **Regex**: `/^["""\s]+|["""\s]+$/g`
- **Alternatives considered**: Storing with quotes — rejected; display would then double-wrap them.

---

## Finding 3: Existing Scraper Pattern

- **Codebase observation**: `scraper.service.ts::scrapeFighter()` already uses Cheerio selectors with new/fallback patterns (e.g., `h1.hero-profile__name || h1.c-hero__headline`). Nickname has no known fallback selector — if absent, field is null.
- **Decision**: No fallback selector needed. Absence = null.

---

## Finding 4: Fighter Upsert Location

- **Codebase observation**: Fighter upserts happen in `events.service.ts::saveEventData()` (lines 122–146). The `update` block explicitly lists every field. The `nickname` field must be added to both `update` and it will be picked up by `create: fighter` automatically.
- **Decision**: Add `nickname: fighter.nickname ?? null` to the `update` block.

---

## Finding 5: Frontend Fighter Type

- **Codebase observation**: `Fighter` interface is defined in `frontend/src/types/api.ts`. It is used by both `FightCard.tsx` and `MobilePicks.tsx`.
- **Decision**: Add `nickname?: string` to the `Fighter` interface.

---

## Finding 6: Nickname Display Placement

- **Browser (`FightCard.tsx`)**: Fighter names are rendered as stacked word `<span>` blocks inside an `<h3>`. The nickname will be added as a separate element after the `<h3>`, inside the same name container `<div>`.
- **Mobile (`MobilePicks.tsx`)**: Fighter last name shown in a `<p>` tag within a flex row. Nickname will be added as a small `<p>` below it, or inline in the same row — but the flex layout makes inline complex, so it goes below.
- **Style**: `text-[10px] italic uppercase text-zinc-400` — small, muted, italic, uppercase — consistent with the app's dark-mode aesthetic.
- **Format**: `(NICKNAME)` — plain parentheses added in the render, not stored in the database.
