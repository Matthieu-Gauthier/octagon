export interface SurvivorProfile {
    userId: string;
    currentStreak: number;
    bestStreak: number;
}

export interface SurvivorPick {
    id: string;
    userId: string;
    eventId: string;
    fightId: string;
    fighterId: string;
    weekNumber: number;
    status: 'PENDING' | 'WON' | 'LOST' | 'DRAW' | 'NC';
}

// Event result: did the user survive (all correct) or fail (at least one wrong)?
export type EventResult = 'PERFECT' | 'FAILED' | 'PENDING';

export const MOCK_SURVIVOR_PROFILE: SurvivorProfile = {
    userId: "me",
    currentStreak: 1,
    bestStreak: 1
};

export const MOCK_SURVIVOR_PICKS: SurvivorPick[] = [
    // Bautista vs Oliveira - PERFECT (all correct → streak started)
    { id: "p1", userId: "me", eventId: "ufn-bautista-oliveira", fightId: "fb-main", fighterId: "bautista", weekNumber: 1, status: "WON" },
    { id: "p2", userId: "me", eventId: "ufn-bautista-oliveira", fightId: "fb-comain", fighterId: "horiguchi", weekNumber: 1, status: "WON" },

    // Strickland vs Hernandez - PENDING (upcoming)
    { id: "p3", userId: "me", eventId: "ufn-strickland-hernandez", fightId: "fs-main", fighterId: "strickland", weekNumber: 2, status: "PENDING" },
];
