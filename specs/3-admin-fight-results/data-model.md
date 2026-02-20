# Data Model: Admin Fight Results

## Entity Updates

### User
- **No Changes**: For MVP, all authenticated users have admin access.

### Fight
- **Existing Fields Used**:
    - `winnerId`: String (references `Fighter`)
    - `method`: Enum (`KO_TKO`, `SUBMISSION`, `DECISION`, `DRAW`, `DQ`, `NO_CONTEST`)
    - `round`: Int (1-5)
    - `status`: Enum (`SCHEDULED`, `LIVE`, `FINISHED`)

## Validation Rules
- **Method Validation**:
    - If `method` is `DECISION`, `round` is optional (or implied max rounds).
    - If `method` is `KO_TKO` or `SUBMISSION`, `round` is required.
