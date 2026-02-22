import { useParams, Link } from "react-router-dom";
import { useLeague, useLeagueStandings } from "@/hooks/useLeagues";
import { EventSkeleton } from "@/components/skeletons/EventSkeleton";
import { Fight, Bet, BetDTO, Event as ApiEvent } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Copy, Trophy, ChevronRight, ChevronLeft, MapPin, Target, Check, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { VegasFightCard, FightCardPick } from "@/components/FightCard";
import { useEvents } from "@/hooks/useEvents";
import { useBets, usePlaceBet, useRemoveBet } from "@/hooks/useBets";
import { useAuth } from "@/context/AuthContext";
import { useGameRealtime } from "@/hooks/useGameRealtime";
import { createPortal } from "react-dom";


// ============================================================================
// Fight Card with league-scoped bets
// ============================================================================

function LeagueFightCard({ fight, leagueId, locked, lockAt, myBets, onPlaceBet, onRemoveBet }: { fight: Fight; leagueId: string; locked: boolean; lockAt?: string | null; myBets: Bet[]; onPlaceBet: (bet: BetDTO) => void; onRemoveBet: (betId: string) => void }) {

    const liveBet = myBets.find(b => b.fightId === fight.id);
    const bet = liveBet;

    const value = bet ? { winnerId: bet.winnerId, method: bet.method as FightCardPick["method"], round: bet.round } : null;

    return (
        <VegasFightCard
            fight={fight}
            mode="full"
            value={value}
            locked={locked}
            lockAt={lockAt}
            onPickChange={locked ? undefined : (pick) => {
                if (!pick) {
                    if (bet && bet.id) {
                        onRemoveBet(bet.id);
                    }
                    return;
                }

                // VALIDATION: Only place bet via API if complete
                // Fighter + Method + Round (not required when method is decision)
                const isMethodDecision = pick.method === 'DECISION';
                const isComplete = pick.winnerId && pick.method && (isMethodDecision || pick.round);

                if (isComplete) {
                    onPlaceBet({ leagueId, fightId: fight.id, winnerId: pick.winnerId, method: pick.method, round: pick.round });
                }
            }}
        />
    );
}

// ============================================================================
// Main — Fight Night Hub (Unified View)
// ============================================================================
// Event Hero Banner (Extracted for performance)
// ============================================================================
function EventHeroBanner({ events, safeEventIdx, setEventIdx, isFinished }: { events: ApiEvent[]; safeEventIdx: number; setEventIdx: (idx: number) => void; isFinished: boolean }) {
    const event = events[safeEventIdx];

    return (
        <div
            className="rounded-2xl bg-zinc-950 border border-zinc-800 relative z-10 w-full overflow-hidden h-64 sm:h-80"
        >
            {event.eventImg ? (
                <div className="absolute inset-0 w-full h-full flex justify-center items-center pointer-events-none">
                    <img
                        src={event.eventImg}
                        alt={event.name}
                        className="w-full mix-blend-screen opacity-70 object-cover"
                    />
                    <div
                        className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"
                    />
                </div>
            ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-900/50 to-zinc-950 z-0 pointer-events-none" />
            )}

            <div
                className="relative z-20 w-full h-full flex justify-between p-6 sm:p-8 items-end"
            >
                {/* Prev Button */}
                <button
                    onClick={() => setEventIdx(Math.max(0, safeEventIdx - 1))}
                    disabled={safeEventIdx === 0}
                    className="hidden sm:flex flex-col items-start gap-1 p-3 rounded-lg bg-zinc-950/40 hover:bg-zinc-900/80 backdrop-blur-sm border border-transparent hover:border-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent text-left group transition-all"
                >
                    <div className="flex items-center gap-1 text-zinc-400 group-hover:text-white transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                        <span className="text-xs uppercase font-extrabold tracking-wider">Previous</span>
                    </div>
                    {safeEventIdx > 0 && (
                        <span className="text-xs font-bold text-zinc-600 group-hover:text-zinc-400">
                            {events[safeEventIdx - 1]?.name.split(":")[0]}
                        </span>
                    )}
                </button>

                {/* Mobile Prev */}
                <button
                    onClick={() => setEventIdx(Math.max(0, safeEventIdx - 1))}
                    disabled={safeEventIdx === 0}
                    className="sm:hidden p-2.5 rounded-full bg-zinc-950/60 backdrop-blur-md border border-zinc-700 disabled:opacity-30 text-white"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                {/* Center Content */}
                <div
                    className="text-center flex flex-col items-center justify-center flex-1 h-full max-w-[60%] mt-auto"
                >
                    {isFinished ? (
                        <Badge variant="outline" className="bg-zinc-800/80 text-zinc-400 border-zinc-700 backdrop-blur-md shadow-lg shadow-black/50 mb-2">COMPLETED</Badge>
                    ) : (
                        <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 backdrop-blur-md shadow-lg shadow-black/50 mb-2">LIVE NOW</Badge>
                    )}

                    <h2
                        className="font-black italic tracking-tighter uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] w-full text-2xl sm:text-4xl leading-tight"
                    >
                        {event.name.split(":")[0]}
                    </h2>
                    <p
                        className="text-zinc-300 font-medium drop-shadow-md w-full text-sm sm:text-base mt-2"
                    >
                        {event.name.split(":")[1]?.trim()}
                    </p>

                    <div className="items-center justify-center gap-3 text-xs text-zinc-500 flex pt-3">
                        <div className="flex items-center gap-1 whitespace-nowrap">
                            <MapPin className="h-3 w-3" />
                            <span>{event.location}</span>
                        </div>
                    </div>
                </div>

                {/* Next Button */}
                <button
                    onClick={() => setEventIdx(Math.min(events.length - 1, safeEventIdx + 1))}
                    disabled={safeEventIdx === events.length - 1}
                    className="hidden sm:flex flex-col items-end gap-1 p-3 rounded-lg bg-zinc-950/40 hover:bg-zinc-900/80 backdrop-blur-sm border border-transparent hover:border-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent text-right group transition-all"
                >
                    <div className="flex items-center gap-1 text-zinc-400 group-hover:text-white transition-colors">
                        <span className="text-xs uppercase font-extrabold tracking-wider">Next</span>
                        <ChevronRight className="h-5 w-5" />
                    </div>
                    {safeEventIdx < events.length - 1 && (
                        <span className="text-xs font-bold text-zinc-600 group-hover:text-zinc-400">
                            {events[safeEventIdx + 1]?.name.split(":")[0]}
                        </span>
                    )}
                </button>

                {/* Mobile Next */}
                <button
                    onClick={() => setEventIdx(Math.min(events.length - 1, safeEventIdx + 1))}
                    disabled={safeEventIdx === events.length - 1}
                    className="sm:hidden p-2.5 rounded-full bg-zinc-950/60 backdrop-blur-md border border-zinc-700 disabled:opacity-30 text-white"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}

export function LeagueDashboard() {
    const { leagueId } = useParams();
    const { user } = useAuth();
    const { data: league, isLoading: leagueLoading } = useLeague(leagueId || "");
    const { data: events, isLoading: eventsLoading, error: eventsError } = useEvents();

    // Betting Hooks
    const { data: allBets } = useBets(leagueId || "");
    // const { data: myBets } = useMyBets(leagueId || ""); // Removed redundant hook
    const { mutate: placeBet } = usePlaceBet();
    const { mutate: removeBet } = useRemoveBet();
    const { data: leagueStandings } = useLeagueStandings(leagueId || "");

    // Realtime updates
    useGameRealtime(leagueId);

    // Derive myBets from allBets
    // Fallback to "me" if no authentic user (mock mode), or just use user.id
    const currentUserId = user?.id || "me";
    const myBets = allBets?.filter(b => b.userId === currentUserId || b.userId === "me"); // "me" for mock compat

    // Default to last event if available, otherwise 0
    const [eventIdx, setEventIdx] = useState(0);
    const [showAllStandings, setShowAllStandings] = useState(false);

    if (eventsLoading || leagueLoading) {
        return <EventSkeleton />;
    }

    if (eventsError) {
        return <div className="text-center text-red-500 py-10">Failed to load events.</div>;
    }

    if (!league) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">League not found</h2>
                <Link to="/leagues">
                    <Button variant="link" className="mt-4">Back to Leagues</Button>
                </Link>
            </div>
        );
    }

    if (!events || events.length === 0) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">No events scheduled</h2>
                <Link to="/leagues">
                    <Button variant="link" className="mt-4">Back to Leagues</Button>
                </Link>
            </div>
        );
    }

    // Ensure index is valid
    const safeEventIdx = Math.min(eventIdx, events.length - 1);
    const event = events[safeEventIdx];

    // Helper to check if event is finished (if status exists, otherwise calculate)
    const isFinished = event.status === "FINISHED";
    const hasStarted = isFinished || (event.fights || []).some(f => f.status === "FINISHED");
    const locked = isFinished;

    const copyCode = () => {
        if (!league) return;
        navigator.clipboard.writeText(league.code);
        toast.success("Invite code copied!");
    };

    const defaultSettings = { winner: 10, method: 5, round: 5, decision: 0 };
    const settings = { ...defaultSettings, ...(league.scoringSettings as object || {}) };

    // Use backend standings
    const standings = leagueStandings || [];

    const myStanding = standings.find((s: any) => s.userId === "me" || s.userId === user?.id);
    const myRank = myStanding?.rank || (standings.findIndex((s: any) => s.userId === (user?.id || "me")) + 1);

    // User display name helper
    const getUserName = (userId: string) => {
        if (userId === "me" || userId === user?.id) return "You";
        const member = league.members?.find(m => m.userId === userId);
        return member?.user?.username || userId;
    };

    const mainCardFights = (event.fights || []).filter(f => f.isMainCard);
    const prelimFights = (event.fights || []).filter(f => !f.isMainCard);

    // Per-section stats for "me"
    const computeSectionStats = (fights: Fight[]) => {
        const myBetsList = allBets?.filter(b => b.leagueId === league.id && b.userId === currentUserId) || [];

        let points = 0;
        let correct = 0;
        const finished = fights.filter(f => f.status === "FINISHED" && f.winnerId);
        for (const fight of finished) {
            const bet = myBetsList.find(b => b.fightId === fight.id);
            if (!bet || !fight.winnerId) continue;
            if (bet.winnerId === fight.winnerId) {
                correct++;
                points += settings.winner;
                if (bet.method === fight.method) {
                    points += settings.method;
                    if (bet.method === "DECISION") points += settings.decision;
                    else if (bet.round === fight.round) points += settings.round;
                }
            }
        }
        return { points, correct, total: fights.length };
    };
    const mainStats = computeSectionStats(mainCardFights);
    const prelimsStats = computeSectionStats(prelimFights);

    const visibleStandings = showAllStandings ? standings : standings.slice(0, 5);
    const hasMoreStandings = standings.length > 5;

    const portalTarget = document.getElementById("header-center-portal");

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* League Header Portal */}
            {portalTarget && createPortal(
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 mx-auto overflow-hidden">
                    <Link to="/leagues" className="hidden sm:block">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2 max-w-[200px] sm:max-w-[400px]">
                        <h1 className="text-base sm:text-xl font-extrabold tracking-tight truncate">{league.name}</h1>
                        <Badge variant="outline" className="font-mono text-[10px] hidden md:inline-flex cursor-pointer hover:bg-muted shrink-0" onClick={copyCode}>
                            {league.code} <Copy className="ml-1 h-3 w-3 inline" />
                        </Badge>
                    </div>
                </div>,
                portalTarget
            )}

            <EventHeroBanner
                events={events}
                safeEventIdx={safeEventIdx}
                setEventIdx={setEventIdx}
                isFinished={isFinished}
            />

            {/* Stat Cards */}
            {hasStarted && myStanding && (
                <div className="grid grid-cols-3 gap-2">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-3 text-center">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold">Your Rank</p>
                            <p className="text-2xl font-black text-red-500">#{myRank}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-3 text-center">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold">Points</p>
                            <p className="text-2xl font-black">{myStanding.points}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-3 text-center">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold">Correct</p>
                            <p className="text-2xl font-black">{myStanding.correct}<span className="text-sm text-zinc-500">/{(event.fights || []).length}</span></p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ===== STANDINGS TABLE ===== */}
            {hasStarted && (
                <div className="rounded-xl border border-zinc-800 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-950/50 border-b border-zinc-800">
                        <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Standings</span>
                    </div>
                    {visibleStandings.map((s, idx) => (
                        <div key={s.userId} className={cn(
                            "flex items-center gap-2 px-3 py-2 border-b border-zinc-800/50",
                            s.userId === "me" && "bg-red-600/5"
                        )}>
                            <span className="text-xs w-5">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}</span>
                            <span className={cn("text-xs font-bold flex-1", s.userId === "me" ? "text-red-400" : "text-zinc-300")}>
                                {(s.userId === "me" || s.userId === user?.id) ? "You" : (s.username || getUserName(s.userId))}
                            </span>
                            <span className="text-[10px] text-zinc-600">{s.correct}/{s.total} correct</span>
                            <span className="font-black text-sm w-8 text-right">{s.points}</span>
                        </div>
                    ))}
                    {hasMoreStandings && (
                        <button
                            onClick={() => setShowAllStandings(!showAllStandings)}
                            className="w-full px-3 py-2 text-[10px] font-semibold text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors flex items-center justify-center gap-1"
                        >
                            {showAllStandings ? "Show less" : `Show more (${standings.length - 5})`}
                            <ChevronDown className={cn("h-3 w-3 transition-transform", showAllStandings && "rotate-180")} />
                        </button>
                    )}
                </div>
            )}

            {/* ===== MY PICKS SUMMARY (Dot Matrix Grid) ===== */}
            {hasStarted && (
                <div className="rounded-xl border border-zinc-800 overflow-hidden">
                    <button className="w-full flex items-center gap-2 px-3 py-2.5 bg-zinc-950/50 border-b border-zinc-800 cursor-default">
                        <Target className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">My Picks</span>
                        <div className="flex-1" />
                        {(() => {
                            // Compute localized pick stats for "me"
                            const completedFights = (event.fights || []).filter(f => f.status === "FINISHED" && f.winnerId);

                            type PickStat = { points: number; winnerCorrect: boolean; isPerfect: boolean };

                            // Use myBets from hook
                            const myBetsList = allBets?.filter(b => b.leagueId === league.id && b.userId === currentUserId) || [];

                            const myPicksData = completedFights.map(fight => {
                                const bet = myBetsList.find(b => b.fightId === fight.id);
                                if (!bet || !fight.winnerId) return null;

                                const winnerCorrect = bet.winnerId === fight.winnerId;
                                const methodCorrect = winnerCorrect && bet.method === fight.method;
                                const roundCorrect = methodCorrect && bet.method !== "DECISION" && bet.method !== "DRAW" && bet.round === fight.round;
                                const isDecisionPerfect = methodCorrect && (bet.method === "DECISION" || bet.method === "DRAW");

                                let points = 0;
                                if (winnerCorrect) {
                                    points += settings.winner;
                                    if (methodCorrect) {
                                        points += settings.method;
                                        if (isDecisionPerfect) points += settings.decision;
                                        else if (roundCorrect) points += settings.round;
                                    }
                                }

                                const isPerfect = isDecisionPerfect || roundCorrect;

                                return { points, winnerCorrect, isPerfect };
                            }).filter((item): item is PickStat => item !== null);

                            return (
                                <>
                                    <div className="flex items-center gap-1 mr-2">
                                        {myPicksData.map((p, i) => (
                                            <div key={i} className={cn(
                                                "w-2 h-2 rounded-full",
                                                p.isPerfect ? "bg-green-500" :
                                                    p.points >= settings.winner ? "bg-yellow-500" :
                                                        p.winnerCorrect ? "bg-yellow-500/50" : "bg-red-500/50"
                                            )} />
                                        ))}
                                    </div>
                                    <span className="text-xs font-black text-yellow-500">
                                        {myPicksData.reduce((acc, curr) => acc + curr.points, 0)}
                                    </span>
                                </>
                            );
                        })()}
                    </button>

                    <div>
                        <div className="flex items-center gap-3 px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-zinc-700 border-b border-zinc-800/50">
                            <span className="w-2 shrink-0" />
                            <span className="w-28 sm:w-32 font-bold">Fight</span>
                            <span className="flex-1 pl-2">Result</span>
                            <span className="w-14 text-center">Win</span>
                            <span className="w-14 text-center">Method</span>
                            <span className="w-14 text-center">Round</span>
                            <span className="w-14 text-right">Points</span>
                        </div>
                        {(() => {
                            const completedFights = (event.fights || []).filter(f => f.status === "FINISHED" && f.winnerId);
                            // Use myBets from hook
                            const myBetsList = allBets?.filter(b => b.leagueId === league.id && b.userId === currentUserId) || [];

                            return completedFights.map((fight) => {
                                const bet = myBetsList.find(b => b.fightId === fight.id);
                                if (!bet || !fight.winnerId) return null;

                                const winnerCorrect = bet.winnerId === fight.winnerId;
                                const methodCorrect = winnerCorrect && bet.method === fight.method;
                                const roundCorrect = methodCorrect && bet.method !== "DECISION" && bet.method !== "DRAW" && bet.round === fight.round;
                                const isDecisionPerfect = methodCorrect && (bet.method === "DECISION" || bet.method === "DRAW");

                                let points = 0;
                                if (winnerCorrect) {
                                    points += settings.winner;
                                    if (methodCorrect) {
                                        points += settings.method;
                                        if (isDecisionPerfect) points += settings.decision;
                                        else if (roundCorrect) points += settings.round;
                                    }
                                }

                                const isPerfect = isDecisionPerfect || roundCorrect;
                                const winnerName = fight.winnerId === fight.fighterA.id ? fight.fighterA.name : fight.fighterB.name;
                                // Clear, non-abbreviated result text
                                const resultText = `${winnerName} by ${fight.method}${fight.round ? ` (Round ${fight.round})` : ""}`;

                                return (
                                    <div key={fight.id} className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/30 text-[10px]",
                                        isPerfect && "bg-green-500/5"
                                    )}>
                                        <div className={cn(
                                            "w-2 h-2 rounded-full shrink-0",
                                            isPerfect ? "bg-green-500" :
                                                points >= settings.winner ? "bg-yellow-500" :
                                                    winnerCorrect ? "bg-yellow-500/50" : "bg-red-500/50"
                                        )} />
                                        <span className="w-28 sm:w-32 text-zinc-300 truncate font-medium">
                                            {fight.fighterA.name.split(" ").pop()} vs {fight.fighterB.name.split(" ").pop()}
                                        </span>
                                        <span className="flex-1 text-zinc-500 text-[9px] truncate pl-2" title={resultText}>
                                            {resultText}
                                        </span>
                                        <span className="w-14 flex justify-center">
                                            {winnerCorrect
                                                ? <Check className="h-3 w-3 text-green-500" />
                                                : <X className="h-3 w-3 text-red-500" />}
                                        </span>
                                        <span className="w-14 flex justify-center">
                                            {methodCorrect
                                                ? <Check className="h-3 w-3 text-green-500" />
                                                : winnerCorrect && bet.method
                                                    ? <X className="h-3 w-3 text-red-400/50" />
                                                    : <span className="text-zinc-800">—</span>}
                                        </span>
                                        <span className="w-14 flex justify-center">
                                            {isDecisionPerfect
                                                ? <span className="text-zinc-500">—</span>
                                                : roundCorrect
                                                    ? <Check className="h-3 w-3 text-green-500" />
                                                    : methodCorrect && bet.round
                                                        ? <X className="h-3 w-3 text-red-400/50" />
                                                        : <span className="text-zinc-800">—</span>}
                                        </span>
                                        <span className={cn(
                                            "w-14 text-right font-bold",
                                            isPerfect ? "text-green-400" : points > 0 ? "text-yellow-400" : "text-zinc-700"
                                        )}>+{points}</span>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}


            {/* ===== LOCKED BANNER ===== */}
            {locked && (
                <div className="text-center text-xs text-zinc-500 bg-zinc-900/50 border border-zinc-800 rounded-lg py-2">
                    🔒 This event is finished — your picks are locked
                </div>
            )}

            {/* ===== FIGHT CARDS (TABS) ===== */}
            <Tabs defaultValue="main" className="w-full">
                <TabsList className="w-full flex bg-transparent border-b border-zinc-800/50 p-0 rounded-none h-auto">
                    <TabsTrigger
                        value="main"
                        className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-red-500 data-[state=active]:shadow-none data-[state=inactive]:opacity-60 border-b-2 border-transparent rounded-none py-4 transition-all"
                    >
                        <div className="flex flex-col items-center gap-1.5">
                            <span className="font-bold uppercase tracking-widest text-xs">Main Card</span>
                            <div className="flex items-center justify-center gap-2 sm:gap-3 text-[10px] font-medium text-zinc-400">
                                <span>{mainCardFights.length} fights</span>
                                {hasStarted && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-1"><Target className="h-3 w-3" />{mainStats.correct}/{mainStats.total}</span>
                                            <span className="flex items-center gap-1 text-yellow-500"><Trophy className="h-3 w-3" />{mainStats.points}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </TabsTrigger>
                    {prelimFights.length > 0 && (
                        <TabsTrigger
                            value="prelims"
                            className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-red-500 data-[state=active]:shadow-none data-[state=inactive]:opacity-60 border-b-2 border-transparent rounded-none py-4 transition-all"
                        >
                            <div className="flex flex-col items-center gap-1.5">
                                <span className="font-bold uppercase tracking-widest text-xs">Prelims</span>
                                <div className="flex items-center justify-center gap-2 sm:gap-3 text-[10px] font-medium text-zinc-400">
                                    <span>{prelimFights.length} fights</span>
                                    {hasStarted && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                            <div className="flex items-center gap-2">
                                                <span className="flex items-center gap-1"><Target className="h-3 w-3" />{prelimsStats.correct}/{prelimsStats.total}</span>
                                                <span className="flex items-center gap-1 text-yellow-500"><Trophy className="h-3 w-3" />{prelimsStats.points}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="main" className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {mainCardFights.map(fight => (
                        <LeagueFightCard
                            key={fight.id}
                            fight={fight}
                            leagueId={league.id}
                            locked={locked || fight.status === "FINISHED"}
                            lockAt={fight.isPrelim ? event.prelimsStartAt : event.mainCardStartAt}
                            myBets={myBets || []}
                            onPlaceBet={placeBet}
                            onRemoveBet={removeBet}
                        />
                    ))}
                </TabsContent>

                {prelimFights.length > 0 && (
                    <TabsContent value="prelims" className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {prelimFights.map(fight => (
                            <LeagueFightCard
                                key={fight.id}
                                fight={fight}
                                leagueId={league.id}
                                locked={locked || fight.status === "FINISHED"}
                                lockAt={(fight.isPrelim ? event.prelimsStartAt : event.mainCardStartAt) || event.date}
                                myBets={myBets || []}
                                onPlaceBet={placeBet}
                                onRemoveBet={removeBet}
                            />
                        ))}
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
