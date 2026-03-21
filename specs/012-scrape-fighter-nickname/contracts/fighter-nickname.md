# API Contract: Fighter Nickname Field

**Feature**: 012-scrape-fighter-nickname | **Date**: 2026-03-21

## Overview

No new endpoints. The `nickname` field is added to the existing `Fighter` object returned by all endpoints that embed fighter data.

---

## Affected Endpoints

### `GET /events/:id`

Returns an event with embedded `fights[]`, each containing `fighterA` and `fighterB` objects.

**Updated Fighter object shape** (partial):

```json
{
  "id": "conor-mcgregor",
  "name": "Conor McGregor",
  "nickname": "The Notorious",
  "wins": 22,
  "losses": 6,
  ...
}
```

**When fighter has no nickname**:

```json
{
  "id": "some-fighter",
  "name": "Some Fighter",
  "nickname": null,
  ...
}
```

---

## Field Specification

| Field    | Type          | Nullable | Description |
|----------|---------------|----------|-------------|
| nickname | `string\|null` | Yes      | Fighter's nickname as displayed on UFC.com, stripped of surrounding typographic quotes. Null when not present. |

## Backward Compatibility

This is a non-breaking additive change. Existing clients that do not read `nickname` are unaffected.
