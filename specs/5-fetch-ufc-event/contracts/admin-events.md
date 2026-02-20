# OpenAPI / REST Contract: Admin UFC Events

## 1. Fetch Next Event
**Endpoint**: `POST /api/admin/events/fetch`  
**Description**: Triggers the scraping/API retrieval of the next upcoming UFC event. Processes fighters, fights (Main Card & Prelims only), and downloads missing images.

**Request**:
```json
// Empty body (or optional forced URL if overriding)
{}
```

**Response (Success - 200 OK)**:
```json
{
  "success": true,
  "message": "Successfully imported UFC 300",
  "data": {
    "event": {
      "id": "ufc-300",
      "name": "UFC 300: Pereira vs. Hill",
      "date": "2024-04-13T22:00:00.000Z"
    },
    "stats": {
      "fightersAddedOrUpdated": 26,
      "imagesDownloaded": 4,
      "fightsAdded": 13,
      "fightsSkipped": 2
    }
  }
}
```

**Response (Error - 500 Internal Server Error)**:
```json
{
  "success": false,
  "message": "Failed to retrieve event data from source API/Scraper",
  "error": "Source Timeout"
}
```

---

## 2. Remove Event
**Endpoint**: `DELETE /api/admin/events/:id`  
**Description**: Deletes an event by ID. This cascades to delete all associated `Fight`, `Bet`, and `SurvivorPick` records to ensure test data can be cleanly removed.

**Request**:
- Path parameter: `id` (string, e.g., `ufc-300`)

**Response (Success - 200 OK)**:
```json
{
  "success": true,
  "message": "Event ufc-300 and all associated records deleted successfully."
}
```

**Response (Error - 404 Not Found)**:
```json
{
  "success": false,
  "message": "Event not found"
}
```
