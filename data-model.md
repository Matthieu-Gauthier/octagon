# Frontend Data Models

## Event
```typescript
interface Event {
    id: string;
    name: string;
    date: string; // ISO string
    location?: string;
    status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
    fights?: Fight[];
}
```

## Fight
```typescript
interface Fight {
    id: string;
    eventId: string;
    fighterAId: string;
    fighterBId: string;
    fighterA: Fighter;
    fighterB: Fighter;
    status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
    winnerId?: string;
    method?: string; // KO, SUB, DEC
    round?: number;
    updatedAt: string;
}
```

## Fighter
```typescript
interface Fighter {
    id: string;
    name: string;
    wins: number;
    losses: number;
    draws: number;
    imageUrl?: string;
}
```

## League
```typescript
interface League {
    id: string;
    name: string;
    adminId: string;
    code: string; // Invite code
    isArchived: boolean;
    members?: LeagueMember[];
}
```

## LeagueMember
```typescript
interface LeagueMember {
    id: string;
    leagueId: string;
    userId: string;
    role: 'ADMIN' | 'MEMBER';
    joinedAt: string;
    user?: UserProfile;
}
```

## Bet
```typescript
interface Bet {
    id: string;
    userId: string;
    leagueId: string;
    fightId: string;
    winnerId: string;
    method?: string;
    round?: number;
    createdAt: string;
}
```

## UserProfile
```typescript
interface UserProfile {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
}
```
