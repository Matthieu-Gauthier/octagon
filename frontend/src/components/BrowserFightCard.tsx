import { cn } from "@/lib/utils";
import { fmtHeight, fmtReach, fmtWeight } from "@/lib/fighterStats";
import { FighterFlag } from "@/components/FighterFlag";
import { RankBadge } from "@/components/RankBadge";
import { Lock } from "lucide-react";
import { FightPickControls } from "@/components/FightPickControls";
import type { Fight, Fighter } from "@/types/api";
import { ResultCenter } from "@/components/FightCard";
import type { FightCardPick, ResultBreakdown } from "@/components/FightCard";

// ── Helpers ───────────────────────────────────────────────────────────────────

function methodAbbr(method: string): string {
    const m = (method ?? "").toUpperCase();
    if (m.includes("KO") || m.includes("TKO")) return "KO";
    if (m.includes("SUB")) return "SUB";
    if (m.includes("DEC")) return "DEC";
    return "";
}

// ── Fighter photo (full-bleed) ────────────────────────────────────────────────

function FighterPhoto({
    fighter, side, dim, selected,
}: {
    fighter: Fighter;
    side: "left" | "right";
    dim: boolean;
    selected: boolean;
}) {
    return (
        <div className={cn("relative flex-1 overflow-hidden transition-all duration-300", dim && "opacity-30")}>
            {fighter.imagePath ? (
                <img
                    src={fighter.imagePath}
                    alt={fighter.name}
                    className={cn(
                        "absolute bottom-0 left-1/2 -translate-x-1/2 h-full w-auto max-w-none object-contain object-bottom pointer-events-none select-none",
                        side === "right" && "scale-x-[-1]",
                    )}
                    draggable={false}
                />
            ) : (
                <div className={cn(
                    "absolute inset-0 flex items-center justify-center",
                    side === "left"
                        ? "bg-gradient-to-br from-blue-950 to-zinc-950"
                        : "bg-gradient-to-bl from-red-950 to-zinc-950",
                )}>
                    <span className={cn(
                        "text-[80px] font-black opacity-20 select-none",
                        side === "left" ? "text-blue-400" : "text-red-400",
                    )}>
                        {fighter.name.split(" ").pop()?.[0] ?? "?"}
                    </span>
                </div>
            )}
            <div className={cn(
                "absolute inset-0",
                side === "left"
                    ? "bg-gradient-to-r from-black/10 via-transparent to-black/50"
                    : "bg-gradient-to-l from-black/10 via-transparent to-black/50",
            )} />
            {selected && (
                <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{ backgroundColor: side === "left" ? "rgba(59,130,246,0.08)" : "rgba(239,68,68,0.08)" }}
                />
            )}
        </div>
    );
}

// ── Browser Fight Card ────────────────────────────────────────────────────────

export interface BrowserFightCardProps {
    fight: Fight;
    value?: FightCardPick | null;
    onPickChange?: (pick: FightCardPick | null) => void;
    locked?: boolean;
    resultBreakdown?: ResultBreakdown;
}

export function BrowserFightCard({
    fight,
    value = null,
    onPickChange,
    locked = false,
    resultBreakdown,
}: BrowserFightCardProps) {
    const winnerId = value?.winnerId ?? null;
    const selectedA = winnerId === fight.fighterA.id;
    const selectedB = winnerId === fight.fighterB.id;
    const hasWinner = !!winnerId;

    const eventBadgeLabel = fight.isMainEvent ? "Main Event"
        : fight.isCoMainEvent ? "Co-Main"
        : fight.isMainCard    ? "Main Card"
        : "Prelims";

    const eventBadgeColor = fight.isMainEvent
        ? "text-red-500 bg-red-950/60 border-red-900/60"
        : fight.isCoMainEvent
        ? "text-orange-400 bg-orange-950/50 border-orange-900/50"
        : "text-zinc-500 bg-zinc-900 border-zinc-800";

    const cardBorder = fight.isMainEvent   ? "border-red-900/50"
        : fight.isCoMainEvent ? "border-zinc-700/60"
        : "border-zinc-800/60";

    const photoHeight = fight.isMainEvent   ? "h-[440px]"
        : fight.isCoMainEvent ? "h-[360px]"
        : "h-[300px]";

    const nameSize = fight.isMainEvent   ? "text-[28px]"
        : fight.isCoMainEvent ? "text-[22px]"
        : "text-[18px]";

    const recentForm = (f: Fighter) => (f.recentForm ?? []).slice(0, 4);

    const formBadge = (r: { result: string; method: string }) => {
        const abbr = (r.result === "W" || r.result === "L") ? methodAbbr(r.method) : r.result;
        const cls = r.result === "W"
            ? abbr === "KO"  ? "bg-red-900/60 text-red-400 border-red-800/50"
            : abbr === "SUB" ? "bg-orange-900/60 text-orange-400 border-orange-800/50"
            :                  "bg-green-900/50 text-green-400 border-green-800/40"
            : r.result === "L"
            ? abbr === "KO"  ? "bg-black/40 text-red-500/80 border-red-900/50"
            : abbr === "SUB" ? "bg-black/40 text-orange-500/70 border-orange-900/40"
            :                  "bg-black/40 text-zinc-500 border-zinc-700/60"
            :                  "bg-black/40 text-zinc-600 border-zinc-700/40";
        return { abbr: abbr || r.result, cls };
    };

    return (
        <div className={cn("w-full rounded-2xl overflow-hidden bg-zinc-950 border", cardBorder)}>

            {/* ── Top strip ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 pt-2 pb-1.5 gap-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className={cn(
                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0",
                        eventBadgeColor,
                    )}>
                        {eventBadgeLabel}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider truncate">
                        {fight.division}
                    </span>
                    <span className="text-[9px] font-black text-zinc-700 shrink-0 ml-auto uppercase tracking-wider">
                        {fight.rounds} ROUNDS
                    </span>
                </div>
                {locked && (
                    <span className="flex items-center gap-1 text-[9px] font-black text-zinc-600 shrink-0">
                        <Lock className="w-3 h-3" /> Locked
                    </span>
                )}
            </div>

            {/* ── Hero: photos + everything overlaid ────────────────────── */}
            <div className={cn("relative flex overflow-hidden", photoHeight)}>

                {/* Photos */}
                <FighterPhoto fighter={fight.fighterA} side="left"  dim={hasWinner && !selectedA} selected={selectedA} />
                <div className="absolute inset-y-0 left-1/2 w-px bg-white/5 pointer-events-none z-10" />
                <FighterPhoto fighter={fight.fighterB} side="right" dim={hasWinner && !selectedB} selected={selectedB} />

                {/* Gradient */}
                <div className="absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-20" />

                {/* Overlay content */}
                <div className="absolute inset-x-0 bottom-0 z-30 px-4 pb-4 space-y-3">

                    {resultBreakdown ? (
                        <ResultCenter resultBreakdown={resultBreakdown} showDetails />
                    ) : (
                        <div className="space-y-0.5">

                        <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest text-center pb-0.5">Wins by method</p>
                        {([
                            { label: "KO",  a: String(fight.fighterA.winsByKo  ?? 0), b: String(fight.fighterB.winsByKo  ?? 0) },
                            { label: "SUB", a: String(fight.fighterA.winsBySub ?? 0), b: String(fight.fighterB.winsBySub ?? 0) },
                            { label: "DEC", a: String(fight.fighterA.winsByDec ?? 0), b: String(fight.fighterB.winsByDec ?? 0) },
                        ] as { label: string; a: string; b: string }[]).map(({ label, a, b }) => (
                            <div key={label} className="flex items-center justify-center">
                                <span className="text-[11px] font-black text-zinc-300 w-16 text-right tabular-nums">{a}</span>
                                <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest w-12 text-center shrink-0">{label}</span>
                                <span className="text-[11px] font-black text-zinc-300 w-16 text-left tabular-nums">{b}</span>
                            </div>
                        ))}

                        <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest text-center pt-2.5 pb-0.5">Physical stats</p>
                        {([
                            { label: "Age",    a: fight.fighterA.age    != null ? String(fight.fighterA.age)    : null, b: fight.fighterB.age    != null ? String(fight.fighterB.age)    : null },
                            { label: "Height", a: fmtHeight(fight.fighterA.height) ?? null, b: fmtHeight(fight.fighterB.height) ?? null },
                            { label: "Reach",  a: fmtReach(fight.fighterA.reach)   ?? null, b: fmtReach(fight.fighterB.reach)   ?? null },
                            { label: "Weight", a: fmtWeight(fight.fighterA.weight) ?? null, b: fmtWeight(fight.fighterB.weight) ?? null },
                        ] as { label: string; a: string | null; b: string | null }[]).map(({ label, a, b }) => {
                            if (a === null && b === null) return null;
                            return (
                                <div key={label} className="flex items-center justify-center">
                                    <span className="text-[11px] font-black text-zinc-300 w-16 text-right tabular-nums">{a ?? "—"}</span>
                                    <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest w-12 text-center shrink-0">{label}</span>
                                    <span className="text-[11px] font-black text-zinc-300 w-16 text-left tabular-nums">{b ?? "—"}</span>
                                </div>
                            );
                        })}
                        </div>
                    )}

                    {/* Names + records + form */}
                    <div>
                        {/* Row 1: names + nicknames */}
                        <div className="flex justify-between">
                            {/* Fighter A (left): flag · name · (nickname) · (rank badge) */}
                            <div className="flex items-center gap-1.5">
                                <FighterFlag hometown={fight.fighterA.hometown} />
                                <p className={cn(
                                    "font-black uppercase tracking-tight leading-none drop-shadow-lg transition-colors",
                                    nameSize,
                                    selectedA ? "text-blue-300" : "text-white",
                                )}>
                                    {fight.fighterA.name.split(" ").pop()}
                                </p>
                                {fight.fighterA.nickname && (
                                    <span className="text-[13px] italic uppercase text-zinc-400 leading-none font-semibold">"{fight.fighterA.nickname}"</span>
                                )}
                                <RankBadge fighter={fight.fighterA} />
                            </div>
                            {/* Fighter B (right): (rank badge) · (nickname) · name · flag */}
                            <div className="flex items-center gap-1.5">
                                <RankBadge fighter={fight.fighterB} />
                                {fight.fighterB.nickname && (
                                    <span className="text-[13px] italic uppercase text-zinc-400 leading-none font-semibold">"{fight.fighterB.nickname}"</span>
                                )}
                                <p className={cn(
                                    "font-black uppercase tracking-tight leading-none drop-shadow-lg transition-colors",
                                    nameSize,
                                    selectedB ? "text-red-300" : "text-white",
                                )}>
                                    {fight.fighterB.name.split(" ").pop()}
                                </p>
                                <FighterFlag hometown={fight.fighterB.hometown} />
                            </div>
                        </div>

                        {/* Row 2: W-L-D | form centered | W-L-D */}
                        <div className="grid grid-cols-3 items-center mt-1">
                            <p className="text-[10px] font-bold text-zinc-500">
                                {fight.fighterA.wins}-{fight.fighterA.losses}-{fight.fighterA.draws}
                            </p>
                            <div className={cn("flex items-center justify-center gap-1", resultBreakdown && "invisible")}>
                                    <div className="flex gap-0.5 opacity-30">
                                        {recentForm(fight.fighterA).slice(1).reverse().map((r, i) => {
                                            const { abbr, cls } = formBadge(r);
                                            return <div key={i} className={cn("w-6 h-4 rounded border flex items-center justify-center text-[7px] font-black backdrop-blur-sm", cls)}>{abbr}</div>;
                                        })}
                                    </div>
                                    <div className="w-px h-3.5 bg-zinc-600/60 shrink-0" />
                                    {recentForm(fight.fighterA)[0] && (() => {
                                        const { abbr, cls } = formBadge(recentForm(fight.fighterA)[0]);
                                        return <div className={cn("w-6 h-4 rounded border flex items-center justify-center text-[7px] font-black backdrop-blur-sm", cls)}>{abbr}</div>;
                                    })()}
                                    <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest px-1.5">Form</span>
                                    {recentForm(fight.fighterB)[0] && (() => {
                                        const { abbr, cls } = formBadge(recentForm(fight.fighterB)[0]);
                                        return <div className={cn("w-6 h-4 rounded border flex items-center justify-center text-[7px] font-black backdrop-blur-sm", cls)}>{abbr}</div>;
                                    })()}
                                    <div className="w-px h-3.5 bg-zinc-600/60 shrink-0" />
                                    <div className="flex gap-0.5 opacity-30">
                                        {recentForm(fight.fighterB).slice(1).map((r, i) => {
                                            const { abbr, cls } = formBadge(r);
                                            return <div key={i} className={cn("w-6 h-4 rounded border flex items-center justify-center text-[7px] font-black backdrop-blur-sm", cls)}>{abbr}</div>;
                                        })}
                                    </div>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-500 text-right">
                                {fight.fighterB.wins}-{fight.fighterB.losses}-{fight.fighterB.draws}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Pick controls ─────────────────────────────────────────── */}
            {!resultBreakdown && (
                <FightPickControls
                    fight={fight}
                    value={value}
                    onPickChange={onPickChange ?? (() => {})}
                    locked={locked}
                    resultBreakdown={resultBreakdown}
                />
            )}
        </div>
    );
}
