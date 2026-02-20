export interface Fighter {
    id: string;
    name: string;
    wins: number;
    losses: number;
    draws: number;
    record: string;
    imageUrl?: string;
}


export interface Fight {
    id: string;
    eventId: string;
    fighterAId: string;
    fighterBId: string;
    fighterA: Fighter;
    fighterB: Fighter;
    division: string;
    rounds: number;
    isMainEvent: boolean;
    isCoMainEvent?: boolean;
    isMainCard: boolean;
    status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
    winnerId?: string;
    method?: string;
    round?: number;
    updatedAt: string;
    bets?: Bet[]; // Optional, included if needed
}


export interface Event {
    id: string;
    name: string;
    date: string;
    location?: string;
    status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
    fights?: Fight[];
}

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
}

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
    decision: number;
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


export interface LeagueStanding {
    userId: string;
    username: string;
    points: number;
    rank: number;
    betsPlaced: number;
    perfectPicks: number;
}
