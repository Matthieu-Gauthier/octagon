import { Fight } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, RotateCcw, Flame, Shield, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { FighterPortrait } from "./FighterPortrait";
import { getFlagForHometown } from "@/lib/flags";

// ============================================================================
// Types
// ============================================================================
type Method = 'KO/TKO' | 'SUBMISSION' | 'DECISION';

const METHODS: { value: Method; short: string; icon: string; label: string }[] = [
    { value: "KO/TKO", short: "KO", icon: "💥", label: "KO / TKO" },
    { value: "SUBMISSION", short: "SUB", icon: "🔒", label: "Submission" },
    { value: "DECISION", short: "DEC", icon: "📋", label: "Decision" },
];

// ============================================================================
// Combined Stats & Wins Breakdown Widget (both fighters side-by-side)
// ============================================================================
type CombinedStatsProps = {
    fighterA: { winsByKo?: number; winsByDec?: number; winsBySub?: number; height?: string | null; weight?: string | null; reach?: string | null; stance?: string | null };
    fighterB: { winsByKo?: number; winsByDec?: number; winsBySub?: number; height?: string | null; weight?: string | null; reach?: string | null; stance?: string | null };
};
function CombinedStats({ fighterA, fighterB }: CombinedStatsProps) {
    const totalA = (fighterA.winsByKo ?? 0) + (fighterA.winsByDec ?? 0) + (fighterA.winsBySub ?? 0);
    const totalB = (fighterB.winsByKo ?? 0) + (fighterB.winsByDec ?? 0) + (fighterB.winsBySub ?? 0);

    const pct = (n: number, total: number) => total > 0 ? Math.round((n / total) * 100) : 0;

    const winRows = (totalA === 0 && totalB === 0) ? [] : [
        { label: 'KO/TKO', a: fighterA.winsByKo ?? 0, b: fighterB.winsByKo ?? 0, pA: pct(fighterA.winsByKo ?? 0, totalA), pB: pct(fighterB.winsByKo ?? 0, totalB) },
        { label: 'DEC', a: fighterA.winsByDec ?? 0, b: fighterB.winsByDec ?? 0, pA: pct(fighterA.winsByDec ?? 0, totalA), pB: pct(fighterB.winsByDec ?? 0, totalB) },
        { label: 'SUB', a: fighterA.winsBySub ?? 0, b: fighterB.winsBySub ?? 0, pA: pct(fighterA.winsBySub ?? 0, totalA), pB: pct(fighterB.winsBySub ?? 0, totalB) },
    ];

    const formatStat = (val?: string | null) => {
        if (!val) return '--';
        // If it ends with exactly ".00", remove it.
        // E.g. "70.00" -> "70", "70.50" -> "70.50" (or we can trim .0 if we want, but let's just do .00 as requested)
        return val.replace(/\.00$/, '');
    };

    const statRows = [
        { label: 'HEIGHT', a: formatStat(fighterA.height), b: formatStat(fighterB.height) },
        { label: 'WEIGHT', a: formatStat(fighterA.weight), b: formatStat(fighterB.weight) },
        { label: 'REACH', a: formatStat(fighterA.reach), b: formatStat(fighterB.reach) },
        { label: 'STANCE', a: fighterA.stance || '--', b: fighterB.stance || '--' },
    ];

    return (
        <div className="flex flex-col items-center gap-3 w-full">
            {winRows.length > 0 && (
                <div className="flex flex-col items-center gap-0.5 w-full">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">
                        Wins by Method
                    </span>
                    {winRows.map(({ label, a, b, pA, pB }) => (
                        <div key={label} className="flex items-center gap-0">
                            {/* Left — red corner */}
                            <div className="flex items-center justify-end gap-1 w-16">
                                <span className="text-[10px] text-zinc-500">({pA}%)</span>
                                <span className="text-[11px] font-bold font-mono text-white/80">{a}</span>
                            </div>
                            {/* Label */}
                            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 w-14 text-center">
                                {label}
                            </span>
                            {/* Right — blue corner */}
                            <div className="flex items-center gap-1 w-16">
                                <span className="text-[11px] font-bold font-mono text-white/80">{b}</span>
                                <span className="text-[10px] text-zinc-500">({pB}%)</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-col items-center gap-0.5 opacity-90 w-full mt-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5 mt-1">
                    Physical Stats
                </span>
                {statRows.map(({ label, a, b }) => (
                    <div key={label} className="flex items-center gap-0">
                        {/* Left — red corner */}
                        <div className="flex items-center justify-end gap-1 w-16">
                            <span className="text-[10px] font-bold font-mono text-zinc-300 w-full text-right truncate">{a}</span>
                        </div>
                        {/* Label */}
                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 w-16 text-center">
                            {label}
                        </span>
                        {/* Right — blue corner */}
                        <div className="flex items-center gap-1 w-16">
                            <span className="text-[10px] font-bold font-mono text-zinc-300 w-full text-left truncate">{b}</span>
                        </div>
                    </div>
                ))}
            </div>
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
        method: string;
        round?: number;
    };
    scoring: {
        winnerCorrect: boolean;
        methodCorrect: boolean;
        roundCorrect: boolean;
        points: number;
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
export function VegasFightCard({ fight, mode = "full", value = null, onPickChange, locked = false, lockAt }: VegasFightCardProps) {
    const [winner, setWinner] = useState<string | null>(value?.winnerId ?? null);
    const [method, setMethod] = useState<Method | null>((value?.method as Method) ?? null);
    const [round, setRound] = useState<number | null>(value?.round ?? null);
    const [showDrawer, setShowDrawer] = useState(true);

    // Derive locked state: either externally forced, or lockAt timestamp has passed
    const isLocked = locked || (!!lockAt && new Date() >= new Date(lockAt));

    // Sync from external value
    useEffect(() => {
        setWinner(value?.winnerId ?? null);
        setMethod((value?.method as Method) ?? null);
        setRound(value?.round ?? null);
    }, [value?.winnerId, value?.method, value?.round]);

    const isComplete = mode === "winner"
        ? !!winner
        : !!winner && !!method && (method === "DECISION" || !!round);

    // Auto-close drawer 1s after pick is complete (only in full/admin mode)
    // Auto-close drawer 1s after pick is complete (only in full mode)
    useEffect(() => {
        if (mode === "full" && isComplete && !isLocked) {
            const timer = setTimeout(() => setShowDrawer(false), 1000);
            return () => clearTimeout(timer);
        } else if (!isComplete) {
            setShowDrawer(true);
        }
    }, [isComplete, method, round, mode, isLocked]);

    const notifyChange = (w: string | null, m: Method | null, r: number | null) => {
        const payload = w ? { winnerId: w, method: m ?? undefined, round: r ?? undefined } : null;
        if (onPickChange) {
            onPickChange(payload);
        }
    };

    const handleFighterClick = (id: string, e: React.MouseEvent) => {
        if (isLocked) return;
        // Ignore clicks inside the selection drawer
        if ((e.target as HTMLElement).closest('.selection-area')) return;

        // Toggle off if clicking selected winner
        if (winner === id) {
            setWinner(null); setMethod(null); setRound(null); setShowDrawer(true);
            notifyChange(null, null, null);
        } else {
            setWinner(id); setMethod(null); setRound(null); setShowDrawer(true);
            // If survivor mode (winner only), notify immediately
            if (mode === "winner") {
                notifyChange(id, null, null);
            } else {
                notifyChange(id, null, null); // Notify winner change, clear rest
            }
        }
    };

    const pickMethod = (m: Method) => {
        if (isLocked) return;
        const newMethod = method === m ? null : m;
        const newRound = null;
        setMethod(newMethod);
        setRound(newRound);
        notifyChange(winner, newMethod, newRound);
    };

    const pickRound = (r: number) => {
        if (isLocked) return;
        const newRound = round === r ? null : r;
        setRound(newRound);
        notifyChange(winner, method, newRound);
    };

    const reset = (e?: React.MouseEvent) => {
        if (isLocked) return;
        e?.stopPropagation();
        setWinner(null); setMethod(null); setRound(null); setShowDrawer(true);
        notifyChange(null, null, null);
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
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center justify-center gap-2 w-[160px] py-4 mt-8 sm:mt-6">
                    <CombinedStats fighterA={fight.fighterA} fighterB={fight.fighterB} />
                </div>

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
                            <p className="text-sm font-bold text-red-500 mt-1 font-mono tracking-wider">{fight.fighterA.wins}-{fight.fighterA.losses}-{fight.fighterA.noContests}</p>
                            {winner === fight.fighterA.id && isComplete && (
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
                            <p className="text-sm font-bold text-blue-500 mt-1 font-mono tracking-wider">{fight.fighterB.wins}-{fight.fighterB.losses}-{fight.fighterB.noContests}</p>
                            {winner === fight.fighterB.id && isComplete && (
                                <div className="mt-1.5 inline-flex items-center gap-1 bg-blue-950/90 border border-blue-500/30 rounded-full pl-1.5 pr-2.5 py-0.5 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-bottom-2 pointer-events-auto cursor-default">
                                    {isLocked ? <Lock className="w-2.5 h-2.5 text-blue-400" /> : <Check className="w-2.5 h-2.5 text-blue-400" />}
                                    <span className="text-[9px] font-black text-blue-200 uppercase tracking-wide">{getShortSummary()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </FighterPortrait>
            </div>

            {/* ============================================================== */}
            {/* BOTTOM DRAWER SELECTION (Only enable in "full" mode)          */}
            {/* ============================================================== */}
            {!isLocked && mode === "full" && winner && showDrawer && (
                <div className="selection-area absolute bottom-0 inset-x-0 z-40 animate-in slide-in-from-bottom-8 duration-300">
                    {/* Backdrop gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent pointer-events-none" />
                    <div className="relative backdrop-blur-xl p-4 pt-6">
                        {/* Handle */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-zinc-700" />

                        {!isComplete ? (
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center">
                                    {!method ? "How does it end?" : `${METHODS.find(m => m.value === method)?.icon} ${method} — Which round?`}
                                </p>
                                {!method ? (
                                    <div className="flex gap-2 justify-center">
                                        {METHODS.map((m) => (
                                            <button key={m.value} onClick={() => pickMethod(m.value)}
                                                className="flex items-center gap-2 py-2.5 px-4 rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all active:scale-95 cursor-pointer backdrop-blur-sm">
                                                <span className="text-base">{m.icon}</span>
                                                <span className="text-[11px] font-bold uppercase tracking-wide">{m.short}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : method !== "DECISION" ? (
                                    <div className="flex gap-2 justify-center">
                                        {Array.from({ length: fight.rounds }).map((_, i) => (
                                            <button key={i} onClick={() => pickRound(i + 1)}
                                                className="w-12 h-12 rounded-full text-sm font-black bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all active:scale-95 cursor-pointer backdrop-blur-sm">
                                                R{i + 1}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                                <div className="flex justify-center gap-4 pt-1">
                                    {method && (
                                        <button onClick={() => setMethod(null)} className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer">
                                            <ChevronLeft className="h-3 w-3" /> Back
                                        </button>
                                    )}
                                    <button onClick={(e) => reset(e)} className="text-[10px] text-zinc-600 hover:text-red-400 flex items-center gap-1 cursor-pointer">
                                        <RotateCcw className="h-3 w-3" /> Reset
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-3 py-1">
                                <div className="bg-green-500 rounded-full p-0.5"><Check className="h-3 w-3 text-black" /></div>
                                <span className="text-sm font-black text-green-400 uppercase tracking-wider">{getShortSummary()}</span>
                                <button onClick={(e) => reset(e)} className="text-[10px] text-zinc-600 hover:text-red-400 flex items-center gap-1 ml-2 cursor-pointer">
                                    <RotateCcw className="h-3 w-3" /> Change
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
