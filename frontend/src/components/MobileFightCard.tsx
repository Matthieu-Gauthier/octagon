import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
    Check,
    ChevronLeft,
    Flame,
    Lock,
    RotateCcw,
    Shield,
} from "lucide-react";
import { getFlagForHometown } from "@/lib/flags";
import type { Fight } from "@/types";
import type { FightCardPick } from "./FightCard";
import { FighterStatsPanel } from "./FighterStats";

// ============================================================================
// Types
// ============================================================================
type BetMethod = "KO/TKO" | "SUBMISSION" | "DECISION";

const BET_METHODS: { value: BetMethod; short: string; icon: string }[] = [
    { value: "KO/TKO", short: "KO/TKO", icon: "💥" },
    { value: "SUBMISSION", short: "SUB", icon: "🔒" },
    { value: "DECISION", short: "DEC", icon: "📋" },
];

export interface MobileFightCardProps {
    fight: Fight;
    mode?: "full" | "winner";
    value?: FightCardPick | null;
    onPickChange?: (pick: FightCardPick | null) => void;
    locked?: boolean;
    lockAt?: string | null;
}

// ============================================================================
// Fighter image sub-component
// ============================================================================
function FighterImage({
    src,
    alt,
    mirrored,
    dimmed,
    highlighted,
    color,
}: {
    src: string;
    alt: string;
    mirrored?: boolean;
    dimmed?: boolean;
    highlighted?: boolean;
    color: "red" | "blue";
}) {
    return (
        <div
            className={cn(
                "relative h-full w-full overflow-hidden transition-all duration-300",
                dimmed && "opacity-25 grayscale",
                highlighted && color === "red" && "bg-red-900/15",
                highlighted && color === "blue" && "bg-blue-900/15",
                !highlighted && !dimmed && "grayscale",
            )}
        >
            <img
                src={src || "/fighter-silhouette.png"}
                alt={alt}
                className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2 h-full w-auto max-w-none object-contain object-bottom transition-transform duration-300",
                    mirrored && "scale-x-[-1]",
                    highlighted && !mirrored && "scale-110",
                    highlighted && mirrored && "scale-x-[-1.1] scale-y-[1.1]",
                )}
            />
            {highlighted && (
                <div
                    className={cn(
                        "absolute inset-0 bg-gradient-to-t to-transparent pointer-events-none",
                        color === "red" ? "from-red-950/70" : "from-blue-950/70",
                    )}
                />
            )}
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================
export function MobileFightCard({
    fight,
    mode = "full",
    value = null,
    onPickChange,
    locked = false,
    lockAt,
}: MobileFightCardProps) {
    const [winner, setWinner] = useState<string | null>(value?.winnerId ?? null);
    const [method, setMethod] = useState<BetMethod | null>((value?.method as BetMethod) ?? null);
    const [round, setRound] = useState<number | null>(value?.round ?? null);

    const isLocked = locked || (!!lockAt && new Date() >= new Date(lockAt));

    useEffect(() => {
        setWinner(value?.winnerId ?? null);
        setMethod((value?.method as BetMethod) ?? null);
        setRound(value?.round ?? null);
    }, [value?.winnerId, value?.method, value?.round]);

    const isComplete =
        mode === "winner"
            ? !!winner
            : !!winner && !!method && (method === "DECISION" || !!round);

    const notify = (w: string | null, m: BetMethod | null, r: number | null) => {
        onPickChange?.(w ? { winnerId: w, method: m ?? undefined, round: r ?? undefined } : null);
    };

    const selectWinner = (id: string) => {
        if (isLocked) return;
        if (winner === id) {
            setWinner(null); setMethod(null); setRound(null);
            notify(null, null, null);
        } else {
            setWinner(id); setMethod(null); setRound(null);
            notify(id, null, null);
        }
    };

    const selectMethod = (m: BetMethod) => {
        if (isLocked || !winner) return;
        const next = method === m ? null : m;
        setMethod(next); setRound(null);
        notify(winner, next, null);
    };

    const selectRound = (r: number) => {
        if (isLocked || !winner) return;
        const next = round === r ? null : r;
        setRound(next);
        notify(winner, method, next);
    };

    const reset = (e?: React.MouseEvent) => {
        if (isLocked) return;
        e?.stopPropagation();
        setWinner(null); setMethod(null); setRound(null);
        notify(null, null, null);
    };

    const getSummary = () => {
        if (!winner) return null;
        if (mode === "winner") return "WIN";
        if (!method) return null;
        if (method === "DECISION") return "Decision";
        return `${method === "SUBMISSION" ? "Submission" : method} · R${round}`;
    };

    const pickedA = winner === fight.fighterA.id;
    const pickedB = winner === fight.fighterB.id;

    let eventType: "main" | "comain" | "standard" = "standard";
    if (fight.isMainEvent) eventType = "main";
    else if (fight.isCoMainEvent) eventType = "comain";

    const flagA = getFlagForHometown(fight.fighterA.hometown);
    const flagB = getFlagForHometown(fight.fighterB.hometown);

    return (
        <div
            className={cn(
                "w-full rounded-2xl overflow-hidden bg-zinc-950 shadow-xl border",
                eventType === "main"
                    ? "border-red-500/40"
                    : eventType === "comain"
                        ? "border-zinc-700"
                        : "border-zinc-800",
            )}
        >
            {/* ── HEADER ───────────────────────────────────────────────────── */}
            <div
                className={cn(
                    "flex items-center justify-between px-3 py-1.5 border-b",
                    eventType === "main"
                        ? "bg-gradient-to-r from-zinc-950/95 via-red-950/90 to-zinc-950/95 border-red-500/20"
                        : eventType === "comain"
                            ? "bg-gradient-to-r from-zinc-950/95 via-zinc-900/90 to-zinc-950/95 border-zinc-700/50"
                            : "bg-zinc-950/80 border-zinc-800/60",
                )}
            >
                <div className="flex items-center gap-1.5 min-w-0">
                    {eventType === "main" && (
                        <Flame className="h-3 w-3 shrink-0 text-red-500 fill-red-500/20" />
                    )}
                    {eventType === "comain" && (
                        <Shield className="h-3 w-3 shrink-0 text-zinc-400 fill-zinc-400/10" />
                    )}
                    <span
                        className={cn(
                            "text-[9px] font-black tracking-[0.2em] uppercase truncate",
                            eventType === "main"
                                ? "text-red-100"
                                : eventType === "comain"
                                    ? "text-zinc-300"
                                    : "text-zinc-500",
                        )}
                    >
                        {eventType === "main"
                            ? "Main Event"
                            : eventType === "comain"
                                ? "Co-Main Event"
                                : fight.division}
                    </span>
                </div>

                {lockAt && (
                    <div
                        className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] border shrink-0",
                            isLocked
                                ? "bg-zinc-950/80 border-zinc-800"
                                : "bg-zinc-950/60 border-zinc-700/50",
                        )}
                    >
                        <Lock className="h-2 w-2 text-zinc-500" />
                        {isLocked ? (
                            <span className="font-bold uppercase tracking-wider text-zinc-500">
                                Locked
                            </span>
                        ) : (
                            <span className="text-zinc-200 font-bold">
                                {new Date(lockAt)
                                    .toLocaleString("en-US", {
                                        weekday: "short",
                                        day: "numeric",
                                        hour: "numeric",
                                        timeZoneName: "short",
                                    })
                                    .replace(",", "")}
                            </span>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-1 shrink-0">
                    {eventType !== "standard" && (
                        <Badge
                            variant="outline"
                            className={cn(
                                "h-5 bg-black/40 text-[10px] font-bold px-2 py-0.5 uppercase tracking-tight",
                                eventType === "main"
                                    ? "border-red-500/20 text-red-100/80"
                                    : "border-zinc-700 text-zinc-300",
                            )}
                        >
                            {fight.division}
                        </Badge>
                    )}
                    <Badge
                        variant="outline"
                        className={cn(
                            "h-5 bg-black/40 text-[10px] font-bold px-2 py-0.5 uppercase tracking-tight",
                            eventType === "main"
                                ? "border-red-500/20 text-red-100/80"
                                : eventType === "comain"
                                    ? "border-zinc-700 text-zinc-300"
                                    : "border-zinc-800 text-zinc-400",
                        )}
                    >
                        {fight.rounds}R
                    </Badge>
                </div>
            </div>

            {/* ── FIGHTER IMAGES ───────────────────────────────────────────── */}
            <div className="grid grid-cols-2 h-[148px] relative">
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-lg">
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">
                            VS
                        </span>
                    </div>
                </div>

                {flagA && (
                    <div className="absolute top-2 left-2 z-10 pointer-events-none">
                        <img
                            src={`https://flagcdn.com/w40/${flagA}.png`}
                            alt=""
                            className="w-6 h-4 rounded-sm object-cover shadow opacity-75"
                        />
                    </div>
                )}
                {flagB && (
                    <div className="absolute top-2 right-2 z-10 pointer-events-none">
                        <img
                            src={`https://flagcdn.com/w40/${flagB}.png`}
                            alt=""
                            className="w-6 h-4 rounded-sm object-cover shadow opacity-75"
                        />
                    </div>
                )}

                <FighterImage
                    src={fight.fighterA.imagePath || ""}
                    alt={fight.fighterA.name}
                    highlighted={pickedA}
                    dimmed={pickedB}
                    color="red"
                />
                <FighterImage
                    src={fight.fighterB.imagePath || ""}
                    alt={fight.fighterB.name}
                    mirrored
                    highlighted={pickedB}
                    dimmed={pickedA}
                    color="blue"
                />
            </div>

            {/* ── NAMES & RECORDS ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 border-t border-zinc-800/60">
                <div
                    className={cn(
                        "px-3 py-2 border-r border-zinc-800/60 transition-opacity duration-300",
                        pickedB && "opacity-30",
                    )}
                >
                    <p className="text-[11px] font-black uppercase italic text-white leading-tight truncate">
                        {fight.fighterA.name}
                    </p>
                    <p
                        className={cn(
                            "text-[10px] font-bold font-mono mt-0.5 transition-colors duration-300",
                            pickedA ? "text-red-500" : "text-zinc-500",
                        )}
                    >
                        {fight.fighterA.wins ?? 0}-{fight.fighterA.losses ?? 0}
                        {(fight.fighterA.noContests ?? 0) > 0
                            ? `-${fight.fighterA.noContests}`
                            : ""}
                    </p>
                </div>
                <div
                    className={cn(
                        "px-3 py-2 text-right transition-opacity duration-300",
                        pickedA && "opacity-30",
                    )}
                >
                    <p className="text-[11px] font-black uppercase italic text-white leading-tight truncate">
                        {fight.fighterB.name}
                    </p>
                    <p
                        className={cn(
                            "text-[10px] font-bold font-mono mt-0.5 transition-colors duration-300",
                            pickedB ? "text-blue-500" : "text-zinc-500",
                        )}
                    >
                        {fight.fighterB.wins ?? 0}-{fight.fighterB.losses ?? 0}
                        {(fight.fighterB.noContests ?? 0) > 0
                            ? `-${fight.fighterB.noContests}`
                            : ""}
                    </p>
                </div>
            </div>

            {/* ── STATS SECTION ────────────────────────────────────────────── */}
            <FighterStatsPanel
                fighterA={fight.fighterA}
                fighterB={fight.fighterB}
                winner={winner}
            />

            {/* ── PICK CONTROLS (unlocked) ─────────────────────────────────── */}
            {!isLocked && (
                <div className="px-3 pb-3 pt-2 border-t border-zinc-800/60 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => selectWinner(fight.fighterA.id)}
                            className={cn(
                                "flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all active:scale-95 border",
                                pickedA
                                    ? "bg-red-500/20 border-red-500/50 text-red-300"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200",
                            )}
                        >
                            {pickedA && <Check className="w-3 h-3 shrink-0" />}
                            <span className="truncate">
                                {fight.fighterA.name.split(" ").pop()}
                            </span>
                        </button>
                        <button
                            onClick={() => selectWinner(fight.fighterB.id)}
                            className={cn(
                                "flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all active:scale-95 border",
                                pickedB
                                    ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200",
                            )}
                        >
                            {pickedB && <Check className="w-3 h-3 shrink-0" />}
                            <span className="truncate">
                                {fight.fighterB.name.split(" ").pop()}
                            </span>
                        </button>
                    </div>

                    {winner && mode === "full" && !isComplete && (
                        <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
                            {!method ? (
                                <div className="flex gap-1.5">
                                    {BET_METHODS.map((m) => (
                                        <button
                                            key={m.value}
                                            onClick={() => selectMethod(m.value)}
                                            className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white transition-all active:scale-95"
                                        >
                                            <span className="text-base leading-none">{m.icon}</span>
                                            <span>{m.short}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : method !== "DECISION" ? (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => { setMethod(null); setRound(null); }}
                                            className="flex items-center gap-0.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                                        >
                                            <ChevronLeft className="h-3 w-3" />
                                            Back
                                        </button>
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                                            Which round?
                                        </span>
                                        <div className="w-12" />
                                    </div>
                                    <div className="flex gap-1.5">
                                        {Array.from({ length: fight.rounds }).map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => selectRound(i + 1)}
                                                className={cn(
                                                    "flex-1 py-2 rounded-xl text-[11px] font-black border transition-all active:scale-95",
                                                    round === i + 1
                                                        ? "bg-white/10 border-white/20 text-white"
                                                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white",
                                                )}
                                            >
                                                R{i + 1}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {isComplete && (
                        <div className="flex items-center justify-between px-1 animate-in fade-in duration-200">
                            <div className="flex items-center gap-1.5">
                                <div className="bg-green-500 rounded-full p-0.5 shrink-0">
                                    <Check className="h-2.5 w-2.5 text-black" />
                                </div>
                                <span className="text-[11px] font-black text-green-400 uppercase tracking-wider">
                                    {getSummary()}
                                </span>
                            </div>
                            <button
                                onClick={reset}
                                className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-red-400 transition-colors"
                            >
                                <RotateCcw className="h-3 w-3" />
                                Change
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── LOCKED SUMMARY ───────────────────────────────────────────── */}
            {isLocked && (
                <div className="px-3 py-2.5 border-t border-zinc-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-zinc-600" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            {winner ? "Pick Locked" : "No Pick"}
                        </span>
                    </div>
                    {winner && (
                        <span
                            className={cn(
                                "text-[11px] font-black uppercase",
                                pickedA ? "text-red-400" : "text-blue-400",
                            )}
                        >
                            {pickedA
                                ? fight.fighterA.name.split(" ").pop()
                                : fight.fighterB.name.split(" ").pop()}
                            {getSummary() && getSummary() !== "WIN"
                                ? ` · ${getSummary()}`
                                : ""}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
