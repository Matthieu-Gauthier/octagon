import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, X, Target } from "lucide-react";

/**
 * SHOWCASE — Dot Matrix Grid variants with fight results visible.
 */

// ============================================================================
// MOCK DATA
// ============================================================================
interface PickRow {
    fightLabel: string;
    myPick: { winner: string; method?: string; round?: number };
    result: { winner: string; method: string; round?: number };
    scoring: { winnerCorrect: boolean; methodCorrect: boolean; roundCorrect: boolean; points: number };
}

const mockPicks: PickRow[] = [
    {
        fightLabel: "Bautista vs Oliveira",
        myPick: { winner: "Bautista", method: "SUB", round: 2 },
        result: { winner: "Bautista", method: "SUB", round: 2 },
        scoring: { winnerCorrect: true, methodCorrect: true, roundCorrect: true, points: 25 },
    },
    {
        fightLabel: "Horiguchi vs Albazi",
        myPick: { winner: "Horiguchi", method: "DEC" },
        result: { winner: "Horiguchi", method: "DEC" },
        scoring: { winnerCorrect: true, methodCorrect: true, roundCorrect: false, points: 15 },
    },
    {
        fightLabel: "Kuniev vs Almeida",
        myPick: { winner: "Almeida" },
        result: { winner: "Kuniev", method: "DEC" },
        scoring: { winnerCorrect: false, methodCorrect: false, roundCorrect: false, points: 0 },
    },
    {
        fightLabel: "Oleksiejczuk vs Barriault",
        myPick: { winner: "Oleksiejczuk", method: "KO" },
        result: { winner: "Oleksiejczuk", method: "DEC" },
        scoring: { winnerCorrect: true, methodCorrect: false, roundCorrect: false, points: 10 },
    },
    {
        fightLabel: "Basharat vs Matsumoto",
        myPick: { winner: "Basharat", method: "DEC" },
        result: { winner: "Basharat", method: "DEC" },
        scoring: { winnerCorrect: true, methodCorrect: true, roundCorrect: false, points: 15 },
    },
    {
        fightLabel: "Jacoby vs Walker",
        myPick: { winner: "Jacoby", method: "KO", round: 2 },
        result: { winner: "Jacoby", method: "KO", round: 2 },
        scoring: { winnerCorrect: true, methodCorrect: true, roundCorrect: true, points: 25 },
    },
    {
        fightLabel: "Donchenko vs Morono",
        myPick: { winner: "Morono" },
        result: { winner: "Donchenko", method: "DEC" },
        scoring: { winnerCorrect: false, methodCorrect: false, roundCorrect: false, points: 0 },
    },
    {
        fightLabel: "Veretennikov vs Price",
        myPick: { winner: "Veretennikov", method: "KO" },
        result: { winner: "Veretennikov", method: "KO", round: 1 },
        scoring: { winnerCorrect: true, methodCorrect: true, roundCorrect: false, points: 15 },
    },
];

const totalPoints = mockPicks.reduce((s, p) => s + p.scoring.points, 0);
const totalCorrect = mockPicks.filter(p => p.scoring.winnerCorrect).length;

// Helper: format result string
const fmtResult = (r: PickRow["result"]) =>
    `${r.winner} · ${r.method}${r.round ? ` R${r.round}` : ""}`;

// ============================================================================
// VARIANT 1 — Résultat en sous-ligne (expandable row feel)
// ============================================================================
function Variant1() {
    const [expanded, setExpanded] = useState(true);
    return (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <button onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-zinc-950/50 border-b border-zinc-800 cursor-pointer hover:bg-zinc-900/50 transition-colors">
                <Target className="h-3.5 w-3.5 text-red-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">My Picks</span>
                <div className="flex-1" />
                <div className="flex items-center gap-1 mr-2">
                    {mockPicks.map((p, i) => (
                        <div key={i} className={cn(
                            "w-2 h-2 rounded-full",
                            p.scoring.points >= 25 ? "bg-green-500" :
                                p.scoring.points >= 10 ? "bg-yellow-500" : "bg-red-500/50"
                        )} />
                    ))}
                </div>
                <span className="text-xs font-black text-yellow-500">{totalPoints}</span>
                <ChevronDown className={cn("h-3 w-3 text-zinc-600 transition-transform", expanded && "rotate-180")} />
            </button>
            {expanded && (
                <div>
                    {/* Column headers */}
                    <div className="flex items-center gap-2 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-700 border-b border-zinc-800/50">
                        <span className="w-3" />
                        <span className="flex-1">Fight</span>
                        <span className="w-10 text-center">W</span>
                        <span className="w-10 text-center">M</span>
                        <span className="w-8 text-center">R</span>
                        <span className="w-8 text-right">Pts</span>
                    </div>
                    {mockPicks.map((p, i) => {
                        const isPerfect = p.scoring.points >= 25;
                        return (
                            <div key={i} className={cn("border-b border-zinc-800/30", isPerfect && "bg-green-500/5")}>
                                {/* Main row: grid checks */}
                                <div className="flex items-center gap-2 px-3 py-1.5 text-[10px]">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full shrink-0",
                                        isPerfect ? "bg-green-500" :
                                            p.scoring.points >= 10 ? "bg-yellow-500" : "bg-red-500/50"
                                    )} />
                                    <span className="flex-1 text-zinc-300 truncate font-medium">{p.fightLabel}</span>
                                    <span className="w-10 flex justify-center">
                                        {p.scoring.winnerCorrect
                                            ? <Check className="h-3 w-3 text-green-500" />
                                            : <X className="h-3 w-3 text-red-500" />}
                                    </span>
                                    <span className="w-10 flex justify-center">
                                        {p.scoring.methodCorrect
                                            ? <Check className="h-3 w-3 text-green-500" />
                                            : p.scoring.winnerCorrect && p.myPick.method
                                                ? <X className="h-3 w-3 text-red-400/50" />
                                                : <span className="text-zinc-800">—</span>}
                                    </span>
                                    <span className="w-8 flex justify-center">
                                        {p.scoring.roundCorrect
                                            ? <Check className="h-3 w-3 text-green-500" />
                                            : p.scoring.methodCorrect && p.myPick.round
                                                ? <X className="h-3 w-3 text-red-400/50" />
                                                : <span className="text-zinc-800">—</span>}
                                    </span>
                                    <span className={cn(
                                        "w-8 text-right font-bold",
                                        isPerfect ? "text-green-400" : p.scoring.points > 0 ? "text-yellow-400" : "text-zinc-700"
                                    )}>+{p.scoring.points}</span>
                                </div>
                                {/* Sub-row: actual result */}
                                <div className="flex items-center gap-2 px-3 pb-1.5 text-[9px] text-zinc-600">
                                    <span className="w-2" />
                                    <span className="ml-1">↳ {fmtResult(p.result)}</span>
                                </div>
                            </div>
                        );
                    })}
                    {/* Total */}
                    <div className="flex items-center gap-2 px-3 py-2 text-[10px] bg-zinc-950/50">
                        <span className="w-2" />
                        <span className="flex-1 font-bold text-zinc-400">Total</span>
                        <span className="w-10 text-center text-zinc-500">{totalCorrect}/{mockPicks.length}</span>
                        <span className="w-10" />
                        <span className="w-8" />
                        <span className="w-8 text-right font-black text-yellow-500">{totalPoints}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// VARIANT 2 — Résultat inline dans la même ligne (après le nom)
// ============================================================================
function Variant2() {
    const [expanded, setExpanded] = useState(true);
    return (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <button onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-zinc-950/50 border-b border-zinc-800 cursor-pointer hover:bg-zinc-900/50 transition-colors">
                <Target className="h-3.5 w-3.5 text-red-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">My Picks</span>
                <div className="flex-1" />
                <div className="flex items-center gap-1 mr-2">
                    {mockPicks.map((p, i) => (
                        <div key={i} className={cn(
                            "w-2 h-2 rounded-full",
                            p.scoring.points >= 25 ? "bg-green-500" :
                                p.scoring.points >= 10 ? "bg-yellow-500" : "bg-red-500/50"
                        )} />
                    ))}
                </div>
                <span className="text-xs font-black text-yellow-500">{totalPoints}</span>
                <ChevronDown className={cn("h-3 w-3 text-zinc-600 transition-transform", expanded && "rotate-180")} />
            </button>
            {expanded && (
                <div>
                    <div className="flex items-center gap-2 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-700 border-b border-zinc-800/50">
                        <span className="w-3" />
                        <span className="w-36">Fight</span>
                        <span className="flex-1">Result</span>
                        <span className="w-10 text-center">W</span>
                        <span className="w-10 text-center">M</span>
                        <span className="w-8 text-center">R</span>
                        <span className="w-8 text-right">Pts</span>
                    </div>
                    {mockPicks.map((p, i) => {
                        const isPerfect = p.scoring.points >= 25;
                        return (
                            <div key={i} className={cn(
                                "flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800/30 text-[10px]",
                                isPerfect && "bg-green-500/5"
                            )}>
                                <div className={cn(
                                    "w-2 h-2 rounded-full shrink-0",
                                    isPerfect ? "bg-green-500" :
                                        p.scoring.points >= 10 ? "bg-yellow-500" : "bg-red-500/50"
                                )} />
                                <span className="w-36 text-zinc-300 truncate font-medium">{p.fightLabel}</span>
                                <span className="flex-1 text-zinc-500 text-[9px] truncate">
                                    {p.result.winner} · {p.result.method}{p.result.round ? ` R${p.result.round}` : ""}
                                </span>
                                <span className="w-10 flex justify-center">
                                    {p.scoring.winnerCorrect
                                        ? <Check className="h-3 w-3 text-green-500" />
                                        : <X className="h-3 w-3 text-red-500" />}
                                </span>
                                <span className="w-10 flex justify-center">
                                    {p.scoring.methodCorrect
                                        ? <Check className="h-3 w-3 text-green-500" />
                                        : p.scoring.winnerCorrect && p.myPick.method
                                            ? <X className="h-3 w-3 text-red-400/50" />
                                            : <span className="text-zinc-800">—</span>}
                                </span>
                                <span className="w-8 flex justify-center">
                                    {p.scoring.roundCorrect
                                        ? <Check className="h-3 w-3 text-green-500" />
                                        : p.scoring.methodCorrect && p.myPick.round
                                            ? <X className="h-3 w-3 text-red-400/50" />
                                            : <span className="text-zinc-800">—</span>}
                                </span>
                                <span className={cn(
                                    "w-8 text-right font-bold",
                                    isPerfect ? "text-green-400" : p.scoring.points > 0 ? "text-yellow-400" : "text-zinc-700"
                                )}>+{p.scoring.points}</span>
                            </div>
                        );
                    })}
                    <div className="flex items-center gap-2 px-3 py-2 text-[10px] bg-zinc-950/50">
                        <span className="w-2" />
                        <span className="w-36 font-bold text-zinc-400">Total</span>
                        <span className="flex-1" />
                        <span className="w-10 text-center text-zinc-500">{totalCorrect}/{mockPicks.length}</span>
                        <span className="w-10" />
                        <span className="w-8" />
                        <span className="w-8 text-right font-black text-yellow-500">{totalPoints}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// VARIANT 3 — Deux colonnes pick/result avec checks intégrés
// ============================================================================
function Variant3() {
    const [expanded, setExpanded] = useState(true);
    return (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <button onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-zinc-950/50 border-b border-zinc-800 cursor-pointer hover:bg-zinc-900/50 transition-colors">
                <Target className="h-3.5 w-3.5 text-red-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">My Picks</span>
                <div className="flex-1" />
                <div className="flex items-center gap-1 mr-2">
                    {mockPicks.map((p, i) => (
                        <div key={i} className={cn(
                            "w-2 h-2 rounded-full",
                            p.scoring.points >= 25 ? "bg-green-500" :
                                p.scoring.points >= 10 ? "bg-yellow-500" : "bg-red-500/50"
                        )} />
                    ))}
                </div>
                <span className="text-xs font-black text-yellow-500">{totalPoints}</span>
                <ChevronDown className={cn("h-3 w-3 text-zinc-600 transition-transform", expanded && "rotate-180")} />
            </button>
            {expanded && (
                <div>
                    <div className="flex items-center px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-700 border-b border-zinc-800/50">
                        <span className="w-3" />
                        <span className="flex-1 ml-2">Fight</span>
                        <span className="w-28 text-center">Your Pick</span>
                        <span className="w-28 text-center">Result</span>
                        <span className="w-8 text-right">Pts</span>
                    </div>
                    {mockPicks.map((p, i) => {
                        const isPerfect = p.scoring.points >= 25;
                        const pickStr = `${p.myPick.winner}${p.myPick.method ? " · " + p.myPick.method : ""}${p.myPick.round ? " R" + p.myPick.round : ""}`;
                        const resultStr = `${p.result.winner} · ${p.result.method}${p.result.round ? " R" + p.result.round : ""}`;
                        return (
                            <div key={i} className={cn(
                                "flex items-center px-3 py-2 border-b border-zinc-800/30 text-[10px]",
                                isPerfect && "bg-green-500/5",
                                !p.scoring.winnerCorrect && "bg-red-500/5"
                            )}>
                                <div className={cn(
                                    "w-2 h-2 rounded-full shrink-0",
                                    isPerfect ? "bg-green-500" :
                                        p.scoring.points >= 10 ? "bg-yellow-500" : "bg-red-500/50"
                                )} />
                                <span className="flex-1 text-zinc-300 truncate font-medium ml-2">{p.fightLabel}</span>
                                {/* Your pick */}
                                <span className={cn(
                                    "w-28 text-center truncate text-[9px] font-medium",
                                    p.scoring.winnerCorrect ? "text-green-400" : "text-red-400"
                                )} title={pickStr}>
                                    {pickStr}
                                </span>
                                {/* Actual result */}
                                <span className="w-28 text-center truncate text-[9px] text-zinc-500" title={resultStr}>
                                    {resultStr}
                                </span>
                                <span className={cn(
                                    "w-8 text-right font-bold",
                                    isPerfect ? "text-green-400" : p.scoring.points > 0 ? "text-yellow-400" : "text-zinc-700"
                                )}>+{p.scoring.points}</span>
                            </div>
                        );
                    })}
                    <div className="flex items-center px-3 py-2 text-[10px] bg-zinc-950/50">
                        <span className="w-2" />
                        <span className="flex-1 ml-2 font-bold text-zinc-400">Total</span>
                        <span className="w-28 text-center text-zinc-500">{totalCorrect}/{mockPicks.length} correct</span>
                        <span className="w-28" />
                        <span className="w-8 text-right font-black text-yellow-500">{totalPoints}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// SHOWCASE
// ============================================================================
export function FightCardShowcase() {
    return (
        <div className="space-y-20 max-w-4xl mx-auto py-8 pb-24">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-black uppercase tracking-tight text-red-600">🎯 Dot Matrix + Résultat</h1>
                <p className="text-muted-foreground text-sm">
                    3 façons d'afficher le résultat du combat dans le Dot Matrix Grid.
                </p>
            </div>

            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded">1</span>
                    <div>
                        <h3 className="text-lg font-bold">Sous-ligne "↳ résultat"</h3>
                        <p className="text-xs text-zinc-500">Le résultat apparaît en petite ligne grise sous chaque combat. Grille W/M/R conservée.</p>
                    </div>
                </div>
                <div className="border border-dashed border-zinc-700 rounded-2xl p-4">
                    <Variant1 />
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded">2</span>
                    <div>
                        <h3 className="text-lg font-bold">Colonne "Result" inline</h3>
                        <p className="text-xs text-zinc-500">Le résultat est une colonne entre Fight et W/M/R. Tout sur une seule ligne. Plus horizontal.</p>
                    </div>
                </div>
                <div className="border border-dashed border-zinc-700 rounded-2xl p-4">
                    <Variant2 />
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded">3</span>
                    <div>
                        <h3 className="text-lg font-bold">Deux colonnes Pick / Result</h3>
                        <p className="text-xs text-zinc-500">Pick en vert/rouge + Résultat en gris. Pas de W/M/R, comparaison directe. Le plus explicite.</p>
                    </div>
                </div>
                <div className="border border-dashed border-zinc-700 rounded-2xl p-4">
                    <Variant3 />
                </div>
            </section>
        </div>
    );
}
