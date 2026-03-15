import { useAuth } from "@/context/AuthContext";
import { useLeague, useLeagueStandings } from "@/hooks/useLeagues";
import { useBets } from "@/hooks/useBets";
import { useEvents } from "@/hooks/useEvents";
import type { Bet, Fight, ScoringSettings } from "@/types/api";

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

    // Enrich standings with perfect picks, sort by points → perfect → correct
    const standings = [...(rawStandings ?? [])].map(s => {
        const userBets = (allBets ?? []).filter(b => b.leagueId === leagueId && b.userId === s.userId);
        const perfect  = finishedFights.reduce((acc, fight) => {
            const bet = userBets.find(b => b.fightId === fight.id);
            if (!bet || bet.winnerId !== fight.winnerId || bet.method !== fight.method) return acc;
            const isDecision = bet.method === "DECISION" || bet.method === "DRAW";
            return (isDecision || bet.round === fight.round) ? acc + 1 : acc;
        }, 0);
        return { ...s, perfect };
    }).sort((a, b) => {
        if (b.points  !== a.points)  return b.points  - a.points;
        if (b.perfect !== a.perfect) return b.perfect - a.perfect;
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
