import { useAuth } from "@/context/AuthContext";
import { useLeague, useLeagueStandings } from "@/hooks/useLeagues";
import { useBets } from "@/hooks/useBets";
import { useEvents } from "@/hooks/useEvents";
import type { Bet, Fight, ScoringSettings } from "@/types/api";
import type { PlayedAtout } from "@/hooks/useAtouts";

export const DEFAULT_SCORING: ScoringSettings = { winner: 10, method: 5, round: 5, decision: 0 };

// ── Scoring helpers ───────────────────────────────────────────────────────────

export function calcFightPoints(
    fight: Fight,
    bet: Bet | undefined,
    settings: ScoringSettings,
) {
    if (!bet || !fight.winnerId) {
        return { points: 0, winnerCorrect: false, methodCorrect: false, roundCorrect: false };
    }
    const winnerCorrect = bet.winnerId === fight.winnerId;
    const methodCorrect = winnerCorrect && bet.method === fight.method;
    const isDecision    = bet.method === "DECISION" || bet.method === "DRAW";
    const roundCorrect  = methodCorrect && !isDecision && bet.round === fight.round;

    let points = 0;
    if (winnerCorrect) {
        points += settings.winner;
        if (methodCorrect) {
            points += settings.method;
            if (isDecision) points += settings.decision ?? 0;
            else if (roundCorrect) points += settings.round;
        }
    }
    return { points, winnerCorrect, methodCorrect, roundCorrect };
}

/** Returns the effective bet for a user after applying INVERSION if present. */
export function getEffectiveBet(
    bet: Bet | undefined,
    fight: Fight,
    atouts: PlayedAtout[],
    userId: string,
): Bet | undefined {
    if (!bet) return bet;
    const inversion = atouts.find(
        a => a.type === "INVERSION" && a.targetUserId === userId && a.fightId === fight.id,
    );
    if (!inversion) return bet;
    const invertedWinnerId =
        bet.winnerId === fight.fighterA.id ? fight.fighterB.id : fight.fighterA.id;
    return { ...bet, winnerId: invertedWinnerId };
}

/** calcFightPoints with full atout effects (INVERSION, DETTE, DOUBLE). */
export function calcFightPointsWithAtouts(
    fight: Fight,
    bet: Bet | undefined,
    atouts: PlayedAtout[],
    userId: string,
    settings: ScoringSettings,
    allBets?: Bet[],
): { points: number; stolenPoints: number; winnerCorrect: boolean; methodCorrect: boolean; roundCorrect: boolean; atoutApplied?: PlayedAtout } {
    // DETTE: target gets 0 — compute what they would have earned to show as "lost"
    const dette = atouts.find(
        a => a.type === "DETTE" && a.targetUserId === userId && a.fightId === fight.id,
    );
    if (dette) {
        const effectiveBetForVictim = getEffectiveBet(bet, fight, atouts, userId);
        const victimResult = calcFightPoints(fight, effectiveBetForVictim, settings);
        const victimDouble = atouts.find(
            a => a.type === "DOUBLE" && a.playedByUserId === userId && a.fightId === fight.id,
        );
        const lostPoints = victimDouble ? victimResult.points * 2 : victimResult.points;
        return { ...victimResult, points: 0, stolenPoints: -lostPoints, atoutApplied: dette };
    }

    // Own bet points (with INVERSION applied)
    const effectiveBet = getEffectiveBet(bet, fight, atouts, userId);
    const inversion = atouts.find(
        a => a.type === "INVERSION" && a.targetUserId === userId && a.fightId === fight.id,
    );
    const ownResult = calcFightPoints(fight, effectiveBet, settings);

    // DOUBLE on own bet
    const double = atouts.find(
        a => a.type === "DOUBLE" && a.playedByUserId === userId && a.fightId === fight.id,
    );
    const ownPoints = double ? ownResult.points * 2 : ownResult.points;

    // DETTE bonus: stolen points added on top of own points
    let stolenPoints = 0;
    let detteAtout: PlayedAtout | undefined;
    const detteIPlayed = atouts.find(
        a => a.type === "DETTE" && a.playedByUserId === userId && a.fightId === fight.id,
    );
    if (detteIPlayed?.targetUserId && allBets) {
        const targetBet = allBets.find(b => b.userId === detteIPlayed.targetUserId && b.fightId === fight.id);
        const effectiveTargetBet = getEffectiveBet(targetBet, fight, atouts, detteIPlayed.targetUserId);
        const { points: baseStolen } = calcFightPoints(fight, effectiveTargetBet, settings);
        const targetDouble = atouts.find(
            a => a.type === "DOUBLE" && a.playedByUserId === detteIPlayed.targetUserId && a.fightId === fight.id,
        );
        stolenPoints = targetDouble ? baseStolen * 2 : baseStolen;
        detteAtout = detteIPlayed;
    }

    const atoutApplied = detteAtout ?? double ?? inversion ?? undefined;
    return { ...ownResult, points: ownPoints + stolenPoints, stolenPoints, atoutApplied };
}

/** How many points the DETTE player steals from their target on a fight. */
export function calcDetteBonus(
    fight: Fight,
    targetBet: Bet | undefined,
    atouts: PlayedAtout[],
    targetUserId: string,
    settings: ScoringSettings,
): number {
    const effectiveBet = getEffectiveBet(targetBet, fight, atouts, targetUserId);
    return calcFightPoints(fight, effectiveBet, settings).points;
}

// ── Main composable ───────────────────────────────────────────────────────────

export function useLeagueData(leagueId: string, eventId?: string) {
    const { user } = useAuth();
    const { data: league, isLoading: leagueLoading } = useLeague(leagueId);
    const { data: events, isLoading: eventsLoading } = useEvents();
    const { data: allBets } = useBets(leagueId);

    const currentUserId = user?.id ?? "";

    // Use provided eventId, otherwise pick the first non-finished event, fallback to last
    const currentEvent = eventId
        ? (events?.find(e => e.id === eventId) ?? events?.find(e => e.status !== "FINISHED") ?? events?.[events.length - 1])
        : (events?.find(e => e.status !== "FINISHED") ?? events?.[events.length - 1]);
    const { data: rawStandings } = useLeagueStandings(leagueId, currentEvent?.id);

    const scoring: ScoringSettings = { ...DEFAULT_SCORING, ...(league?.scoringSettings ?? {}) };

    const fights: Fight[] = currentEvent?.fights ?? [];
    const finishedFights  = fights.filter(f => f.status === "FINISHED" && f.winnerId);

    // Backend already computes standings and excludes members with no bets — just sort
    const standings = [...(rawStandings ?? [])].sort((a, b) => {
            if (b.points  !== a.points)  return b.points  - a.points;
            if ((b.perfectPicks ?? 0) !== (a.perfectPicks ?? 0)) return (b.perfectPicks ?? 0) - (a.perfectPicks ?? 0);
            return b.correct - a.correct;
        });

    const myBets = (allBets ?? []).filter(b => b.userId === currentUserId);

    const getUserName = (userId: string) => {
        if (userId === currentUserId) return "You";
        const member = league?.members?.find(m => m.userId === userId);
        return member?.user?.username ?? userId.slice(0, 8);
    };

    const getBetsForUser = (userId: string) =>
        (allBets ?? []).filter(b => b.userId === userId);

    return {
        league,
        currentEvent,
        fights,
        finishedFights,
        standings,
        allBets: allBets ?? [],
        myBets,
        scoring,
        currentUserId,
        isLoading: leagueLoading || eventsLoading,
        getUserName,
        getBetsForUser,
    };
}
