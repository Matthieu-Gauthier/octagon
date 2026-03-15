import { cn } from "@/lib/utils";
import { Copy, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { mockLeague, mockStandings, mockEvent } from "./mockData";

export function MobileLeague() {
    const copyCode = () => {
        navigator.clipboard.writeText(mockLeague.code);
        toast.success("Code copied!");
    };

    return (
        <div className="px-4 py-5 space-y-5 pb-8">

            {/* ── League identity ─────────────────────────────────────────── */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
                {/* Title row */}
                <div className="px-4 pt-4 pb-3 border-b border-zinc-800/60">
                    <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-600">Your League</p>
                    <h1 className="text-xl font-black italic uppercase text-white mt-0.5">{mockLeague.name}</h1>
                    <div className="flex items-center gap-1.5 mt-1">
                        <Users className="w-3 h-3 text-zinc-600" />
                        <span className="text-[10px] text-zinc-500 font-bold">{mockLeague.memberCount} members</span>
                    </div>
                </div>

                {/* Invite code */}
                <button
                    onClick={copyCode}
                    className="w-full flex items-center justify-between px-4 py-3.5 active:bg-zinc-900 transition-colors"
                >
                    <div>
                        <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Invite Code</p>
                        <p className="text-xl font-black tracking-[0.3em] text-white font-mono mt-0.5">
                            {mockLeague.code}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-500">
                        <span className="text-[9px] font-bold uppercase tracking-wider">Copy</span>
                        <Copy className="w-3.5 h-3.5" />
                    </div>
                </button>
            </div>

            {/* ── Current event ───────────────────────────────────────────── */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-red-500" />
                </div>
                <div>
                    <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Current Event</p>
                    <p className="text-sm font-black uppercase text-white">{mockEvent.name}</p>
                    <p className="text-[10px] text-zinc-500 font-medium">{mockEvent.location}</p>
                </div>
            </div>

            {/* ── Scoring settings ────────────────────────────────────────── */}
            <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-600 px-1">Scoring Rules</p>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 divide-y divide-zinc-800/60">
                    {[
                        { label: "Correct Winner",  pts: mockLeague.scoringSettings.winner,   note: "Base points" },
                        { label: "Correct Method",  pts: mockLeague.scoringSettings.method,   note: "Bonus on top of winner" },
                        { label: "Correct Round",   pts: mockLeague.scoringSettings.round,    note: "Bonus on top of method" },
                    ].map(({ label, pts, note }) => (
                        <div key={label} className="flex items-center justify-between px-4 py-3">
                            <div>
                                <p className="text-[11px] font-bold text-zinc-300">{label}</p>
                                <p className="text-[9px] text-zinc-600 font-medium">{note}</p>
                            </div>
                            <p className="text-base font-black text-white">
                                {pts}
                                <span className="text-zinc-600 text-[10px] font-bold ml-0.5">pts</span>
                            </p>
                        </div>
                    ))}
                </div>
                <p className="text-[9px] text-zinc-700 px-1 font-medium">
                    Max per fight: {mockLeague.scoringSettings.winner + mockLeague.scoringSettings.method + mockLeague.scoringSettings.round} pts
                </p>
            </div>

            {/* ── Members ─────────────────────────────────────────────────── */}
            <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-600 px-1">Members</p>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 divide-y divide-zinc-800/60">
                    {mockStandings.map((entry) => (
                        <div key={entry.rank} className="flex items-center gap-3 px-4 py-3">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase shrink-0",
                                entry.isCurrentUser
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "bg-zinc-800 text-zinc-400 border border-zinc-700",
                            )}>
                                {entry.username.slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "text-[11px] font-black uppercase truncate",
                                    entry.isCurrentUser ? "text-white" : "text-zinc-400",
                                )}>
                                    {entry.username}
                                    {entry.isCurrentUser && (
                                        <span className="text-[8px] font-bold text-zinc-600 normal-case tracking-normal ml-1">you</span>
                                    )}
                                </p>
                                <p className="text-[9px] text-zinc-600 font-medium">
                                    {entry.betsPlaced} picks placed
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[11px] font-black text-zinc-400">#{entry.rank}</p>
                                <p className="text-[9px] font-bold text-zinc-600">{entry.points} pts</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
