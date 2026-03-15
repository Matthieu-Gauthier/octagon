import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Fighter } from "@/types";

// ── Private helpers ────────────────────────────────────────────────────────────

function abbrev(result: "W" | "L" | "D" | "NC", method: string): string {
    if (result === "D") return "D";
    if (result === "NC") return "NC";
    const m = method.toUpperCase();
    if (m.includes("DEC") || m.includes("DÉC")) return "DEC";
    if (m.includes("SUB") || m.includes("SOUMISSION")) return "SUB";
    if (m.includes("KO") || m.includes("TKO") || m.includes("STOPPAGE")) return "KO";
    return result;
}

function fmt(v?: string | null) {
    return v ? v.replace(/\.00$/, "") : "—";
}

function pct(n: number, total: number) {
    return total > 0 ? Math.round((n / total) * 100) : 0;
}

// ── FormDot ────────────────────────────────────────────────────────────────────

export function FormDot({
    result,
    method,
    size = "md",
    faded = false,
}: {
    result: "W" | "L" | "D" | "NC";
    method: string;
    size?: "sm" | "md" | "lg";
    faded?: boolean;
}) {
    const sz =
        size === "lg"
            ? "w-6 h-6 text-[8px]"
            : size === "sm"
                ? "w-[14px] h-[14px] text-[5px]"
                : "w-5 h-5 text-[7px]";

    const color =
        result === "W"
            ? "bg-green-500/90 text-green-950 border-green-400/40"
            : result === "L"
                ? "bg-red-500/90 text-red-950 border-red-400/40"
                : "bg-zinc-600/80 text-zinc-950 border-zinc-500/40";

    return (
        <div
            title={`${result} via ${method}`}
            className={cn(
                "rounded-full flex items-center justify-center font-black uppercase tracking-tighter border shrink-0 transition-opacity",
                sz,
                color,
                faded && "opacity-30",
            )}
        >
            {abbrev(result, method)}
        </div>
    );
}

// ── FighterStatsPanel ─────────────────────────────────────────────────────────
// V3 full always-visible layout — used by MobileFightCard

export function FighterStatsPanel({
    fighterA,
    fighterB,
    winner,
}: {
    fighterA: Fighter;
    fighterB: Fighter;
    winner: string | null;
}) {
    const totalA = (fighterA.winsByKo ?? 0) + (fighterA.winsBySub ?? 0) + (fighterA.winsByDec ?? 0);
    const totalB = (fighterB.winsByKo ?? 0) + (fighterB.winsBySub ?? 0) + (fighterB.winsByDec ?? 0);
    const hasForm = fighterA.recentForm || fighterB.recentForm;
    const hasMethods = totalA + totalB > 0;

    const chevron = (loserId: string) =>
        winner === loserId ? "text-zinc-800" : "text-zinc-700";

    return (
        <div className="border-t border-zinc-800/60 divide-y divide-zinc-800/60">
            {/* Recent form */}
            {hasForm && (
                <div className="px-3 py-2.5 space-y-1.5">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600 block">
                        Recent Form
                    </span>
                    <div className="flex items-center justify-between">
                        {/* Fighter A: oldest → newest */}
                        <div className="flex items-center gap-0.5">
                            {fighterA.recentForm
                                ? [...fighterA.recentForm].slice(0, 3).reverse().map((f, i, arr) => (
                                    <div key={i} className="flex items-center">
                                        <FormDot result={f.result} method={f.method} size="lg" faded={winner === fighterB.id} />
                                        {i < arr.length - 1 && (
                                            <ChevronRight className={cn("w-2.5 h-2.5 -mx-0.5", chevron(fighterB.id))} />
                                        )}
                                    </div>
                                ))
                                : <span className="text-[9px] text-zinc-600">—</span>}
                        </div>
                        <ChevronRight className="w-3 h-3 text-zinc-800 mx-1 shrink-0" />
                        {/* Fighter B: newest → oldest */}
                        <div className="flex items-center gap-0.5">
                            {fighterB.recentForm
                                ? fighterB.recentForm.slice(0, 3).map((f, i) => (
                                    <div key={i} className="flex items-center">
                                        {i > 0 && (
                                            <ChevronRight className={cn("w-2.5 h-2.5 -mx-0.5", chevron(fighterA.id))} />
                                        )}
                                        <FormDot result={f.result} method={f.method} size="lg" faded={winner === fighterA.id} />
                                    </div>
                                ))
                                : <span className="text-[9px] text-zinc-600">—</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* Wins by method */}
            {hasMethods && (
                <div className="px-3 py-2.5 space-y-1.5">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600 block">
                        Wins by method
                    </span>
                    {[
                        { label: "KO", a: fighterA.winsByKo ?? 0, b: fighterB.winsByKo ?? 0 },
                        { label: "SUB", a: fighterA.winsBySub ?? 0, b: fighterB.winsBySub ?? 0 },
                        { label: "DEC", a: fighterA.winsByDec ?? 0, b: fighterB.winsByDec ?? 0 },
                    ].map(({ label, a, b }) => (
                        <div key={label} className="flex items-center gap-1">
                            <span className={cn("text-[10px] font-black font-mono w-5 text-right shrink-0", winner === fighterB.id ? "text-zinc-600" : "text-zinc-200")}>{a}</span>
                            <div className="flex-1 flex justify-end h-1.5 rounded-full overflow-hidden bg-zinc-900">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500", winner === fighterB.id ? "bg-zinc-700" : "bg-red-500/70")}
                                    style={{ width: `${pct(a, totalA)}%` }}
                                />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 w-10 text-center shrink-0">{label}</span>
                            <div className="flex-1 flex justify-start h-1.5 rounded-full overflow-hidden bg-zinc-900">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500", winner === fighterA.id ? "bg-zinc-700" : "bg-blue-500/70")}
                                    style={{ width: `${pct(b, totalB)}%` }}
                                />
                            </div>
                            <span className={cn("text-[10px] font-black font-mono w-5 text-left shrink-0", winner === fighterA.id ? "text-zinc-600" : "text-zinc-200")}>{b}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Physical stats */}
            <div className="px-3 py-2.5 space-y-0.5">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600 block mb-1">
                    Physical
                </span>
                {[
                    { label: "HEIGHT", a: fmt(fighterA.height), b: fmt(fighterB.height) },
                    { label: "REACH", a: fmt(fighterA.reach), b: fmt(fighterB.reach) },
                    { label: "WEIGHT", a: fmt(fighterA.weight), b: fmt(fighterB.weight) },
                ].map(({ label, a, b }) => (
                    <div key={label} className="flex items-center w-full gap-1">
                        <span className={cn("flex-1 text-right text-[10px] font-bold font-mono truncate", winner === fighterB.id ? "text-zinc-600" : "text-zinc-200")}>{a}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 w-14 text-center shrink-0">{label}</span>
                        <span className={cn("flex-1 text-left text-[10px] font-bold font-mono truncate", winner === fighterA.id ? "text-zinc-600" : "text-zinc-200")}>{b}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── FighterStatsCenterPanel ────────────────────────────────────────────────────
// Desktop 180px center column — replaces CombinedStats in VegasFightCard

export function FighterStatsCenterPanel({
    fighterA,
    fighterB,
    winner,
}: {
    fighterA: Fighter;
    fighterB: Fighter;
    winner: string | null;
}) {
    const totalA = (fighterA.winsByKo ?? 0) + (fighterA.winsByDec ?? 0) + (fighterA.winsBySub ?? 0);
    const totalB = (fighterB.winsByKo ?? 0) + (fighterB.winsByDec ?? 0) + (fighterB.winsBySub ?? 0);
    const hasWins = totalA > 0 || totalB > 0;

    return (
        <div className="flex flex-col items-center w-full">
            {hasWins && (
                <div className="flex flex-col items-center gap-0.5 w-full mt-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">
                        Wins by Method
                    </span>
                    {[
                        { label: "KO/TKO", a: fighterA.winsByKo ?? 0, b: fighterB.winsByKo ?? 0 },
                        { label: "DEC", a: fighterA.winsByDec ?? 0, b: fighterB.winsByDec ?? 0 },
                        { label: "SUB", a: fighterA.winsBySub ?? 0, b: fighterB.winsBySub ?? 0 },
                    ].map(({ label, a, b }) => (
                        <div key={label} className="flex items-center gap-0 w-full">
                            <div className="flex items-center justify-end gap-1 w-[64px] shrink-0">
                                <span className={cn("text-[8px]", winner === fighterB.id ? "text-zinc-600" : "text-zinc-500")}>({pct(a, totalA)}%)</span>
                                <span className={cn("text-[10px] font-bold font-mono", winner === fighterB.id ? "text-zinc-600" : "text-white/80")}>{a}</span>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 w-[50px] shrink-0 text-center">{label}</span>
                            <div className="flex items-center gap-1 w-[64px] shrink-0">
                                <span className={cn("text-[10px] font-bold font-mono", winner === fighterA.id ? "text-zinc-600" : "text-white/80")}>{b}</span>
                                <span className={cn("text-[8px]", winner === fighterA.id ? "text-zinc-600" : "text-zinc-500")}>({pct(b, totalB)}%)</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-col items-center gap-0.5 opacity-90 w-full mt-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5 mt-1">
                    Physical Stats
                </span>
                {[
                    { label: "HEIGHT", a: fmt(fighterA.height), b: fmt(fighterB.height) },
                    { label: "WEIGHT", a: fmt(fighterA.weight), b: fmt(fighterB.weight) },
                    { label: "REACH", a: fmt(fighterA.reach), b: fmt(fighterB.reach) },
                ].map(({ label, a, b }) => (
                    <div key={label} className="flex items-center gap-0 w-full">
                        <div className="flex items-center justify-end w-[64px] shrink-0">
                            <span className={cn("text-[9px] font-bold font-mono w-full text-right truncate", winner === fighterB.id ? "text-zinc-600" : "text-zinc-300")}>{a}</span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500 w-[50px] shrink-0 text-center">{label}</span>
                        <div className="flex items-center justify-start w-[64px] shrink-0">
                            <span className={cn("text-[9px] font-bold font-mono w-full text-left truncate", winner === fighterA.id ? "text-zinc-600" : "text-zinc-300")}>{b}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── RecentFormRow ──────────────────────────────────────────────────────────────
// Desktop card bottom form widget — replaces RecentFormWidget in VegasFightCard

export function RecentFormRow({
    fighterA,
    fighterB,
    winner,
}: {
    fighterA: Fighter;
    fighterB: Fighter;
    winner: string | null;
}) {
    if (!fighterA.recentForm && !fighterB.recentForm) return null;

    const renderDot = (
        lf: { result: "W" | "L" | "D" | "NC"; method: string },
        fighterId: string,
        i: number,
        isMainDirLeft: boolean,
    ) => {
        const outSelected = winner && winner !== fighterId;
        const isMostRecent = isMainDirLeft ? i === 2 : i === 0;
        const isOldest = isMainDirLeft ? i === 0 : i === 2;
        const sizeClass = isMostRecent
            ? "w-[22px] h-[22px] text-[7px]"
            : isOldest
                ? "w-[16px] h-[16px] text-[5px] opacity-50"
                : "w-[18px] h-[18px] text-[6px] opacity-80";

        return (
            <div
                title={`${lf.result} via ${lf.method || "Unknown"}`}
                className={cn(
                    "flex items-center justify-center rounded-full font-black uppercase tracking-tighter shadow-md shrink-0 border transition-all",
                    sizeClass,
                    outSelected
                        ? "bg-zinc-900 border-zinc-800 text-zinc-600"
                        : lf.result === "W"
                            ? "bg-green-500/90 hover:bg-green-400 text-green-950 border-green-400/50 shadow-green-900/20"
                            : lf.result === "L"
                                ? "bg-red-500/90 hover:bg-red-400 text-red-950 border-red-400/50 shadow-red-900/20"
                                : "bg-zinc-600/90 hover:bg-zinc-500 text-zinc-950 border-zinc-500/50 shadow-black/20",
                )}
            >
                {abbrev(lf.result, lf.method || "")}
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center gap-0.5 w-full mt-1">
            <div className="flex items-center gap-0 w-full mb-1 justify-center">
                {/* Fighter A: oldest → newest (reversed) */}
                <div className="flex items-center justify-end w-[70px] gap-0 shrink-0">
                    {fighterA.recentForm && [...fighterA.recentForm].slice(0, 3).reverse().map((lf, i, arr) => (
                        <div key={i} className="flex items-center pointer-events-auto">
                            {renderDot(lf, fighterA.id, i, true)}
                            {i < arr.length - 1 && (
                                <ChevronRight className={cn("w-2.5 h-2.5 -mx-0.5 z-10", winner === fighterB.id ? "text-zinc-800" : "text-zinc-600")} />
                            )}
                        </div>
                    ))}
                </div>
                <div className="w-[40px] shrink-0" />
                {/* Fighter B: newest → oldest */}
                <div className="flex items-center justify-start w-[70px] gap-0 shrink-0">
                    {fighterB.recentForm && fighterB.recentForm.slice(0, 3).map((lf, i) => (
                        <div key={i} className="flex items-center pointer-events-auto">
                            {i > 0 && (
                                <ChevronLeft className={cn("w-2.5 h-2.5 -mx-0.5 z-10", winner === fighterA.id ? "text-zinc-800" : "text-zinc-600")} />
                            )}
                            {renderDot(lf, fighterB.id, i, false)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
