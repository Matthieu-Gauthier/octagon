# API Contracts: Lock Bets by Card-Section Start Timestamp

**Feature**: 006-lock-bets-timestamp  
**Date**: 2026-02-21

No new endpoints are introduced by this feature. All changes are to existing endpoint **response shapes** and **error behaviour**.

---

## Modified Endpoints

### GET /events (and GET /events/:id)

**Change**: Response now includes `prelimsStartAt` and `mainCardStartAt` on each event object.

#### Response Shape (updated)

```json
{
  "id": "ufc-fight-night-february-21-2026",
  "name": "UFC Fight Night February 21 2026",
  "date": "2026-02-21T22:00:00.000Z",
  "location": "UFC APEX - Las Vegas, NV",
  "status": "SCHEDULED",
  "prelimsStartAt": "2026-02-22T00:00:00.000Z",
  "mainCardStartAt": "2026-02-22T02:00:00.000Z",
  "fights": [...]
}
```

**Notes**:
- `prelimsStartAt` and `mainCardStartAt` may be `null` if not scraped.
- Existing clients that do not read these fields are unaffected — fully backward compatible.

---

### POST /bets

**Change**: Error conditions are refined — the 400 response message now distinguishes which card section is locked.

#### Request (unchanged)

```json
{
  "leagueId": "string",
  "fightId": "string",
  "winnerId": "string",
  "method": "KO/TKO | SUBMISSION | DECISION",
  "round": 2
}
```

#### Success Response (unchanged)

```json
{
  "id": "uuid",
  "leagueId": "...",
  "userId": "...",
  "fightId": "...",
  "winnerId": "...",
  "method": "KO/TKO",
  "round": 2,
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### Error Responses (updated messages)

| Status | Condition | Message |
|--------|-----------|---------|
| 404 | Fight not found | `Fight not found` |
| 400 | Prelim fight, `now >= prelimsStartAt` | `Betting is closed for preliminary card fights` |
| 400 | Main card fight, `now >= mainCardStartAt` | `Betting is closed for main card fights` |
| 400 | Fight status is FINISHED | `Betting is closed for this fight` |

---

### Admin: POST /admin/events/fetch (scraper trigger)

**Change**: Response stats now include whether timestamps were scraped.

#### Response Shape (updated)

```json
{
  "success": true,
  "message": "Successfully imported UFC Fight Night ...",
  "data": {
    "event": {
      "id": "...",
      "name": "...",
      "date": "...",
      "prelimsStartAt": "2026-02-22T00:00:00.000Z",
      "mainCardStartAt": "2026-02-22T02:00:00.000Z"
    },
    "stats": {
      "fightersAddedOrUpdated": 20,
      "fightsAdded": 10
    }
  }
}
```

---

## No New Endpoints

All contract changes are additive (new nullable fields in responses) or refinements to existing error messages. No new routes are required.
