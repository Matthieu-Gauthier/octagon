# API Contracts: Fix Fight Display Issues

## Updated Endpoints

### `GET /events` and `GET /events/:id`

**Changes**: 
The endpoints themselves do not change their path or required parameters. However, the ordering of the `fights` array within the returned `Event` object will change.

**Previous Behavior**:
```typescript
orderBy: [{ isMainEvent: 'desc' }, { isCoMainEvent: 'desc' }, { isMainCard: 'desc' }]
```

**New Behavior**:
```typescript
orderBy: { order: 'asc' } 
// OR 'desc', depending on if index 0 is Main Event or Early Prelim.
```

**Payload Impact**:
The `fights` array items will now include the new `order` property representing their scraped sequence.

```json
{
  "id": "event-uuid",
  "name": "UFC 300",
  "fights": [
    {
      "id": "fight-1",
      "order": 1, 
      "fighterA": {
         "id": "fighter-a",
         "height": "6' 2\"",
         "weight": "205 lbs.",
         ...
      }
      ...
    }
  ]
}
```
