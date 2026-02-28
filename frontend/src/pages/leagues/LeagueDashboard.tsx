import { useParams, Link } from "react-router-dom";
import { useLeague, useLeagueStandings } from "@/hooks/useLeagues";
import { EventSkeleton } from "@/components/skeletons/EventSkeleton";
import { Fight, Bet, BetDTO, Event as ApiEvent } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Copy, Trophy, ChevronRight, ChevronLeft, MapPin, Target, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
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

    // Default to live/upcoming event if available
    const [eventIdx, setEventIdx] = useState(-1);

    useEffect(() => {
        if (events && events.length > 0 && eventIdx === -1) {
            const nextIdx = events.findIndex(e => e.status !== "FINISHED");
            if (nextIdx !== -1) {
                setEventIdx(nextIdx);
            } else {
                setEventIdx(events.length - 1);
            }
        }
    }, [events, eventIdx]);

    const [showAllStandings, setShowAllStandings] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const activeUserId = selectedUserId || currentUserId;

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
    const safeEventIdx = Math.max(0, Math.min(eventIdx === -1 ? 0 : eventIdx, events.length - 1));
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

    // Calculate perfect picks for everyone first to allow sorting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedStandings = [...(leagueStandings || [])].map((s: any) => {
        let perfect = 0;
        const userBets = allBets?.filter(b => b.leagueId === league.id && b.userId === s.userId) || [];
        const finishedFights = (event?.fights || []).filter(f => f.status === "FINISHED" && f.winnerId);

        finishedFights.forEach(fight => {
            const bet = userBets.find(b => b.fightId === fight.id);
            if (bet && fight.winnerId && bet.winnerId === fight.winnerId && bet.method === fight.method) {
                if (bet.method === "DECISION" || bet.method === "DRAW") {
                    perfect++;
                } else if (bet.round === fight.round) {
                    perfect++;
                }
            }
        });

        return { ...s, perfect };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortedStandings = [...enrichedStandings].sort((a: any, b: any) => {
        if (b.points !== a.points) return b.points - a.points; // 1. Points
        if (b.perfect !== a.perfect) return b.perfect - a.perfect; // 2. Perfect Picks
        return b.correct - a.correct; // 3. Correct Picks
    });

    const displayStandings = [...sortedStandings];

    // Use sortedStandings for navigation to keep it stable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeUserIdx = sortedStandings.findIndex((s: any) => s.userId === activeUserId);

    const handlePrevUser = () => {
        if (activeUserIdx > 0) {
            setSelectedUserId(sortedStandings[activeUserIdx - 1].userId);
        }
    };

    const handleNextUser = () => {
        if (activeUserIdx < sortedStandings.length - 1) {
            setSelectedUserId(sortedStandings[activeUserIdx + 1].userId);
        }
    };


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

    const visibleStandings = showAllStandings ? displayStandings : displayStandings.slice(0, 5);
    const hasMoreStandings = displayStandings.length > 5;

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



            {/* ===== STANDINGS & PICKS TABS ===== */}
            {hasStarted && (
                <Tabs defaultValue="standings" className="w-full">
                    <div className="flex items-center justify-between mb-3 px-1 sm:px-2">
                        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-200 flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            Results & Picks
                        </h2>
                        <TabsList className="bg-zinc-900 border border-zinc-800 h-8">
                            <TabsTrigger value="standings" className="text-[10px] px-3 font-bold uppercase tracking-wider data-[state=active]:bg-zinc-800">Standings</TabsTrigger>
                            <TabsTrigger value="picks" className="text-[10px] px-3 font-bold uppercase tracking-wider data-[state=active]:bg-zinc-800">Explorer</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="standings" className="mt-0">
                        <div className="rounded-xl border border-zinc-800 overflow-hidden">
                            {visibleStandings.map((s, idx) => {
                                const isMe = s.userId === "me" || s.userId === user?.id;
                                return (
                                    <div key={s.userId} className={cn(
                                        "flex items-center gap-2 px-3 py-2 border-b border-zinc-800/50",
                                        isMe && "bg-emerald-600/10 border-emerald-900/50"
                                    )}>
                                        <span className="text-xs w-5">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}</span>
                                        <span className={cn("text-xs font-bold flex-1 truncate", isMe ? "text-emerald-400" : "text-zinc-300")}>
                                            {isMe ? "You" : (s.username || getUserName(s.userId))}
                                        </span>
                                        <div className="flex flex-col items-end shrink-0 mr-3">
                                            <span className="text-[10px] text-zinc-400">Perfect: <strong className="text-emerald-500">{s.perfect}</strong></span>
                                            <span className="text-[9px] text-zinc-600">Correct: {s.correct}/{s.total}</span>
                                        </div>
                                        <span className={cn("font-black text-sm w-10 text-right shrink-0", isMe ? "text-emerald-500" : "")}>{s.points}</span>
                                    </div>
                                );
                            })}
                            {hasMoreStandings && (
                                <button
                                    onClick={() => setShowAllStandings(!showAllStandings)}
                                    className="w-full px-3 py-2 text-[10px] font-semibold text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors flex items-center justify-center gap-1"
                                >
                                    {showAllStandings ? "Show less" : `Show more (${displayStandings.length - 5})`}
                                    <ChevronDown className={cn("h-3 w-3 transition-transform", showAllStandings && "rotate-180")} />
                                </button>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="picks" className="mt-0">
                        {/* ===== MY PICKS SUMMARY (Side-by-Side Timeline) ===== */}
                        <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950 flex flex-col">

                            {/* Card Header with Player Selector */}
                            <div className="w-full flex items-center px-4 py-3 bg-zinc-900/50 border-b border-zinc-800">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Target className="h-4 w-4 text-zinc-400 shrink-0" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-300 truncate" title={activeUserId === currentUserId ? "My Picks" : `${getUserName(activeUserId)}'s Picks`}>
                                        {activeUserId === currentUserId ? "My Picks" : `${getUserName(activeUserId)}'s Picks`}
                                    </span>
                                </div>

                                <div className="flex items-center justify-center shrink-0">
                                    {sortedStandings.length > 1 ? (
                                        <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
                                            <button
                                                onClick={handlePrevUser}
                                                disabled={activeUserIdx <= 0}
                                                className="p-1.5 hover:bg-zinc-800 rounded disabled:opacity-30 transition-colors cursor-pointer"
                                            >
                                                <ChevronLeft className="h-4 w-4 text-zinc-400" />
                                            </button>
                                            <span className="text-[10px] font-bold text-zinc-500 px-2 text-center min-w-[40px]">
                                                {activeUserIdx >= 0 ? `${activeUserIdx + 1} / ${sortedStandings.length}` : '-'}
                                            </span>
                                            <button
                                                onClick={handleNextUser}
                                                disabled={activeUserIdx >= sortedStandings.length - 1 || activeUserIdx === -1}
                                                className="p-1.5 hover:bg-zinc-800 rounded disabled:opacity-30 transition-colors cursor-pointer"
                                            >
                                                <ChevronRight className="h-4 w-4 text-zinc-400" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-[102px]"></div>
                                    )}
                                </div>

                                <div className="flex items-center justify-end flex-1 min-w-0">
                                    {(() => {
                                        const completedFights = (event.fights || []).filter(f => f.status === "FINISHED" && f.winnerId);
                                        const myBetsList = allBets?.filter(b => b.leagueId === league.id && b.userId === activeUserId) || [];

                                        let totalPoints = 0;
                                        completedFights.forEach(fight => {
                                            const bet = myBetsList.find(b => b.fightId === fight.id);
                                            if (bet && fight.winnerId) {
                                                const winnerCorrect = bet.winnerId === fight.winnerId;
                                                const methodCorrect = winnerCorrect && bet.method === fight.method;
                                                const roundCorrect = methodCorrect && bet.method !== "DECISION" && bet.method !== "DRAW" && bet.round === fight.round;
                                                const isDecisionPerfect = methodCorrect && (bet.method === "DECISION" || bet.method === "DRAW");

                                                if (winnerCorrect) {
                                                    totalPoints += settings.winner;
                                                    if (methodCorrect) {
                                                        totalPoints += settings.method;
                                                        if (isDecisionPerfect) totalPoints += settings.decision;
                                                        else if (roundCorrect) totalPoints += settings.round;
                                                    }
                                                }
                                            }
                                        });

                                        return (
                                            <span className="text-sm font-black text-yellow-500">{totalPoints} PTS</span>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-800/50">
                                {(() => {
                                    const completedFights = (event.fights || []).filter(f => f.status === "FINISHED" && f.winnerId);
                                    const myBetsList = allBets?.filter(b => b.leagueId === league.id && b.userId === activeUserId) || [];

                                    const renderFights = (fights: Fight[]) => {
                                        if (fights.length === 0) {
                                            return <div className="text-center p-4 text-xs font-bold text-zinc-600">No fights yet</div>;
                                        }

                                        return fights.map(fight => {
                                            const bet = myBetsList.find(b => b.fightId === fight.id);
                                            const winnerName = fight.winnerId === fight.fighterA.id ? fight.fighterA.name : fight.fighterB.name;

                                            let isPerfect = false;
                                            let points = 0;
                                            let winnerCorrect = false;
                                            let methodCorrect = false;
                                            let choiceText = "No Pick";

                                            if (bet && fight.winnerId) {
                                                winnerCorrect = bet.winnerId === fight.winnerId;
                                                methodCorrect = winnerCorrect && bet.method === fight.method;
                                                const roundCorrect = methodCorrect && bet.method !== "DECISION" && bet.method !== "DRAW" && bet.round === fight.round;
                                                const isDecisionPerfect = methodCorrect && (bet.method === "DECISION" || bet.method === "DRAW");

                                                isPerfect = isDecisionPerfect || roundCorrect;

                                                if (winnerCorrect) {
                                                    points += settings.winner;
                                                    if (methodCorrect) {
                                                        points += settings.method;
                                                        if (isDecisionPerfect) points += settings.decision;
                                                        else if (roundCorrect) points += settings.round;
                                                    }
                                                }

                                                const betFighterName = fight.fighterA.id === bet.winnerId ? fight.fighterA.name : fight.fighterB.name;
                                                choiceText = `${betFighterName.split(" ").pop()}${bet.method ? ` (${bet.method === "DECISION" ? "DEC" : bet.method === "SUBMISSION" ? "SUB" : "KO"}${bet.round ? ` R${bet.round}` : ''})` : ''}`;
                                            }

                                            // Clear, non-abbreviated result text
                                            const resultMethod = fight.method === "DECISION" ? "DEC" : fight.method === "SUBMISSION" ? "SUB" : "KO";
                                            const resultText = `${winnerName.split(" ").pop()} (${resultMethod}${fight.round && fight.method !== "DECISION" ? ` R${fight.round}` : ""})`;

                                            const divisionShort = fight.division ? fight.division.split(" ").map(w => w[0]).join("") : "FW";

                                            return (
                                                <div key={fight.id} className="px-2 py-1.5 hover:bg-zinc-900/50 transition-colors rounded-md mb-1 border border-transparent hover:border-zinc-800/50">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                                            <div className={cn(
                                                                "relative w-7 h-7 rounded-full border flex items-center justify-center shrink-0",
                                                                isPerfect ? "bg-zinc-900 border-emerald-500/50" :
                                                                    (points > 0 ? "bg-zinc-900 border-amber-500/50" :
                                                                        "bg-zinc-900 border-zinc-500/30 grayscale opacity-70")
                                                            )}>
                                                                <span className="text-xs">{isPerfect ? "✅" : (points > 0 ? "⚠️" : "❌")}</span>
                                                            </div>
                                                            <div className={cn("flex-1 min-w-0", points === 0 && bet && "opacity-80")}>
                                                                <div className="flex items-baseline justify-between gap-1">
                                                                    <h4 className={cn(
                                                                        "text-xs font-black truncate",
                                                                        isPerfect ? "text-white" : (points > 0 ? "text-white" : "text-zinc-400")
                                                                    )}>
                                                                        {bet ? (fight.fighterA.id === bet.winnerId ? fight.fighterA.name : fight.fighterB.name) : "Missed Pick"}
                                                                    </h4>
                                                                    <span className="text-[9px] font-bold text-zinc-500 bg-zinc-900 px-1 rounded">{divisionShort}</span>
                                                                </div>
                                                                <div className="flex gap-1.5 text-[10px] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                                                    <span className={cn(
                                                                        "font-bold truncate",
                                                                        isPerfect ? "text-emerald-400" : (points > 0 ? "text-amber-500" : "text-zinc-500")
                                                                    )}>
                                                                        Pick: <span className={cn(isPerfect ? "text-white" : (points === 0 ? "line-through" : "text-white"))}>{choiceText}</span>
                                                                    </span>
                                                                    <span className="text-zinc-600 shrink-0">•</span>
                                                                    <span className="text-zinc-400 truncate">Result: {resultText}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className={cn(
                                                            "text-xs font-black shrink-0",
                                                            isPerfect ? "text-emerald-500" : (points > 0 ? "text-amber-500" : "text-zinc-600")
                                                        )}>+{points}</span>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    };

                                    const mainCardFights = completedFights.filter((_, i) => completedFights.length < 6 ? i >= 0 : i >= completedFights.length - 5);
                                    const prelimsFights = completedFights.filter((_, i) => completedFights.length < 6 ? false : i < completedFights.length - 5);

                                    return (
                                        <>
                                            {/* --- MAIN CARD SECTION --- */}
                                            <div className="flex-1 p-2">
                                                <div className="flex items-center gap-2 mb-2 px-2 pt-1">
                                                    <span className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">Main Card</span>
                                                    <div className="h-px bg-zinc-800 flex-1" />
                                                </div>
                                                {renderFights(mainCardFights)}
                                            </div>

                                            {/* --- PRELIMS SECTION --- */}
                                            <div className="flex-1 p-2 bg-zinc-950/30">
                                                <div className="flex items-center gap-2 mb-2 px-2 pt-1">
                                                    <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Prelims</span>
                                                    <div className="h-px bg-zinc-800 flex-1" />
                                                </div>
                                                {renderFights(prelimsFights)}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
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
