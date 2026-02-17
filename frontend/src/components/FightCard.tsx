import { Fight } from "@/data/mock-data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Flame, RotateCcw, Shield, Lock } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

// ============================================================================
// Types
// ============================================================================
type Method = 'KO/TKO' | 'SUBMISSION' | 'DECISION';

const METHODS: { value: Method; label: string; icon: string }[] = [
    { value: "KO/TKO", label: "KO / TKO", icon: "💥" },
    { value: "SUBMISSION", label: "Submission", icon: "🔒" },
    { value: "DECISION", label: "Decision", icon: "📋" },
];

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
    /** "full" = winner + method + round (betting).  "winner" = winner only (survivor). Default: "full" */
    mode?: "full" | "winner";
    /** Current pick value (controlled component). */
    value?: FightCardPick | null;
    /** Called whenever the pick changes. */
    onPickChange?: (pick: FightCardPick | null) => void;
    /** If true, the card is read-only (past event). */
    locked?: boolean;
    /** If provided, shows a result comparison footer. */
    resultBreakdown?: ResultBreakdown;
}

// ============================================================================
// Corner-color helpers
// ============================================================================
function cornerClasses(color: "red" | "blue") {
    return {
        selected: color === "red" ? "bg-red-900/40 ring-1 ring-red-500" : "bg-blue-900/40 ring-1 ring-blue-500",
        textActive: color === "red" ? "text-red-400" : "text-blue-400",
    };
}

// ============================================================================
// Sub-components
// ============================================================================
function FightBanner({ fight }: { fight: Fight }) {
    if (fight.isMainEvent) {
        return (
            <div className="bg-gradient-to-r from-zinc-950 via-red-950 to-zinc-950 text-center py-2 border-b border-red-500/30">
                <div className="flex items-center justify-center gap-2">
                    <Flame className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-red-400">Main Event</span>
                    <Flame className="h-3.5 w-3.5 text-red-500" />
                </div>
            </div>
        );
    }
    if (fight.isCoMainEvent) {
        return (
            <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-center py-2 border-b border-zinc-700">
                <div className="flex items-center justify-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400">Co-Main Event</span>
                    <Shield className="h-3.5 w-3.5 text-zinc-400" />
                </div>
            </div>
        );
    }
    return (
        <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-950 border-b border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{fight.isMainCard ? "Main Card" : "Prelim"}</span>
        </div>
    );
}

function RoundBadge({ rounds }: { rounds: number }) {
    return (
        <div className="flex flex-col items-center gap-0.5 bg-zinc-800 rounded-lg px-3 py-1.5">
            <span className="text-lg font-black text-white">{rounds}</span>
            <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Rounds</span>
        </div>
    );
}

// ============================================================================
// Main component
// ============================================================================
export function VegasFightCard({ fight, mode = "full", value = null, onPickChange, locked = false }: VegasFightCardProps) {
    // Internal state (used when uncontrolled or as local working state)
    const [winner, setWinner] = useState<string | null>(value?.winnerId ?? null);
    const [method, setMethod] = useState<Method | null>((value?.method as Method) ?? null);
    const [round, setRound] = useState<number | null>(value?.round ?? null);
    const [expanded, setExpanded] = useState(false);

    // Sync from external value prop
    useEffect(() => {
        setWinner(value?.winnerId ?? null);
        setMethod((value?.method as Method) ?? null);
        setRound(value?.round ?? null);
    }, [value?.winnerId, value?.method, value?.round]);

    // Notify parent of changes
    const emitChange = useCallback((w: string | null, m: Method | null, r: number | null) => {
        if (!onPickChange) return;
        if (!w) { onPickChange(null); return; }
        onPickChange({ winnerId: w, method: m ?? undefined, round: r ?? undefined });
    }, [onPickChange]);

    const pickWinner = (id: string) => {
        if (locked) return;
        if (winner === id) {
            // Re-click toggles panel
            setExpanded(prev => !prev);
            return;
        }
        setWinner(id);
        setMethod(null);
        setRound(null);
        setExpanded(true);
        if (mode === "winner") {
            // In winner-only mode, emit immediately
            emitChange(id, null, null);
        }
    };

    const pickMethod = (m: Method) => {
        const newMethod = method === m ? null : m;
        const newRound = m === "DECISION" ? null : round;
        setMethod(newMethod);
        setRound(newRound);
        if (newMethod) {
            emitChange(winner, newMethod, newRound);
        }
    };

    const pickRound = (r: number) => {
        const newRound = round === r ? null : r;
        setRound(newRound);
        emitChange(winner, method, newRound);
    };

    const reset = () => {
        setWinner(null);
        setMethod(null);
        setRound(null);
        setExpanded(false);
        emitChange(null, null, null);
    };

    // Summary helpers
    const getShortSummary = () => {
        if (mode === "winner") return null; // No method/round in survivor mode
        if (!method) return null;
        const parts: string[] = [method];
        if (round) parts.push(`R${round}`);
        return parts.join(" · ");
    };

    // Step logic (only for full mode)
    const step = !method ? 1 : (method !== "DECISION" && !round) ? 2 : 3;
    const isComplete = mode === "winner" ? !!winner : (method !== null && (method === "DECISION" || round !== null));

    const color = winner ? (winner === fight.fighterA.id ? "red" as const : "blue" as const) : "red" as const;
    const cc = cornerClasses(color);

    // Auto-collapse 1s after pick is complete
    useEffect(() => {
        if (isComplete && expanded) {
            const timer = setTimeout(() => setExpanded(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [isComplete, expanded, method, round, winner]);

    return (
        <div className={cn(
            "rounded-xl overflow-hidden border-2 transition-all",
            fight.isMainEvent ? "border-red-500/40" : fight.isCoMainEvent ? "border-zinc-700" : "border-zinc-800"
        )}>
            <FightBanner fight={fight} />

            <div className="bg-zinc-950 p-1">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                    {/* Fighter A */}
                    <button onClick={() => pickWinner(fight.fighterA.id)} className={cn(
                        "p-5 rounded-lg transition-all text-right",
                        locked ? "cursor-default" : "cursor-pointer",
                        winner === fight.fighterA.id ? "bg-red-900/40 ring-1 ring-red-500" : !locked && "hover:bg-zinc-900",
                        winner === fight.fighterB.id && "opacity-30"
                    )}>
                        <h3 className="text-xl font-black text-white uppercase">{fight.fighterA.name}</h3>
                        <p className="text-xs text-zinc-500 font-mono">{fight.fighterA.record}</p>

                        {winner === fight.fighterA.id && getShortSummary() && !expanded && (
                            <div className="mt-2 inline-flex items-center gap-1 bg-red-900/30 border border-red-500/20 rounded-full px-2.5 py-0.5">
                                {locked && <Lock className="h-2.5 w-2.5 text-red-400" />}
                                <span className="text-[10px] font-semibold text-red-400">{getShortSummary()}</span>
                            </div>
                        )}
                    </button>

                    <div className="flex flex-col items-center px-4 gap-2">
                        <span className="text-4xl font-black italic text-zinc-600">VS</span>
                        <Badge className="bg-zinc-800 text-zinc-400 text-[9px] border-0">{fight.division}</Badge>
                        {mode === "full" && <RoundBadge rounds={fight.rounds} />}
                    </div>

                    {/* Fighter B */}
                    <button onClick={() => pickWinner(fight.fighterB.id)} className={cn(
                        "p-5 rounded-lg transition-all text-left",
                        locked ? "cursor-default" : "cursor-pointer",
                        winner === fight.fighterB.id ? "bg-blue-900/40 ring-1 ring-blue-500" : !locked && "hover:bg-zinc-900",
                        winner === fight.fighterA.id && "opacity-30"
                    )}>
                        <h3 className="text-xl font-black text-white uppercase">{fight.fighterB.name}</h3>
                        <p className="text-xs text-zinc-500 font-mono">{fight.fighterB.record}</p>

                        {winner === fight.fighterB.id && getShortSummary() && !expanded && (
                            <div className="mt-2 inline-flex items-center gap-1 bg-blue-900/30 border border-blue-500/20 rounded-full px-2.5 py-0.5">
                                {locked && <Lock className="h-2.5 w-2.5 text-blue-400" />}
                                <span className="text-[10px] font-semibold text-blue-400">{getShortSummary()}</span>
                            </div>
                        )}
                    </button>
                </div>
            </div>



            {/* Method & Round panel — only in "full" mode */}
            {mode === "full" && winner && expanded && (
                <div className="bg-zinc-900 border-t border-zinc-800 p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                    {/* Stepper */}
                    <div className="flex items-center gap-3">
                        <div className={cn("flex items-center gap-1.5", step >= 1 ? cc.textActive : "text-zinc-600")}>
                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold", step >= 1 ? cc.selected : "border border-zinc-700")}>1</div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider">Method</span>
                        </div>
                        <div className="flex-1 h-px bg-zinc-800" />
                        <div className={cn("flex items-center gap-1.5", step >= 2 ? cc.textActive : "text-zinc-600")}>
                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold", step >= 2 ? cc.selected : "border border-zinc-700")}>2</div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider">Round</span>
                        </div>
                        <div className="flex-1 h-px bg-zinc-800" />
                        <div className={cn("flex items-center gap-1.5", step >= 3 ? "text-green-400" : "text-zinc-600")}>
                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold", step >= 3 ? "bg-green-900/40 ring-1 ring-green-500" : "border border-zinc-700")}>✓</div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider">Done</span>
                        </div>
                    </div>

                    {step === 1 && (
                        <div className="grid grid-cols-3 gap-2 animate-in fade-in">
                            {METHODS.map(m => (
                                <button key={m.value} onClick={() => pickMethod(m.value)} className="py-3 rounded-lg text-sm font-semibold transition-all border border-zinc-700 text-zinc-400 hover:bg-zinc-800 cursor-pointer flex flex-col items-center gap-1">
                                    <span className="text-lg">{m.icon}</span>
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-2">
                            <p className="text-xs text-zinc-400 mb-2">{method === "KO/TKO" ? "💥" : "🔒"} {method} — which round?</p>
                            <div className="flex gap-2">
                                {Array.from({ length: fight.rounds }).map((_, i) => (
                                    <button key={i} onClick={() => pickRound(i + 1)} className="flex-1 py-3 rounded-lg text-sm font-bold transition-all border border-zinc-700 text-zinc-400 hover:bg-zinc-800 cursor-pointer">
                                        R{i + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center py-2 animate-in fade-in">
                            <p className={cn("font-bold text-sm", cc.textActive)}>✓ Pick confirmed</p>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button onClick={reset} className="text-[10px] text-zinc-600 hover:text-red-400 cursor-pointer flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Reset</button>
                    </div>
                </div>
            )}
        </div>
    );
}
