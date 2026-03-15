import { cn } from "@/lib/utils";
import { Check, Flame, Lock, Shield } from "lucide-react";
import { getFlagForHometown } from "@/lib/flags";
import type { Fight } from "@/types";
import type { FightCardPick, ResultBreakdown } from "./FightCard";
import { ResultCenter } from "./FightCard";
import { FighterStatsPanel } from "./FighterStats";
import { useFightPick, BetMethod } from "@/hooks/useFightPick";

// ============================================================================
// Constants
// ============================================================================
const BET_METHODS: { value: BetMethod; short: string; icon: string }[] = [
    { value: "KO/TKO",     short: "KO/TKO", icon: "💥" },
    { value: "SUBMISSION", short: "SUB",     icon: "🔒" },
    { value: "DECISION",   short: "DEC",     icon: "📋" },
];

export interface FullScreenFightCardProps {
    fight: Fight;
    mode?: "full" | "winner";
    value?: FightCardPick | null;
    onPickChange?: (pick: FightCardPick | null) => void;
    locked?: boolean;
    lockAt?: string | null;
    resultBreakdown?: ResultBreakdown;
}

// ============================================================================
// Pick Button — shared slot for all states (fixed height, always 2 lines)
// ============================================================================
function PickButton({
    onClick,
    active,
    color,
    children,
    subtitle,
}: {
    onClick: () => void;
    active?: boolean;
    color?: "red" | "blue" | "neutral";
    children: React.ReactNode;
    subtitle?: string | null;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-1 flex flex-col h-[46px] px-2 rounded-xl transition-all active:scale-95 border overflow-hidden",
                active && color === "red"     && "bg-red-500/20 border-red-500/50 text-red-300",
                active && color === "blue"    && "bg-blue-500/20 border-blue-500/50 text-blue-300",
                active && color === "neutral" && "bg-white/10 border-white/20 text-white",
                !active && "bg-zinc-900 border-zinc-800 text-zinc-400",
            )}
        >
            <div className="flex-1 flex items-center justify-center gap-1">
                {children}
            </div>
            <div className="h-[13px] flex items-center justify-center">
                <span className={cn(
                    "text-[9px] font-bold uppercase tracking-wide transition-opacity",
                    subtitle ? "opacity-75" : "opacity-0 select-none pointer-events-none",
                )}>
                    {subtitle || "\u00A0"}
                </span>
            </div>
        </button>
    );
}

// ============================================================================
// Component
// ============================================================================
export function FullScreenFightCard({
    fight,
    mode = "full",
    value = null,
    onPickChange,
    locked = false,
    lockAt,
    resultBreakdown,
}: FullScreenFightCardProps) {
    const {
        winner,
        method,
        round,
        isLocked,
        isComplete,
        selectWinner,
        selectMethod,
        selectRound,
        getSummary,
    } = useFightPick({ mode, value, locked, lockAt, onPickChange });

    const pickedA = winner === fight.fighterA.id;
    const pickedB = winner === fight.fighterB.id;

    let eventType: "main" | "comain" | "standard" = "standard";
    if (fight.isMainEvent) eventType = "main";
    else if (fight.isCoMainEvent) eventType = "comain";

    const flagA = getFlagForHometown(fight.fighterA.hometown);
    const flagB = getFlagForHometown(fight.fighterB.hometown);

    const summary = getSummary();

    return (
        <div className="h-full flex flex-col bg-zinc-950 overflow-hidden">

            {/* ── Info strip ───────────────────────────────────────────────── */}
            <div className="shrink-0 flex items-center justify-between px-3.5 py-2 border-b border-zinc-900/60">
                <div className="flex items-center gap-1.5">
                    {eventType === "main"   && <Flame  className="w-3 h-3 text-red-500 fill-red-500/20 shrink-0" />}
                    {eventType === "comain" && <Shield className="w-3 h-3 text-zinc-400 shrink-0" />}
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-[0.18em]",
                        eventType === "main"   ? "text-red-400"  :
                        eventType === "comain" ? "text-zinc-300" : "text-zinc-500",
                    )}>
                        {eventType === "main"   ? "Main Event"   :
                         eventType === "comain" ? "Co-Main Event": "Preliminary"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">{fight.division}</span>
                    <div className="w-px h-2.5 bg-zinc-800" />
                    <span className="text-[9px] font-bold text-zinc-500">{fight.rounds}R</span>
                </div>
            </div>

            {/* ── Fighter images ────────────────────────────────────────────── */}
            <div className="flex-1 grid grid-cols-2 relative min-h-0">

                {/* Fighter A */}
                <div
                    className={cn(
                        "relative h-full overflow-hidden cursor-pointer transition-all duration-300",
                        pickedA  && "bg-red-950/20",
                        pickedB  && "opacity-25 grayscale",
                        !winner  && "grayscale",
                    )}
                    onClick={() => selectWinner(fight.fighterA.id)}
                >
                    <div className="relative h-full px-4 pt-3">
                        {fight.fighterA.imagePath ? (
                            <img
                                src={fight.fighterA.imagePath}
                                alt={fight.fighterA.name}
                                className={cn(
                                    "absolute bottom-0 left-1/2 -translate-x-1/2 h-full w-auto max-w-none object-contain object-bottom transition-transform duration-300 pointer-events-none select-none",
                                    pickedA && "scale-105",
                                )}
                                draggable={false}
                            />
                        ) : (
                            <div className={cn("h-full bg-gradient-to-b to-zinc-900/60", pickedA ? "from-red-900/20" : "from-zinc-800/0")} />
                        )}
                    </div>
                    {pickedA && <div className="absolute inset-0 bg-gradient-to-t from-red-950/50 to-transparent pointer-events-none" />}
                    {flagA && (
                        <img
                            src={`https://flagcdn.com/w40/${flagA}.png`}
                            alt=""
                            className="absolute top-3 left-3 z-10 w-5 h-3.5 rounded-sm object-cover opacity-60 shadow"
                        />
                    )}
                </div>

                {/* Fighter B */}
                <div
                    className={cn(
                        "relative h-full overflow-hidden cursor-pointer transition-all duration-300",
                        pickedB  && "bg-blue-950/20",
                        pickedA  && "opacity-25 grayscale",
                        !winner  && "grayscale",
                    )}
                    onClick={() => selectWinner(fight.fighterB.id)}
                >
                    <div className="relative h-full px-4 pt-3">
                        {fight.fighterB.imagePath ? (
                            <img
                                src={fight.fighterB.imagePath}
                                alt={fight.fighterB.name}
                                className={cn(
                                    "absolute bottom-0 left-1/2 -translate-x-1/2 h-full w-auto max-w-none object-contain object-bottom scale-x-[-1] transition-transform duration-300 pointer-events-none select-none",
                                    pickedB && "scale-x-[-1.05] scale-y-[1.05]",
                                )}
                                draggable={false}
                            />
                        ) : (
                            <div className={cn("h-full bg-gradient-to-b to-zinc-900/60", pickedB ? "from-blue-900/20" : "from-zinc-800/0")} />
                        )}
                    </div>
                    {pickedB && <div className="absolute inset-0 bg-gradient-to-t from-blue-950/50 to-transparent pointer-events-none" />}
                    {flagB && (
                        <img
                            src={`https://flagcdn.com/w40/${flagB}.png`}
                            alt=""
                            className="absolute top-3 right-3 z-10 w-5 h-3.5 rounded-sm object-cover opacity-60 shadow"
                        />
                    )}
                </div>

                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />

                {/* ── Result overlay (centered on photos) ──────────────── */}
                {resultBreakdown && (
                    <>
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none z-10" />
                        <div className="absolute inset-x-0 top-[6px] flex justify-center pointer-events-none z-20">
                            <ResultCenter resultBreakdown={resultBreakdown} />
                        </div>
                    </>
                )}
            </div>

            {/* ── Fixed bottom ─────────────────────────────────────────────── */}
            <div className="shrink-0">

                {/* Names + records */}
                <div className="grid grid-cols-2 border-t border-zinc-800/60">
                    <div className={cn("px-3 py-2 border-r border-zinc-800/60 transition-opacity duration-300", pickedB && "opacity-30")}>
                        <p className="text-[11px] font-black uppercase italic text-white leading-tight truncate">{fight.fighterA.name}</p>
                        <p className={cn("text-[10px] font-bold font-mono mt-0.5 transition-colors", pickedA ? "text-red-500" : "text-zinc-500")}>
                            {fight.fighterA.wins ?? 0}-{fight.fighterA.losses ?? 0}-{fight.fighterA.draws ?? 0}
                            {(fight.fighterA.noContests ?? 0) > 0 ? ` (${fight.fighterA.noContests} NC)` : ""}
                        </p>
                    </div>
                    <div className={cn("px-3 py-2 text-right transition-opacity duration-300", pickedA && "opacity-30")}>
                        <p className="text-[11px] font-black uppercase italic text-white leading-tight truncate">{fight.fighterB.name}</p>
                        <p className={cn("text-[10px] font-bold font-mono mt-0.5 transition-colors", pickedB ? "text-blue-500" : "text-zinc-500")}>
                            {fight.fighterB.wins ?? 0}-{fight.fighterB.losses ?? 0}-{fight.fighterB.draws ?? 0}
                            {(fight.fighterB.noContests ?? 0) > 0 ? ` (${fight.fighterB.noContests} NC)` : ""}
                        </p>
                    </div>
                </div>

                {/* Stats panel */}
                <FighterStatsPanel fighterA={fight.fighterA} fighterB={fight.fighterB} winner={winner} />

                {/* Pick controls */}
                {!isLocked && (
                    <div className="px-3 pt-2 pb-3 border-t border-zinc-800/60">
                        <div className="flex gap-2">

                            {/* State: no winner OR complete → fighter buttons */}
                            {(!winner || isComplete) && (
                                <>
                                    <PickButton
                                        onClick={() => selectWinner(fight.fighterA.id)}
                                        active={pickedA}
                                        color="red"
                                        subtitle={pickedA && summary && summary !== "WIN" ? summary : null}
                                    >
                                        {pickedA && <Check className="w-3 h-3 shrink-0" />}
                                        <span className="text-[11px] font-black uppercase tracking-wide truncate">
                                            {fight.fighterA.name.split(" ").pop()}
                                        </span>
                                    </PickButton>
                                    <PickButton
                                        onClick={() => selectWinner(fight.fighterB.id)}
                                        active={pickedB}
                                        color="blue"
                                        subtitle={pickedB && summary && summary !== "WIN" ? summary : null}
                                    >
                                        {pickedB && <Check className="w-3 h-3 shrink-0" />}
                                        <span className="text-[11px] font-black uppercase tracking-wide truncate">
                                            {fight.fighterB.name.split(" ").pop()}
                                        </span>
                                    </PickButton>
                                </>
                            )}

                            {/* State: winner picked, no method → method chips */}
                            {winner && mode === "full" && !isComplete && !method && (
                                <>
                                    {BET_METHODS.map((m) => (
                                        <PickButton
                                            key={m.value}
                                            onClick={() => selectMethod(m.value)}
                                            color="neutral"
                                        >
                                            <span className="text-sm leading-none">{m.icon}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-wide">{m.short}</span>
                                        </PickButton>
                                    ))}
                                </>
                            )}

                            {/* State: method picked (non-Decision) → round chips */}
                            {winner && mode === "full" && !isComplete && method && method !== "DECISION" && (
                                <>
                                    {Array.from({ length: fight.rounds }).map((_, i) => (
                                        <PickButton
                                            key={i}
                                            onClick={() => selectRound(i + 1)}
                                            active={round === i + 1}
                                            color="neutral"
                                        >
                                            <span className="text-[11px] font-black">R{i + 1}</span>
                                        </PickButton>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Locked summary */}
                {isLocked && !resultBreakdown && (
                    <div className="px-3 py-2.5 border-t border-zinc-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Lock className="h-3 w-3 text-zinc-600" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                {winner ? "Pick Locked" : "No Pick"}
                            </span>
                        </div>
                        {winner && (
                            <span className={cn("text-[11px] font-black uppercase", pickedA ? "text-red-400" : "text-blue-400")}>
                                {pickedA ? fight.fighterA.name.split(" ").pop() : fight.fighterB.name.split(" ").pop()}
                                {summary && summary !== "WIN" ? ` · ${summary}` : ""}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
