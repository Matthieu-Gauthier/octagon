# API Contracts

There are no new endpoints required for this feature. We will only be augmenting existing payloads.

## `GET /api/events` and `GET /api/events/:id`
The existing endpoints will begin returning the new `eventImg` and `hometown` fields once scraped.

### Augmented Event Response
```json
{
  "id": "uuid",
  "name": "UFC 300",
  "date": "2024-04-13T...',
  "location": "Las Vegas, NV",
  "eventImg": "https://ufc.com/images/...", // NEW
  "mainCardStartAt": "...",
  "prelimsStartAt": "...",
  "fights": [
    {
       "fighterA": {
           "id": "uuid",
           "name": "Charles Oliveira",
           "imagePath": "...",
           "hometown": "Guaruja, Sao Paulo, Brazil" // NEW
       }
    }
  ]
}
```
