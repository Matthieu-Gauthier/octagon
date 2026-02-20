// =============================================================================
// Frontend API Types — aligned with backend Prisma schema
// Single source of truth for all domain types
// =============================================================================

export type Method = 'KO/TKO' | 'SUBMISSION' | 'DECISION' | 'DRAW' | 'NC';

export type FightStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED';

export interface Fighter {
    id: string;
    name: string;
    // Stats from Prisma (all optional — may not be populated yet)
    wins?: number;
    losses?: number;
    draws?: number;
    noContests?: number;
    winsByKo?: number;
    winsBySub?: number;
    winsByDec?: number;
    height?: string;
    weight?: string;
    reach?: string;
    stance?: string;
    sigStrikesLandedPerMin?: number;
    takedownAvg?: number;
    imagePath?: string;
}

export interface Fight {
    id: string;
    eventId?: string;
    fighterA: Fighter;
    fighterB: Fighter;
    division: string;
    rounds: number;
    isMainEvent: boolean;
    isCoMainEvent?: boolean;
    isMainCard: boolean;
    isPrelim?: boolean;
    status: FightStatus;
    winnerId?: string;
    method?: string;
    round?: number;
    time?: string;
}

export interface Event {
    id: string;
    name: string;
    date: string;
    location?: string;
    status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
    fights?: Fight[];
}

// Alias kept for backward compat with components using UfcEvent
export type UfcEvent = Event;

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
}

// Alias kept for backward compat
export type User = UserProfile;

export interface LeagueMember {
    id: string;
    leagueId: string;
    userId: string;
    role: 'ADMIN' | 'MEMBER';
    joinedAt: string;
    user?: UserProfile;
}

export interface ScoringSettings {
    winner: number;
    method: number;
    round: number;
    decision?: number;
}

export interface League {
    id: string;
    name: string;
    adminId: string;
    code: string;
    isArchived: boolean;
    survivorEnabled: boolean;
    members?: LeagueMember[];
    _count?: {
        members: number;
    };
    admin?: UserProfile;
    scoringSettings?: ScoringSettings;
}

export interface Bet {
    id: string;
    userId: string;
    leagueId: string;
    fightId: string;
    winnerId: string;
    method?: string;
    round?: number;
    createdAt: string;
}

export interface BetDTO {
    leagueId: string;
    fightId: string;
    winnerId: string;
    method?: string;
    round?: number;
}

export interface LeaderboardEntry {
    userId: string;
    user: UserProfile;
    points: number;
    betsPlaced: number;
    perfectPicks: number;
}

export interface LeagueStanding {
    userId: string;
    username: string;
    points: number;
    rank: number;
    betsPlaced: number;
    perfectPicks: number;
}
