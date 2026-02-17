export type Method = 'KO/TKO' | 'SUBMISSION' | 'DECISION' | 'DRAW';

export type FightStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED';

export interface Fighter {
    id: string;
    name: string;
    record: string;
    imageUrl?: string;
}

export interface FightResult {
    winnerId: string;
    method: Method;
    round?: number;
    time?: string;
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
    result?: FightResult;
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
    leagueId: string;
    fightId: string;
    userId: string;
    winnerId: string;
    method?: Method;
    round?: number;
}
