import { useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLeagueData } from "@/hooks/useLeagueData";

const MEDAL = ["🥇", "🥈", "🥉"] as const;

export function MobileStandings({ eventId, onSelectUser }: { eventId?: string; onSelectUser?: (userId: string) => void }) {
    const { leagueId = "" } = useParams();
    const { standings, scoring, currentUserId, getUserName } = useLeagueData(leagueId, eventId);

    const maxPoints = standings[0]?.points ?? 1;

    return (
        <div className="h-full overflow-y-auto overscroll-none">
            <div className="px-4 py-4 space-y-4 pb-8">

                {/* ── Scoring key ─────────────────────────────────────────── */}
                <div className="flex gap-px overflow-hidden rounded-xl border border-zinc-800/60">
                    {[
                        { label: "Winner", pts: `${scoring.winner}`  },
                        { label: "Method", pts: `+${scoring.method}` },
                        { label: "Round",  pts: `+${scoring.round}`  },
                    ].map(({ label, pts }, i) => (
                        <div key={label} className={cn(
                            "flex-1 flex flex-col items-center py-2.5 bg-zinc-950",
                            i > 0 && "border-l border-zinc-800/60",
                        )}>
                            <p className="text-[13px] font-black text-white">
                                {pts} <span className="text-zinc-600 text-[10px] font-bold">pts</span>
                            </p>
                            <p className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>

                {/* ── Leaderboard ─────────────────────────────────────────── */}
                <div className="space-y-2">
                    {standings.map((entry, idx) => {
                        const isMe = entry.userId === currentUserId;
                        return (
                            <div
                                key={entry.userId}
                                onClick={() => onSelectUser?.(entry.userId)}
                                className={cn(
                                    "rounded-2xl border overflow-hidden transition-colors",
                                    onSelectUser && "cursor-pointer active:bg-zinc-800",
                                    isMe ? "border-zinc-600 bg-zinc-900" : "border-zinc-900 bg-zinc-950",
                                )}
                            >
                                <div className="flex items-center gap-3 px-3.5 py-3">
                                    {/* Rank */}
                                    <div className="w-8 text-center shrink-0">
                                        {idx < 3 ? (
                                            <span className="text-xl leading-none">{MEDAL[idx]}</span>
                                        ) : (
                                            <span className="text-[11px] font-black text-zinc-600">#{idx + 1}</span>
                                        )}
                                    </div>

                                    {/* Name + progress */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-1.5">
                                            <p className={cn(
                                                "text-[12px] font-black uppercase tracking-tight truncate",
                                                isMe ? "text-white" : "text-zinc-300",
                                            )}>
                                                {getUserName(entry.userId)}
                                            </p>
                                            {isMe && (
                                                <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider shrink-0">you</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-700",
                                                        isMe ? "bg-red-500/70" : "bg-zinc-600",
                                                    )}
                                                    style={{ width: `${(entry.points / maxPoints) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[8px] font-bold text-zinc-600 shrink-0">
                                                {entry.correct}/{entry.total}
                                            </span>
                                            {entry.perfect > 0 && (
                                                <span className="text-[8px] font-black text-yellow-600 shrink-0">
                                                    ✦{entry.perfect}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Points */}
                                    <div className="text-right shrink-0">
                                        <p className={cn(
                                            "text-xl font-black leading-none",
                                            idx === 0 ? "text-yellow-500" : isMe ? "text-white" : "text-zinc-300",
                                        )}>
                                            {entry.points}
                                        </p>
                                        <p className="text-[8px] text-zinc-600 uppercase tracking-wider font-bold mt-0.5">pts</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {standings.length === 0 && (
                        <p className="text-center text-zinc-600 text-xs font-bold uppercase tracking-widest py-8">
                            No picks yet
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
