import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Bet {
    leagueId: string;
    fightId: string;
    winnerId: string;
    method?: 'KO/TKO' | 'SUBMISSION' | 'DECISION';
    round?: number;
}

interface BetsState {
    bets: Record<string, Bet>; // Keyed by "leagueId:fightId"
    placeBet: (bet: Bet) => void;
    removeBet: (leagueId: string, fightId: string) => void;
    getBet: (leagueId: string, fightId: string) => Bet | undefined;
}

function betKey(leagueId: string, fightId: string) {
    return `${leagueId}:${fightId}`;
}

export const useBets = create<BetsState>()(
    persist(
        (set, get) => ({
            bets: {},
            placeBet: (bet) => set((state) => ({
                bets: { ...state.bets, [betKey(bet.leagueId, bet.fightId)]: bet }
            })),
            removeBet: (leagueId, fightId) => set((state) => {
                const newBets = { ...state.bets };
                delete newBets[betKey(leagueId, fightId)];
                return { bets: newBets };
            }),
            getBet: (leagueId, fightId) => get().bets[betKey(leagueId, fightId)],
        }),
        {
            name: 'octagon-bets-storage',
        }
    )
);
