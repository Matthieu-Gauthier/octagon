import { useParams, Link } from "react-router-dom";
import { useLeague } from "@/context/LeagueContext";
import { MOCK_EVENTS, MOCK_USER_BETS, MockUserBet, Fight } from "@/data/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Trophy, ChevronLeft, ChevronRight, ChevronDown, Calendar, Target, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { VegasFightCard, FightCardPick } from "@/components/FightCard";
import { useBets } from "@/store/useBets";

// ============================================================================
// Scoring helpers
// ============================================================================

function computeEventStandings(
    leagueId: string,
    memberIds: string[],
    fights: Fight[],
    allBets: MockUserBet[]
) {
    const finishedFights = fights.filter(f => f.status === "FINISHED" && f.result);

    return memberIds.map(userId => {
        const userBets = allBets.filter(b => b.leagueId === leagueId && b.userId === userId);
        let points = 0;
        let correct = 0;
        let perfect = 0;
        let betsPlaced = userBets.length;

        for (const fight of finishedFights) {
            const bet = userBets.find(b => b.fightId === fight.id);
            if (!bet || !fight.result) continue;

            if (bet.winnerId === fight.result.winnerId) {
                correct++;
                points += 10; // correct winner

                if (bet.method === fight.result.method) {
                    points += 5; // correct method

                    if (bet.method !== "DECISION" && bet.round === fight.result.round) {
                        points += 10; // correct round
                        perfect++;
                    }
                }
            }
        }

        return { userId, points, correct, perfect, betsPlaced, total: fights.length };
    }).sort((a, b) => b.points - a.points);
}

// ============================================================================
// Fight Card with league-scoped bets
// ============================================================================

function LeagueFightCard({ fight, leagueId, locked }: { fight: Fight; leagueId: string; locked: boolean }) {
    const { getBet, placeBet, removeBet } = useBets();

    // For past events, try to get bet from mock data
    const mockBet = locked
        ? MOCK_USER_BETS.find(b => b.leagueId === leagueId && b.fightId === fight.id && b.userId === "me")
        : null;

    const liveBet = !locked ? getBet(leagueId, fight.id) : null;
    const bet = mockBet || liveBet;

    const value = bet ? { winnerId: bet.winnerId, method: bet.method as FightCardPick["method"], round: bet.round } : null;



    return (
        <VegasFightCard
            fight={fight}
            mode="full"
            value={value}
            locked={locked}
            // resultBreakdown removed to declutter UI — see My Picks summary instead
            onPickChange={locked ? undefined : (pick) => {
                if (!pick) { removeBet(leagueId, fight.id); return; }
                placeBet({ leagueId, fightId: fight.id, winnerId: pick.winnerId, method: pick.method, round: pick.round });
            }}
        />
    );
}

// ============================================================================
// Main — Fight Night Hub (Unified View)
// ============================================================================
export function LeagueDashboard() {
    const { leagueId } = useParams();
    const { getLeague } = useLeague();
    const league = getLeague(leagueId || "");
    const [eventIdx, setEventIdx] = useState(MOCK_EVENTS.length - 1);
    const [showAllStandings, setShowAllStandings] = useState(false);
    const [mainCardOpen, setMainCardOpen] = useState(true);
    const [prelimsOpen, setPrelimsOpen] = useState(false);

    const event = MOCK_EVENTS[eventIdx];
    const isFinished = event.fights.every(f => f.status === "FINISHED");
    const locked = isFinished;

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

    const copyCode = () => {
        navigator.clipboard.writeText(league.code);
        toast.success("Invite code copied!");
    };

    // Per-event standings
    const standings = computeEventStandings(
        league.id,
        league.members,
        event.fights,
        MOCK_USER_BETS
    );
    const myStanding = standings.find(s => s.userId === "me");
    const myRank = standings.findIndex(s => s.userId === "me") + 1;

    // User display name helper
    const getUserName = (userId: string) => {
        if (userId === "me") return "You";
        const names: Record<string, string> = { u1: "AlexVolk", u2: "IzzyStyle", u3: "DoBronxs", u4: "Poatan" };
        return names[userId] || userId;
    };

    const mainCardFights = event.fights.filter(f => f.isMainCard);
    const prelimFights = event.fights.filter(f => !f.isMainCard);

    // Per-section stats for "me"
    const computeSectionStats = (fights: Fight[]) => {
        const myBets = MOCK_USER_BETS.filter(b => b.leagueId === league.id && b.userId === "me");
        let points = 0;
        let correct = 0;
        const finished = fights.filter(f => f.status === "FINISHED" && f.result);
        for (const fight of finished) {
            const bet = myBets.find(b => b.fightId === fight.id);
            if (!bet || !fight.result) continue;
            if (bet.winnerId === fight.result.winnerId) {
                correct++;
                points += 10;
                if (bet.method === fight.result.method) {
                    points += 5;
                    if (bet.method !== "DECISION" && bet.round === fight.result.round) points += 10;
                }
            }
        }
        return { points, correct, total: fights.length };
    };
    const mainStats = computeSectionStats(mainCardFights);
    const prelimsStats = computeSectionStats(prelimFights);

    const visibleStandings = showAllStandings ? standings : standings.slice(0, 5);
    const hasMoreStandings = standings.length > 5;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* League Header */}
            <div className="flex items-center gap-4">
                <Link to="/leagues">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">{league.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-muted-foreground text-sm">{league.members.length} members</span>
                        <span className="text-muted-foreground">·</span>
                        <Badge variant="outline" className="font-mono text-xs cursor-pointer hover:bg-muted" onClick={copyCode}>
                            {league.code} <Copy className="ml-1 h-3 w-3 inline" />
                        </Badge>
                    </div>
                </div>
            </div>

            {/* 🏟️ Event Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800 p-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl" />
                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => setEventIdx(Math.max(0, eventIdx - 1))}
                            disabled={eventIdx === 0}
                            className="p-1.5 rounded-lg bg-zinc-800/50 disabled:opacity-30 cursor-pointer hover:bg-zinc-800 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        {isFinished ? (
                            <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]">
                                ✅ COMPLETED
                            </Badge>
                        ) : (
                            <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-[10px]">
                                🟢 UPCOMING
                            </Badge>
                        )}
                        <button
                            onClick={() => setEventIdx(Math.min(MOCK_EVENTS.length - 1, eventIdx + 1))}
                            disabled={eventIdx === MOCK_EVENTS.length - 1}
                            className="p-1.5 rounded-lg bg-zinc-800/50 disabled:opacity-30 cursor-pointer hover:bg-zinc-800 transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="text-center space-y-1">
                        <h2 className="text-2xl font-black tracking-tight">{event.name.split(":")[0]}</h2>
                        <p className="text-sm text-zinc-400 font-medium">{event.name.split(":")[1]?.trim()}</p>
                        <div className="flex items-center justify-center gap-3 text-xs text-zinc-500 pt-1">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(event.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                            </span>
                            <span>·</span>
                            <span>{event.location}</span>
                            <span>·</span>
                            <span>{event.fights.length} fights</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            {isFinished && myStanding && (
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
                            <p className="text-2xl font-black">{myStanding.correct}<span className="text-sm text-zinc-500">/{event.fights.length}</span></p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ===== STANDINGS TABLE ===== */}
            {isFinished && (
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
                                {getUserName(s.userId)}
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
            {isFinished && (
                <div className="rounded-xl border border-zinc-800 overflow-hidden">
                    <button className="w-full flex items-center gap-2 px-3 py-2.5 bg-zinc-950/50 border-b border-zinc-800 cursor-default">
                        <Target className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">My Picks</span>
                        <div className="flex-1" />
                        {(() => {
                            // Compute localized pick stats for "me"
                            const completedFights = event.fights.filter(f => f.status === "FINISHED" && f.result);
                            const myPicksData = completedFights.map(fight => {
                                const bet = MOCK_USER_BETS.find(b => b.leagueId === league.id && b.fightId === fight.id && b.userId === "me");
                                if (!bet || !fight.result) return null;

                                const winnerCorrect = bet.winnerId === fight.result.winnerId;
                                const methodCorrect = winnerCorrect && bet.method === fight.result.method;
                                const roundCorrect = methodCorrect && bet.method !== "DECISION" && bet.round === fight.result.round;

                                let points = 0;
                                if (winnerCorrect) points += 10;
                                if (methodCorrect) points += 5;
                                if (roundCorrect) points += 10;

                                return { points, winnerCorrect };
                            }).filter(Boolean) as any[];

                            return (
                                <>
                                    <div className="flex items-center gap-1 mr-2">
                                        {myPicksData.map((p, i) => (
                                            <div key={i} className={cn(
                                                "w-2 h-2 rounded-full",
                                                p.points >= 25 ? "bg-green-500" :
                                                    p.points >= 10 ? "bg-yellow-500" :
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
                            const completedFights = event.fights.filter(f => f.status === "FINISHED" && f.result);
                            return completedFights.map((fight) => {
                                const bet = MOCK_USER_BETS.find(b => b.leagueId === league.id && b.fightId === fight.id && b.userId === "me");
                                if (!bet || !fight.result) return null;

                                const winnerCorrect = bet.winnerId === fight.result.winnerId;
                                const methodCorrect = winnerCorrect && bet.method === fight.result.method;
                                const roundCorrect = methodCorrect && bet.method !== "DECISION" && bet.round === fight.result.round;

                                let points = 0;
                                if (winnerCorrect) points += 10;
                                if (methodCorrect) points += 5;
                                if (roundCorrect) points += 10;

                                const isPerfect = points >= 25;
                                const winnerName = fight.result.winnerId === fight.fighterA.id ? fight.fighterA.name : fight.fighterB.name;
                                // Clear, non-abbreviated result text
                                const resultText = `${winnerName} by ${fight.result.method}${fight.result.round ? ` (Round ${fight.result.round})` : ""}`;

                                return (
                                    <div key={fight.id} className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/30 text-[10px]",
                                        isPerfect && "bg-green-500/5"
                                    )}>
                                        <div className={cn(
                                            "w-2 h-2 rounded-full shrink-0",
                                            isPerfect ? "bg-green-500" :
                                                points >= 10 ? "bg-yellow-500" :
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
                                            {roundCorrect
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

            {/* ===== MAIN CARD (collapsible) ===== */}
            <div>
                <button
                    onClick={() => setMainCardOpen(!mainCardOpen)}
                    className={cn(
                        "w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-pointer transition-all",
                        mainCardOpen
                            ? "bg-gradient-to-r from-red-600/10 to-transparent border border-red-500/20"
                            : "bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700"
                    )}
                >
                    <div className={cn("w-1.5 h-1.5 rounded-full", mainCardOpen ? "bg-red-500" : "bg-zinc-700")} />
                    <span className={cn("text-sm font-bold uppercase tracking-wide", mainCardOpen ? "text-zinc-100" : "text-zinc-500")}>
                        Main Card
                    </span>
                    <span className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded-full",
                        mainCardOpen ? "bg-red-600/25 text-red-400 border border-red-500/20" : "bg-zinc-800 text-zinc-600"
                    )}>{mainCardFights.length} fights</span>
                    <div className="flex-1" />
                    {isFinished && (
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                                <Target className="h-3 w-3" />{mainStats.correct}/{mainStats.total}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-500">
                                <Trophy className="h-3 w-3" />{mainStats.points}pts
                            </span>
                        </div>
                    )}
                    <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", mainCardOpen ? "rotate-90 text-red-400" : "text-zinc-600")} />
                </button>
                {mainCardOpen && (
                    <div className="space-y-4 mt-3 animate-in fade-in">
                        {mainCardFights.map(fight => (
                            <LeagueFightCard key={fight.id} fight={fight} leagueId={league.id} locked={locked} />
                        ))}
                    </div>
                )}
            </div>

            {/* ===== PRELIMS (collapsible, closed by default) ===== */}
            {prelimFights.length > 0 && (
                <div>
                    <button
                        onClick={() => setPrelimsOpen(!prelimsOpen)}
                        className={cn(
                            "w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-pointer transition-all",
                            prelimsOpen
                                ? "bg-gradient-to-r from-red-600/10 to-transparent border border-red-500/20"
                                : "bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700"
                        )}
                    >
                        <div className={cn("w-1.5 h-1.5 rounded-full", prelimsOpen ? "bg-red-500" : "bg-zinc-700")} />
                        <span className={cn("text-sm font-bold uppercase tracking-wide", prelimsOpen ? "text-zinc-100" : "text-zinc-500")}>
                            Prelims
                        </span>
                        <span className={cn(
                            "text-[10px] font-medium px-2 py-0.5 rounded-full",
                            prelimsOpen ? "bg-red-600/25 text-red-400 border border-red-500/20" : "bg-zinc-800 text-zinc-600"
                        )}>{prelimFights.length} fights</span>
                        <div className="flex-1" />
                        {isFinished && (
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                                    <Target className="h-3 w-3" />{prelimsStats.correct}/{prelimsStats.total}
                                </span>
                                <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-500">
                                    <Trophy className="h-3 w-3" />{prelimsStats.points}pts
                                </span>
                            </div>
                        )}
                        <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", prelimsOpen ? "rotate-90 text-red-400" : "text-zinc-600")} />
                    </button>
                    {prelimsOpen && (
                        <div className="space-y-4 mt-3 animate-in fade-in">
                            {prelimFights.map(fight => (
                                <LeagueFightCard key={fight.id} fight={fight} leagueId={league.id} locked={locked} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
