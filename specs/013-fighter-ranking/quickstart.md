# Quickstart: Fighter Ranking & Champion Status

**Feature**: 013-fighter-ranking
**Date**: 2026-03-21

---

## Integration Scenarios

### Scenario 1: Ranked Fighter Scrape

**Setup**: A fighter profile page contains:
```html
<p class="hero-profile__tag">#13 Welterweight Division</p>
```

**Expected scraper output**:
```typescript
{
  rankingPosition: 13,
  isChampion: undefined,
}
```

**Expected DB state**: `fighters.rankingPosition = 13`, `fighters.isChampion = null`

---

### Scenario 2: Champion Fighter Scrape

**Setup**: A fighter profile page contains:
```html
<p class="hero-profile__tag">Title Holder</p>
```

**Expected scraper output**:
```typescript
{
  rankingPosition: undefined,
  isChampion: true,
}
```

**Expected DB state**: `fighters.rankingPosition = null`, `fighters.isChampion = true`

---

### Scenario 3: Interim Champion Scrape

**Setup**: A fighter profile page contains:
```html
<p class="hero-profile__tag">Interim Title Holder</p>
```

**Expected scraper output**:
```typescript
{
  rankingPosition: undefined,
  isChampion: true,
}
```

---

### Scenario 4: Unranked Fighter Scrape

**Setup**: No ranking or title tag on the profile page.

**Expected scraper output**:
```typescript
{
  rankingPosition: undefined,
  isChampion: undefined,
}
```

**Expected DB state**: Both fields remain `null`.

---

### Scenario 5: Champion with Rank Tag (edge case)

**Setup**: Profile has both a rank tag and a title holder tag:
```html
<p class="hero-profile__tag">#1 Lightweight Division</p>
<p class="hero-profile__tag">Title Holder</p>
```

**Expected scraper output**:
```typescript
{
  rankingPosition: undefined,  // champion overrides rank
  isChampion: true,
}
```

---

### Scenario 6: Fight Card UI — Champion Badge

**Setup**: `fighterA.isChampion = true`

**Expected UI**: Gold `C` badge displayed inline after fighter A's name on both browser and mobile layouts.

---

### Scenario 7: Fight Card UI — Ranked Badge

**Setup**: `fighterB.rankingPosition = 5`

**Expected UI**: White `#5` badge displayed inline before fighter B's name on both browser and mobile layouts.

---

### Scenario 8: Fight Card UI — Unranked Fighter

**Setup**: `fighterA.rankingPosition = null`, `fighterA.isChampion = null`

**Expected UI**: No badge rendered, no empty element in the DOM.

---

## Manual Verification Steps

1. Trigger a scrape for a known champion (e.g., Jon Jones — Heavyweight champion):
   ```bash
   # Call admin scrape endpoint or use Prisma Studio to inspect fighters table
   ```
2. Check DB: `isChampion = true`, `rankingPosition = null`
3. Load fight card page — confirm gold **C** badge next to their name
4. Trigger scrape for a ranked fighter (e.g., #3 in a division)
5. Check DB: `rankingPosition = 3`, `isChampion = null`
6. Load fight card — confirm white **#3** badge
7. Load fight card with an unranked fighter — confirm no badge appears
