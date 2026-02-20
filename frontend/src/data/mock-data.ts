import { Fight, UfcEvent, User, LeaderboardEntry, Bet } from "@/types";

// Re-export for compatibility if needed, using the 'Bet' type alias
export type MockUserBet = Bet;
export type { Fight, UfcEvent, User, LeaderboardEntry };

// ============================================================================
// REAL UFC EVENTS
// ============================================================================

export const MOCK_EVENTS: UfcEvent[] = [
    // ---- PAST EVENT (finished, all results in) ----
    {
        id: "ufn-bautista-oliveira",
        name: "UFC Fight Night: Bautista vs. Oliveira",
        date: "2026-02-07T23:00:00Z",
        location: "UFC APEX, Las Vegas, NV",
        fights: [
            {
                id: "fb-main",
                fighterA: { id: "bautista", name: "Mario Bautista", record: "14-2-0" },
                fighterB: { id: "v-oliveira", name: "Vinicius Oliveira", record: "21-4-0" },
                division: "Bantamweight",
                rounds: 5,
                isMainEvent: true,
                isMainCard: true,
                status: "FINISHED",
                winnerId: "bautista", method: "SUBMISSION", round: 2, time: "4:46"
            },
            {
                id: "fb-comain",
                fighterA: { id: "horiguchi", name: "Kyoji Horiguchi", record: "35-5-0" },
                fighterB: { id: "albazi", name: "Amir Albazi", record: "17-2-0" },
                division: "Flyweight",
                rounds: 3,
                isMainEvent: false,
                isCoMainEvent: true,
                isMainCard: true,
                status: "FINISHED",
                winnerId: "horiguchi", method: "DECISION"
            },
            {
                id: "fb-3",
                fighterA: { id: "kuniev", name: "Rizvan Kuniev", record: "14-1-0" },
                fighterB: { id: "almeida", name: "Jailton Almeida", record: "20-4-0" },
                division: "Heavyweight",
                rounds: 3,
                isMainEvent: false,
                isMainCard: true,
                status: "FINISHED",
                winnerId: "kuniev", method: "DECISION"
            },
            {
                id: "fb-4",
                fighterA: { id: "oleksiejczuk", name: "Michal Oleksiejczuk", record: "19-8-0" },
                fighterB: { id: "barriault", name: "Marc-André Barriault", record: "16-8-0" },
                division: "Middleweight",
                rounds: 3,
                isMainEvent: false,
                isMainCard: true,
                status: "FINISHED",
                winnerId: "oleksiejczuk", method: "DECISION"
            },
            {
                id: "fb-5",
                fighterA: { id: "f-basharat", name: "Farid Basharat", record: "12-1-0" },
                fighterB: { id: "matsumoto", name: "Jean Matsumoto", record: "16-1-0" },
                division: "Bantamweight",
                rounds: 3,
                isMainEvent: false,
                isMainCard: true,
                status: "FINISHED",
                winnerId: "f-basharat", method: "DECISION"
            },
            {
                id: "fb-6",
                fighterA: { id: "jacoby", name: "Dustin Jacoby", record: "20-8-1" },
                fighterB: { id: "walker", name: "Julius Walker", record: "5-1-0" },
                division: "Light Heavyweight",
                rounds: 3,
                isMainEvent: false,
                isMainCard: true,
                status: "FINISHED",
                winnerId: "jacoby", method: "KO/TKO", round: 2, time: "1:42"
            },
            // Prelims
            {
                id: "fb-p1",
                fighterA: { id: "donchenko", name: "Daniil Donchenko", record: "16-3-0" },
                fighterB: { id: "morono", name: "Alex Morono", record: "24-12-0" },
                division: "Welterweight",
                rounds: 3,
                isMainEvent: false,
                isMainCard: false,
                status: "FINISHED",
                winnerId: "donchenko", method: "DECISION"
            },
            {
                id: "fb-p2",
                fighterA: { id: "veretennikov", name: "Nikolay Veretennikov", record: "14-4-0" },
                fighterB: { id: "price", name: "Niko Price", record: "15-8-0" },
                division: "Welterweight",
                rounds: 3,
                isMainEvent: false,
                isMainCard: false,
                status: "FINISHED",
                winnerId: "veretennikov", method: "KO/TKO", round: 1, time: "1:42"
            },
        ]
    },

    // ---- UPCOMING EVENT (scheduled, no results) ----
    {
        id: "ufn-strickland-hernandez",
        name: "UFC Fight Night: Strickland vs. Hernandez",
        date: "2026-02-22T01:00:00Z",
        location: "Toyota Center, Houston, TX",
        fights: [
            {
                id: "fs-main",
                fighterA: { id: "strickland", name: "Sean Strickland", record: "29-6-0" },
                fighterB: { id: "hernandez", name: "Anthony Hernandez", record: "14-2-0" },
                division: "Middleweight",
                rounds: 5,
                isMainEvent: true,
                isMainCard: true,
                status: "SCHEDULED"
            },
            {
                id: "fs-comain",
                fighterA: { id: "neal", name: "Geoff Neal", record: "16-5-0" },
                fighterB: { id: "medic", name: "Uroš Medić", record: "9-2-0" },
                division: "Welterweight",
                rounds: 3,
                isMainEvent: false,
                isCoMainEvent: true,
                isMainCard: true,
                status: "SCHEDULED"
            },
            {
                id: "fs-3",
                fighterA: { id: "ige", name: "Dan Ige", record: "18-8-0" },
                fighterB: { id: "costa", name: "Melquizael Costa", record: "12-1-0" },
                division: "Featherweight",
                rounds: 3,
                isMainEvent: false,
                isMainCard: true,
                status: "SCHEDULED"
            },
            {
                id: "fs-4",
                fighterA: { id: "spivac", name: "Serghei Spivac", record: "16-4-0" },
                fighterB: { id: "delija", name: "Ante Delija", record: "25-6-0" },
                division: "Heavyweight",
                rounds: 3,
                isMainEvent: false,
                isMainCard: true,
                status: "SCHEDULED"
            },
            {
                id: "fs-5",
                fighterA: { id: "reese", name: "Zach Reese", record: "8-1-0" },
                fighterB: { id: "pereira-m", name: "Michel Pereira", record: "31-11-0" },
                division: "Middleweight",
                rounds: 3,
                isMainEvent: false,
                isMainCard: true,
                status: "SCHEDULED"
            },
            {
                id: "fs-6",
                fighterA: { id: "j-smith", name: "Jacobe Smith", record: "8-1-0" },
                fighterB: { id: "harrell", name: "Josiah Harrell", record: "6-0-0" },
                division: "Welterweight",
                rounds: 3,
                isMainEvent: false,
                isMainCard: true,
                status: "SCHEDULED"
            },
            // Prelims
            {
                id: "fs-p1",
                fighterA: { id: "njokuani", name: "Chidi Njokuani", record: "24-9-0" },
                fighterB: { id: "leal", name: "Carlos Leal", record: "23-4-0" },
                division: "Welterweight",
                rounds: 3,
                isMainEvent: false,
                isMainCard: false,
                status: "SCHEDULED"
            },
            {
                id: "fs-p2",
                fighterA: { id: "osbourne", name: "Ode Osbourne", record: "12-7-0" },
                fighterB: { id: "idiris", name: "Alibi Idiris", record: "4-0-0" },
                division: "Flyweight",
                rounds: 3,
                isMainEvent: false,
                isMainCard: false,
                status: "SCHEDULED"
            },
        ]
    }
];

// ============================================================================
// USERS
// ============================================================================

export const MOCK_USERS: User[] = [
    { id: "me", username: "You" },
    { id: "u1", username: "AlexVolk" },
    { id: "u2", username: "IzzyStyle" },
    { id: "u3", username: "DoBronxs" },
    { id: "u4", username: "Poatan" },
];

// ============================================================================
// MOCK BETS — Pre-seeded picks for the PAST event (league l1)
// Key format: "leagueId:fightId"
// ============================================================================



export const MOCK_USER_BETS: MockUserBet[] = [
    // "me" picks for past event
    { leagueId: "l1", fightId: "fb-main", userId: "me", winnerId: "bautista", method: "SUBMISSION", round: 2 },  // ✅ perfect
    { leagueId: "l1", fightId: "fb-comain", userId: "me", winnerId: "horiguchi", method: "DECISION" },           // ✅ winner + method
    { leagueId: "l1", fightId: "fb-3", userId: "me", winnerId: "almeida", method: "SUBMISSION" },                                       // ❌ wrong winner
    { leagueId: "l1", fightId: "fb-4", userId: "me", winnerId: "oleksiejczuk", method: "KO/TKO" },                // ✅ winner only (wrong method)
    { leagueId: "l1", fightId: "fb-5", userId: "me", winnerId: "f-basharat", method: "DECISION" },                // ✅ winner + method
    { leagueId: "l1", fightId: "fb-6", userId: "me", winnerId: "jacoby", method: "KO/TKO", round: 2 },           // ✅ perfect
    { leagueId: "l1", fightId: "fb-p1", userId: "me", winnerId: "morono" },                                       // ❌ wrong winner
    { leagueId: "l1", fightId: "fb-p2", userId: "me", winnerId: "veretennikov", method: "KO/TKO" },               // ✅ winner + method

    // AlexVolk picks
    { leagueId: "l1", fightId: "fb-main", userId: "u1", winnerId: "v-oliveira", method: "DECISION" },
    { leagueId: "l1", fightId: "fb-comain", userId: "u1", winnerId: "albazi", method: "DECISION" },
    { leagueId: "l1", fightId: "fb-3", userId: "u1", winnerId: "kuniev", method: "DECISION" },                    // ✅ perfect
    { leagueId: "l1", fightId: "fb-4", userId: "u1", winnerId: "oleksiejczuk", method: "DECISION" },              // ✅ perfect
    { leagueId: "l1", fightId: "fb-5", userId: "u1", winnerId: "matsumoto", method: "KO/TKO" },
    { leagueId: "l1", fightId: "fb-6", userId: "u1", winnerId: "jacoby", method: "DECISION" },
    { leagueId: "l1", fightId: "fb-p1", userId: "u1", winnerId: "donchenko" },
    { leagueId: "l1", fightId: "fb-p2", userId: "u1", winnerId: "price" },

    // IzzyStyle picks
    { leagueId: "l1", fightId: "fb-main", userId: "u2", winnerId: "bautista", method: "DECISION" },
    { leagueId: "l1", fightId: "fb-comain", userId: "u2", winnerId: "horiguchi", method: "KO/TKO" },
    { leagueId: "l1", fightId: "fb-3", userId: "u2", winnerId: "almeida", method: "SUBMISSION" },
    { leagueId: "l1", fightId: "fb-4", userId: "u2", winnerId: "barriault", method: "KO/TKO" },
    { leagueId: "l1", fightId: "fb-5", userId: "u2", winnerId: "f-basharat", method: "KO/TKO" },
    { leagueId: "l1", fightId: "fb-6", userId: "u2", winnerId: "walker", method: "KO/TKO" },
    { leagueId: "l1", fightId: "fb-p1", userId: "u2", winnerId: "donchenko", method: "KO/TKO" },
    { leagueId: "l1", fightId: "fb-p2", userId: "u2", winnerId: "veretennikov", method: "KO/TKO", round: 1 },    // ✅ perfect
];

// ============================================================================
// LEADERBOARD (kept for backward compat but will be computed per-event)
// ============================================================================

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
    { userId: "me", user: { id: "me", username: "You" }, points: 90, betsPlaced: 8, perfectPicks: 2 },
    { userId: "u1", user: { id: "u1", username: "AlexVolk" }, points: 55, betsPlaced: 8, perfectPicks: 2 },
    { userId: "u2", user: { id: "u2", username: "IzzyStyle" }, points: 45, betsPlaced: 8, perfectPicks: 1 },
];
