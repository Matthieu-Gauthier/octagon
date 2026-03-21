import { Fight } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Flame, Shield, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { FighterPortrait } from "./FighterPortrait";
import { getFlagForHometown } from "@/lib/flags";
import { FighterStatsCenterPanel, RecentFormRow } from "./FighterStats";
import { FightPickControls } from "./FightPickControls";

// ============================================================================
// Types
// ============================================================================
type Method = 'KO/TKO' | 'SUBMISSION' | 'DECISION';

export interface ResultBreakdown {
    userPick: { winnerId: string; winnerName: string; method?: string; round?: number };
    result: { winnerId: string; winnerName: string; method?: string; round?: number };
    scoring: {
        winnerCorrect: boolean;
        methodCorrect: boolean;
        roundCorrect: boolean;
        points: number;
        stolenPoints?: number;
    };
    atoutApplied?: { type: string; icon?: string; name?: string };
}


// ============================================================================
// RESULT CENTER (Shown when fight is FINISHED)
// ============================================================================

export function ResultCenter({ resultBreakdown, showDetails }: { resultBreakdown: ResultBreakdown; showDetails?: boolean }) {
    const { userPick, result, scoring } = resultBreakdown;
    const stolenPoints = scoring.stolenPoints ?? 0;
    const isVictim = stolenPoints < 0;
    const ownPoints = isVictim ? 0 : scoring.points - stolenPoints;

    const formatMethod = (method?: string, round?: number) => {
        if (!method) return "No Pick";
        if (method === "DECISION" || method === "DEC") return "DEC";
        return `${method}${round ? ` R${round}` : ''}`;
    };

    return (
        <div className="flex flex-col items-center justify-center py-4">
            {/* Big number */}
            <span className={cn(
                "text-5xl font-black drop-shadow-lg leading-none",
                isVictim ? "text-zinc-600" : scoring.points > 0 ? "text-yellow-400" : "text-zinc-600"
            )}>
                +{scoring.points}
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mt-0.5">pts</span>

            {/* Victim of DETTE: show what was lost */}
            {isVictim && Math.abs(stolenPoints) > 0 && (
                <div className="flex flex-col items-center gap-0.5 mt-1.5">
                    <span className="text-[9px] font-black text-rose-400">💀 -{Math.abs(stolenPoints)} stolen</span>
                </div>
            )}

            {/* Breakdown when DETTE stolen (attacker side) */}
            {!isVictim && stolenPoints > 0 && (
                <div className="flex flex-col items-center gap-0.5 mt-1.5">
                    {ownPoints > 0 && (
                        <span className="text-[9px] font-bold text-amber-500/80">+{ownPoints} pick</span>
                    )}
                    <span className="text-[9px] font-black text-rose-400">💀 +{stolenPoints} stolen</span>
                </div>
            )}

            {/* Your pick / Result — browser only */}
            {showDetails && (
                <div className="flex flex-col gap-1 w-48 mt-3">
                    <div className="flex flex-col items-center bg-zinc-900/80 p-2.5 rounded-t-xl border border-zinc-800 border-b-0 backdrop-blur-sm">
                        <span className="text-zinc-500 font-bold uppercase tracking-widest text-[8px] mb-1">Your Pick</span>
                        <span className={cn("font-black text-[11px] leading-tight", scoring.winnerCorrect ? "text-blue-400" : (userPick.winnerId ? "text-red-400 line-through opacity-80" : "text-zinc-600"))}>
                            {userPick.winnerId
                                ? `${userPick.winnerName.split(' ').pop()} · ${formatMethod(userPick.method, userPick.round)}`
                                : "No Pick"}
                        </span>
                    </div>
                    <div className="flex flex-col items-center bg-emerald-950/30 p-2.5 rounded-b-xl border border-emerald-900/50 backdrop-blur-sm">
                        <span className="text-emerald-500/70 font-bold uppercase tracking-widest text-[8px] mb-1">Result</span>
                        <span className="text-emerald-400 font-black text-[11px] leading-tight">
                            {result.winnerName.split(' ').pop()} · {formatMethod(result.method, result.round)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export interface FightCardPick {
    winnerId: string;
    method?: Method;
    round?: number;
}

export interface ResultBreakdown {
    userPick: {
        winnerId: string;
        winnerName: string;
        method?: string;
        round?: number;
    };
    result: {
        winnerId: string;
        winnerName: string;
        method?: string;
        round?: number;
    };
    scoring: {
        winnerCorrect: boolean;
        methodCorrect: boolean;
        roundCorrect: boolean;
        points: number;
        stolenPoints?: number;
    };
}

interface VegasFightCardProps {
    fight: Fight;
    /** "full" = betting, "winner" = survivor. Default: "full" */
    mode?: "full" | "winner";
    /** Current pick value (controlled component). */
    value?: FightCardPick | null;
    /** Called whenever the pick changes (betting mode). */
    onPickChange?: (pick: FightCardPick | null) => void;
    /** If true, the card is read-only (past event / FINISHED). */
    locked?: boolean;
    /** ISO datetime string — when this card's section bets lock. Shown as a deadline indicator. */
    lockAt?: string | null;
    /** If provided, shows a result comparison footer. */
    resultBreakdown?: ResultBreakdown;
}

// ============================================================================
// Main Component (Refactored to match ShowcaseCard)
// ============================================================================
export function VegasFightCard({ fight, mode = "full", value = null, onPickChange, locked = false, lockAt, resultBreakdown }: VegasFightCardProps) {
    const [winner, setWinner] = useState<string | null>(value?.winnerId ?? null);
    const [method, setMethod] = useState<Method | null>((value?.method as Method) ?? null);
    const [round, setRound] = useState<number | null>(value?.round ?? null);

    // Derive locked state: either externally forced, or lockAt timestamp has passed
    const isLocked = locked || (!!lockAt && new Date() >= new Date(lockAt));

    // Sync from external value
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWinner(value?.winnerId ?? null);
        setMethod((value?.method as Method) ?? null);
        setRound(value?.round ?? null);
    }, [value?.winnerId, value?.method, value?.round]);

    const isComplete = mode === "winner"
        ? !!winner
        : !!winner && !!method && (method === "DECISION" || !!round);

    const handleFighterClick = (id: string, _e: React.MouseEvent) => {
        if (isLocked) return;
        if (winner === id) {
            setWinner(null); setMethod(null); setRound(null);
            onPickChange?.(null);
        } else {
            setWinner(id); setMethod(null); setRound(null);
            onPickChange?.(mode === "winner" ? { winnerId: id } : { winnerId: id });
        }
    };

    const getShortSummary = () => {
        if (!winner) return null;
        if (mode === "winner") return "WIN";
        if (!method) return null;
        const methodText = method === "SUBMISSION" ? "Submission" : method === "DECISION" ? "Decision" : method;
        if (method === "DECISION") return methodText;
        return `${methodText} - Round ${round}`;
    };

    // Determine card height and style based on event type
    let heightClass = "h-[220px]"; // Default / Standard
    let eventType: "main" | "comain" | "standard" = "standard";

    if (fight.isMainEvent) {
        heightClass = "h-[400px]";
        eventType = "main";
    } else if (fight.isCoMainEvent) {
        heightClass = "h-[300px]";
        eventType = "comain";
    }

    const containerClass = cn(
        "w-full rounded-2xl overflow-hidden border bg-zinc-950 shadow-2xl relative transition-all duration-500",
        eventType === "main" ? "border-red-500/40" : eventType === "comain" ? "border-zinc-700" : "border-zinc-800"
    );

    return (
        <div className={containerClass}>
            {/* EVENT HEADER */}
            <div className="absolute top-0 inset-x-0 z-20 pointer-events-none">
                {eventType === "main" && (
                    <div className="bg-gradient-to-r from-zinc-950/95 via-red-950/90 to-zinc-950/95 py-1.5 border-b border-red-500/20 backdrop-blur-sm flex items-center justify-between px-3">
                        <div className="flex items-center gap-1.5">
                            <Flame className="h-3 w-3 text-red-500 fill-red-500/20" />
                            <span className="text-[9px] font-black tracking-[0.2em] uppercase text-red-100 drop-shadow-sm">Main Event</span>
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2">
                            {lockAt && (
                                <div className={cn(
                                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] border shadow-sm",
                                    isLocked ? "bg-zinc-950/80 border-zinc-800" : "bg-zinc-950/60 border-zinc-700/50"
                                )}>
                                    <Lock className="h-2 w-2 text-zinc-500" />
                                    {isLocked ? (
                                        <span className="font-bold uppercase tracking-wider text-zinc-500">Locked</span>
                                    ) : (
                                        <span className="text-zinc-400 font-medium tracking-wide">
                                            <span className="text-zinc-200 font-bold">
                                                {new Date(lockAt).toLocaleString('en-US', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    hour: 'numeric',
                                                    timeZoneName: 'short',
                                                }).replace(',', '')}
                                            </span>
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="h-5 bg-black/40 border-red-500/20 text-red-100/80 text-[10px] font-bold px-2 py-0.5 uppercase tracking-tight">{fight.division}</Badge>
                            <Badge variant="outline" className="h-5 bg-black/40 border-red-500/20 text-red-100/80 text-[10px] font-bold px-2 py-0.5 uppercase tracking-tight">{fight.rounds} RND</Badge>
                        </div>
                    </div>
                )}
                {eventType === "comain" && (
                    <div className="bg-gradient-to-r from-zinc-950/95 via-zinc-900/90 to-zinc-950/95 py-1.5 border-b border-zinc-700/50 backdrop-blur-sm flex items-center justify-between px-3">
                        <div className="flex items-center gap-1.5">
                            <Shield className="h-3 w-3 text-zinc-400 fill-zinc-400/20" />
                            <span className="text-[9px] font-black tracking-[0.2em] uppercase text-zinc-300 drop-shadow-sm">Co-Main Event</span>
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2">
                            {lockAt && (
                                <div className={cn(
                                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] border shadow-sm",
                                    isLocked ? "bg-zinc-950/80 border-zinc-800" : "bg-zinc-950/60 border-zinc-700/50"
                                )}>
                                    <Lock className="h-2 w-2 text-zinc-500" />
                                    {isLocked ? (
                                        <span className="font-bold uppercase tracking-wider text-zinc-500">Locked</span>
                                    ) : (
                                        <span className="text-zinc-400 font-medium tracking-wide">
                                            <span className="text-zinc-200 font-bold">
                                                {new Date(lockAt).toLocaleString('en-US', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    hour: 'numeric',
                                                    timeZoneName: 'short',
                                                }).replace(',', '')}
                                            </span>
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="h-5 bg-black/40 border-zinc-700 text-zinc-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-tight">{fight.division}</Badge>
                            <Badge variant="outline" className="h-5 bg-black/40 border-zinc-700 text-zinc-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-tight">{fight.rounds} RND</Badge>
                        </div>
                    </div>
                )}
                {eventType === "standard" && (
                    <div className="flex justify-between items-start p-3 bg-gradient-to-b from-zinc-950/80 to-transparent relative">
                        <div className="flex-1" />

                        <div className="absolute top-3 left-1/2 -translate-x-1/2">
                            {lockAt && (
                                <div className={cn(
                                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] border backdrop-blur-md shadow-sm",
                                    isLocked ? "bg-zinc-950/80 border-zinc-800" : "bg-zinc-950/60 border-zinc-700/50"
                                )}>
                                    <Lock className="h-2 w-2 text-zinc-500" />
                                    {isLocked ? (
                                        <span className="font-bold uppercase tracking-wider text-zinc-500">Locked</span>
                                    ) : (
                                        <span className="text-zinc-400 font-medium tracking-wide">
                                            <span className="text-zinc-200 font-bold">
                                                {new Date(lockAt).toLocaleString('en-US', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    hour: 'numeric',
                                                    timeZoneName: 'short',
                                                }).replace(',', '')}
                                            </span>
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 z-30">
                            <Badge variant="outline" className="bg-zinc-950/50 backdrop-blur border-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 font-bold uppercase tracking-tight">{fight.division}</Badge>
                            <Badge variant="outline" className="bg-zinc-950/50 backdrop-blur border-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 font-bold uppercase tracking-tight">{fight.rounds} RND</Badge>
                        </div>
                    </div>
                )}
            </div>

            {/* Fighters Area */}
            <div className={cn("grid grid-cols-2 relative transition-all", heightClass)}>
                {/* Central Info Column */}
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center justify-center py-8 w-[180px]">
                    {resultBreakdown ? (
                        <ResultCenter resultBreakdown={resultBreakdown} />
                    ) : (
                        <FighterStatsCenterPanel fighterA={fight.fighterA} fighterB={fight.fighterB} winner={winner} />
                    )}
                </div>

                {/* Central Bottom Info Column */}
                {!resultBreakdown && (
                    <div className="absolute inset-x-0 bottom-1 z-20 pointer-events-none flex flex-col items-center">
                        <RecentFormRow fighterA={fight.fighterA} fighterB={fight.fighterB} winner={winner} />
                    </div>
                )}

                {/* Flags Near Top Corners */}
                {getFlagForHometown(fight.fighterA.hometown) && (
                    <div className="absolute top-12 left-3 z-10 pointer-events-none">
                        <img src={`https://flagcdn.com/w40/${getFlagForHometown(fight.fighterA.hometown)}.png`} alt="flag" className="w-[32px] h-[22px] rounded-[3px] object-cover shadow-[0_4px_10px_rgba(0,0,0,0.8)] opacity-90" />
                    </div>
                )}
                {getFlagForHometown(fight.fighterB.hometown) && (
                    <div className="absolute top-12 right-3 z-10 pointer-events-none">
                        <img src={`https://flagcdn.com/w40/${getFlagForHometown(fight.fighterB.hometown)}.png`} alt="flag" className="w-[32px] h-[22px] rounded-[3px] object-cover shadow-[0_4px_10px_rgba(0,0,0,0.8)] opacity-90" />
                    </div>
                )}

                {/* Fighter A */}
                {/* Fighter A */}
                <FighterPortrait
                    fighter={fight.fighterA}
                    isWinner={winner === fight.fighterA.id}
                    isLoser={!!winner && winner !== fight.fighterA.id}
                    isSelected={winner === fight.fighterA.id}
                    layout="left"
                    onClick={(e) => handleFighterClick(fight.fighterA.id, e)}
                    className={cn(
                        locked ? "cursor-default" : "cursor-pointer",
                        winner === fight.fighterA.id ? "bg-red-900/20" : (!isLocked && "hover:bg-zinc-900/10"),
                        winner === fight.fighterB.id && "grayscale opacity-50",
                        !winner && "grayscale"
                    )}
                >
                    <div className={cn("absolute bottom-0 left-0 w-full p-4 pb-4 transition-all flex flex-col justify-end h-full pointer-events-none", winner === fight.fighterA.id && "bg-gradient-to-t from-red-950/80 via-red-950/40 to-transparent")}>
                        <div className="transition-transform duration-300 origin-bottom-left group-hover:scale-105 mb-1">

                            <h3 className="text-2xl sm:text-3xl font-black text-white italic uppercase leading-[0.85] drop-shadow-2xl break-words hyphens-auto relative">
                                {fight.fighterA.name.split(" ").map((n, i) => (
                                    <span key={i} className="block relative">
                                        {n}
                                    </span>
                                ))}
                            </h3>
                            {fight.fighterA.nickname && (
                                <p className="text-[10px] italic uppercase text-zinc-400 tracking-wide mt-0.5">({fight.fighterA.nickname})</p>
                            )}
                            <p className="text-sm font-bold text-red-500 mt-1 font-mono tracking-wider">{fight.fighterA.wins}-{fight.fighterA.losses}-{fight.fighterA.noContests}</p>
                            {winner === fight.fighterA.id && isComplete && !resultBreakdown && (
                                <div className="mt-1.5 inline-flex items-center gap-1 bg-red-950/90 border border-red-500/30 rounded-full pl-1.5 pr-2.5 py-0.5 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-bottom-2 pointer-events-auto cursor-default">
                                    {isLocked ? <Lock className="w-2.5 h-2.5 text-red-400" /> : <Check className="w-2.5 h-2.5 text-red-400" />}
                                    <span className="text-[9px] font-black text-red-200 uppercase tracking-wide">{getShortSummary()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </FighterPortrait>



                {/* Fighter B */}
                <FighterPortrait
                    fighter={fight.fighterB}
                    isWinner={winner === fight.fighterB.id}
                    isLoser={!!winner && winner !== fight.fighterB.id}
                    isSelected={winner === fight.fighterB.id}
                    layout="right"
                    onClick={(e) => handleFighterClick(fight.fighterB.id, e)}
                    className={cn(
                        locked ? "cursor-default" : "cursor-pointer",
                        winner === fight.fighterB.id ? "bg-blue-900/20" : (!isLocked && "hover:bg-zinc-900/10"),
                        winner === fight.fighterA.id && "grayscale opacity-50",
                        !winner && "grayscale"
                    )}
                >
                    <div className={cn("absolute bottom-0 right-0 w-full p-4 pb-4 text-right flex flex-col justify-end h-full pointer-events-none", winner === fight.fighterB.id && "bg-gradient-to-t from-blue-950/80 via-blue-950/40 to-transparent")}>
                        <div className="flex flex-col items-end transition-transform duration-300 origin-bottom-right group-hover:scale-105 mb-1">

                            <h3 className="text-2xl sm:text-3xl font-black text-white italic uppercase leading-[0.85] drop-shadow-2xl break-words hyphens-auto relative text-right">
                                {fight.fighterB.name.split(" ").map((n, i) => (
                                    <span key={i} className="block relative">
                                        {n}
                                    </span>
                                ))}
                            </h3>
                            {fight.fighterB.nickname && (
                                <p className="text-[10px] italic uppercase text-zinc-400 tracking-wide mt-0.5 text-right">({fight.fighterB.nickname})</p>
                            )}
                            <p className="text-sm font-bold text-blue-500 mt-1 font-mono tracking-wider">{fight.fighterB.wins}-{fight.fighterB.losses}-{fight.fighterB.noContests}</p>
                            {winner === fight.fighterB.id && isComplete && !resultBreakdown && (
                                <div className="mt-1.5 inline-flex items-center gap-1 bg-blue-950/90 border border-blue-500/30 rounded-full pl-1.5 pr-2.5 py-0.5 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-bottom-2 pointer-events-auto cursor-default">
                                    {isLocked ? <Lock className="w-2.5 h-2.5 text-blue-400" /> : <Check className="w-2.5 h-2.5 text-blue-400" />}
                                    <span className="text-[9px] font-black text-blue-200 uppercase tracking-wide">{getShortSummary()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </FighterPortrait>
            </div>

            {/* ── Pick controls ─────────────────────────────────────────────── */}
            {mode === "full" && (
                <FightPickControls
                    fight={fight}
                    value={value}
                    onPickChange={onPickChange ?? (() => {})}
                    locked={isLocked}
                    resultBreakdown={resultBreakdown}
                />
            )}
        </div>
    );
}

// ============================================================================
// Responsive wrapper — unified VegasFightCard for all screen sizes
// ============================================================================
export function ResponsiveFightCard(props: VegasFightCardProps) {
    return <VegasFightCard {...props} />;
}
