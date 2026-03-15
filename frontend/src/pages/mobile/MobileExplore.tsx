import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeagueData, calcFightPoints } from "@/hooks/useLeagueData";
import type { Fight } from "@/types/api";

export function MobileExplore({ eventId, defaultUserId }: { eventId?: string; defaultUserId?: string }) {
    const { leagueId = "" } = useParams();
    const {
        standings,
        fights,
        scoring,
        currentUserId,
        getUserName,
        getBetsForUser,
        currentEvent,
    } = useLeagueData(leagueId, eventId);

    const isFightLocked = (fight: Fight) => {
        if (fight.status === "FINISHED") return true;
        const lockAt = fight.isPrelim
            ? currentEvent?.prelimsStartAt
            : currentEvent?.mainCardStartAt;
        return lockAt ? new Date() >= new Date(lockAt) : false;
    };

    const [selectedIdx, setSelectedIdx] = useState(0);

    // Sync to defaultUserId when standings load or defaultUserId changes
    useEffect(() => {
        if (!defaultUserId || standings.length === 0) return;
        const idx = standings.findIndex(s => s.userId === defaultUserId);
        if (idx !== -1) setSelectedIdx(idx);
    }, [defaultUserId, standings]);

    const selected       = standings[selectedIdx];
    const selectedUserId = selected?.userId ?? "";
    const selectedIsMe   = selectedUserId === currentUserId;
    const userBets       = getBetsForUser(selectedUserId);

    return (
        <div className="h-full flex flex-col overflow-hidden">

            {/* ── Player selector ─────────────────────────────────────────── */}
            <div className="shrink-0 flex items-center gap-2 px-3 py-3 border-b border-zinc-900/50 bg-black">
                <button
                    onClick={() => setSelectedIdx(i => Math.max(0, i - 1))}
                    disabled={selectedIdx === 0}
                    className="p-1 text-zinc-500 disabled:opacity-20 active:text-zinc-200 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex-1 text-center">
                    <p className={cn(
                        "text-[13px] font-black uppercase tracking-tight leading-none",
                        selectedIsMe ? "text-white" : "text-zinc-300",
                    )}>
                        {getUserName(selectedUserId)}
                        {selectedIsMe && (
                            <span className="text-zinc-600 font-bold text-[9px] ml-1.5">you</span>
                        )}
                    </p>
                    <p className="text-[9px] text-zinc-600 font-bold mt-1">
                        #{selectedIdx + 1} · {selected?.points ?? 0} pts · {selected?.perfect ?? 0} perfect
                    </p>
                </div>

                <button
                    onClick={() => setSelectedIdx(i => Math.min(standings.length - 1, i + 1))}
                    disabled={selectedIdx >= standings.length - 1}
                    className="p-1 text-zinc-500 disabled:opacity-20 active:text-zinc-200 transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* ── Picks list ──────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto overscroll-none px-4 py-3 space-y-2">
                {fights.length === 0 && (
                    <p className="text-center text-zinc-600 text-xs font-bold uppercase tracking-widest pt-12">
                        No fights yet
                    </p>
                )}

                {fights.map((fight: Fight) => {
                    const locked = isFightLocked(fight);
                    // For other users: hide pick until fight is locked
                    const pickVisible = selectedIsMe || locked;

                    const bet = pickVisible ? userBets.find(b => b.fightId === fight.id) : undefined;
                    const isFinished = fight.status === "FINISHED" && !!fight.winnerId;
                    const { points, winnerCorrect, methodCorrect } = calcFightPoints(fight, bet, scoring);

                    const pickedFighter = bet
                        ? (bet.winnerId === fight.fighterA.id ? fight.fighterA : fight.fighterB)
                        : null;

                    const isPerfect = winnerCorrect && methodCorrect &&
                        (bet?.method === "DECISION" || bet?.method === "DRAW" || bet?.round === fight.round);

                    const methodLabel = bet?.method === "DECISION" ? "DEC"
                        : bet?.method === "SUBMISSION" ? "SUB"
                        : bet?.method === "KO/TKO" ? "KO"
                        : null;

                    const resultFighter = isFinished && fight.winnerId
                        ? (fight.winnerId === fight.fighterA.id ? fight.fighterA : fight.fighterB)
                        : null;

                    return (
                        <div
                            key={fight.id}
                            className={cn(
                                "rounded-2xl border px-4 py-3 flex items-center gap-3",
                                isPerfect                    && "border-green-900/60 bg-green-950/20",
                                !isPerfect && points > 0     && "border-amber-900/40 bg-amber-950/10",
                                isFinished && !bet           && "border-zinc-800/40 bg-zinc-950 opacity-50",
                                !pickVisible                 && "border-zinc-800/40 bg-zinc-950",
                                (!isPerfect && points === 0 && (!isFinished || !bet) && pickVisible) && "border-zinc-800/60 bg-zinc-950",
                            )}
                        >
                            {/* Status dot */}
                            <div className={cn(
                                "w-2 h-2 rounded-full shrink-0",
                                !pickVisible               && "bg-zinc-800",
                                pickVisible && isPerfect   && "bg-green-500",
                                pickVisible && !isPerfect && points > 0  && "bg-amber-500",
                                pickVisible && isFinished && points === 0 && bet && "bg-red-500/50",
                                pickVisible && !isFinished && bet && "bg-zinc-600",
                                pickVisible && !bet        && "bg-zinc-800",
                            )} />

                            <div className="flex-1 min-w-0">
                                {/* Matchup */}
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide truncate">
                                    {fight.fighterA.name.split(" ").pop()} vs {fight.fighterB.name.split(" ").pop()}
                                </p>

                                {/* Pick — hidden until locked */}
                                {!pickVisible ? (
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Lock className="w-2.5 h-2.5 text-zinc-700" />
                                        <p className="text-[10px] font-bold text-zinc-700">Hidden until locked</p>
                                    </div>
                                ) : pickedFighter ? (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <p className={cn(
                                            "text-[12px] font-black uppercase tracking-tight",
                                            isPerfect           ? "text-green-400"   :
                                            points > 0          ? "text-amber-400"   :
                                            isFinished && bet   ? "text-red-400/70"  : "text-white",
                                        )}>
                                            {pickedFighter.name.split(" ").pop()}
                                        </p>
                                        {methodLabel && (
                                            <span className="text-[9px] font-bold text-zinc-500">
                                                · {methodLabel}{bet?.round ? ` R${bet.round}` : ""}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-[11px] font-bold text-zinc-600 mt-0.5">No pick</p>
                                )}
                            </div>

                            <div className="text-right shrink-0 space-y-0.5">
                                {/* Points earned */}
                                {isFinished && pickVisible && (
                                    <p className={cn(
                                        "text-[12px] font-black leading-none",
                                        isPerfect  ? "text-green-400" :
                                        points > 0 ? "text-amber-400" : "text-zinc-600",
                                    )}>
                                        +{points}
                                    </p>
                                )}
                                {/* Official result */}
                                {resultFighter && (
                                    <p className="text-[9px] font-bold text-zinc-500">
                                        {resultFighter.name.split(" ").pop()}
                                        {fight.method ? ` · ${
                                            fight.method === "DECISION" ? "DEC" :
                                            fight.method === "SUBMISSION" ? "SUB" : "KO"
                                        }${fight.round && fight.method !== "DECISION" ? ` R${fight.round}` : ""}` : ""}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
