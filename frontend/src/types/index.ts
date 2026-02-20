export type Method = 'KO/TKO' | 'SUBMISSION' | 'DECISION' | 'DRAW';

export type FightStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED';

export interface Fighter {
    id: string;
    name: string;
    record: string;
    imagePath?: string;
}

// Keep Method for now as it is used in FightCard.tsx
// But api.ts uses string for method. We might want to keep the union type in frontend for safety.

export interface Fighter {
    id: string;
    name: string;
    record: string;
    imageUrl?: string;
}

export interface Fight {
    id: string;
    fighterA: Fighter;
    fighterB: Fighter;
    division: string;
    rounds: number;
    isMainEvent: boolean;
    isCoMainEvent?: boolean;
    isMainCard: boolean;
    status: FightStatus;
    winnerId?: string;
    method?: string; // Changed to string to match api.ts, or keep Method if we cast it
    round?: number;
    time?: string; // Optional, specific to frontend display? api.ts doesn't have it.
}


export interface UfcEvent {
    id: string;
    name: string;
    date: string;
    location: string;
    fights: Fight[];
}

export interface User {
    id: string;
    username: string;
    avatarUrl?: string;
}

export interface LeaderboardEntry {
    userId: string;
    user: User;
    points: number;
    betsPlaced: number;
    perfectPicks: number;
}

export interface ScoringSettings {
    winner: number;
    method: number;
    round: number;
    decision: number;
}

export interface League {
    id: string;
    name: string;
    code: string;
    adminId: string;
    members: string[];
    survivorEnabled: boolean;
    scoringSettings: ScoringSettings;
}

export interface Bet {
    id?: string; // Optional for compatibility with mocks
    leagueId: string;
    fightId: string;
    userId: string;
    winnerId: string;
    method?: Method; // Keep Method union type for frontend
    round?: number;
}
