import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Check, Flame, X } from "lucide-react";

// Mock Data
const f = {
    id: "f1",
    division: "Middleweight",
    rounds: 5,
    fighterA: {
        id: "fa",
        name: "Sean Strickland",
        record: "28-5-0",
        imageUrl: "https://ufc.com/images/styles/athlete_bio_full_body/s3/2025-01/5/STRICKLAND_SEAN_L_06-01.png?itok=S_BauaBm",
    },
    fighterB: {
        id: "fb",
        name: "Anthony Hernandez",
        record: "12-2-0",
        imageUrl: "https://ufc.com/images/styles/athlete_bio_full_body/s3/2025-01/5/HERNANDEZ_ANTHONY_L_10-19.png?itok=6ys_gZcX",
    }
};

const resultText = "Hernandez (SUB R2)";

// ============================================================================
// RESULT CENTER DESIGNS
// ============================================================================

function ResultCenterV1({ pick, points, isWinnerCorrect }: { pick: string, points: number, isWinnerCorrect: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center w-[180px] pb-8 pt-4">
            <div className="flex flex-col items-center mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">
                    Points Earned
                </span>
                <span className={cn(
                    "text-4xl font-black drop-shadow-lg",
                    points > 0 ? "text-yellow-500" : "text-zinc-700"
                )}>
                    +{points}
                </span>
            </div>

            <div className="flex flex-col gap-1 w-full mt-2">
                <div className="flex flex-col items-center justify-center text-center bg-zinc-900/80 p-2.5 rounded-t-xl border border-zinc-800 border-b-0 backdrop-blur-sm">
                    <span className="text-zinc-500 font-bold uppercase tracking-widest text-[8px] mb-1">Your Pick</span>
                    <span className={cn("font-black text-[11px] leading-tight", isWinnerCorrect ? "text-blue-400" : "text-red-400 line-through opacity-80")}>
                        {pick}
                    </span>
                </div>
                <div className="flex flex-col items-center justify-center text-center bg-emerald-950/30 p-2.5 rounded-b-xl border border-emerald-900/50 backdrop-blur-sm">
                    <span className="text-emerald-500/70 font-bold uppercase tracking-widest text-[8px] mb-1">Actual Result</span>
                    <span className="text-emerald-400 font-black text-[11px] leading-tight">{resultText}</span>
                </div>
            </div>
        </div>
    );
}

function ResultCenterV2({ pick, points, isPerfect, isWinnerCorrect }: { pick: string, points: number, isPerfect: boolean, isWinnerCorrect: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center w-[180px] h-full relative">
            {isPerfect && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <span className="text-5xl font-black italic text-emerald-500/10 -rotate-12 tracking-tighter uppercase whitespace-nowrap">
                        Perfect
                    </span>
                </div>
            )}

            <div className="relative z-10 glass-panel rounded-2xl p-4 flex flex-col items-center border border-white/5 bg-black/40 backdrop-blur-md shadow-2xl w-full">
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-inner border",
                    isPerfect ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" :
                        isWinnerCorrect ? "bg-blue-500/20 border-blue-500/50 text-blue-400" :
                            "bg-red-500/10 border-red-500/30 text-red-500/80"
                )}>
                    {isWinnerCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </div>

                <span className={cn(
                    "text-3xl font-black mb-3 leading-none",
                    points > 0 ? (isPerfect ? "text-emerald-400" : "text-white") : "text-red-500/80"
                )}>
                    {points} <span className="text-xs text-zinc-500 font-bold tracking-widest uppercase">PTS</span>
                </span>

                <div className="w-full h-px bg-white/10 mb-3" />

                <div className="w-full flex justify-between items-center text-[9px] mb-1">
                    <span className="font-bold text-zinc-500 uppercase tracking-widest">Pick</span>
                    <span className={cn("font-bold truncate text-right max-w-[90px]", isWinnerCorrect ? "text-white" : "text-zinc-500 line-through")}>{pick}</span>
                </div>
                <div className="w-full flex justify-between items-center text-[9px]">
                    <span className="font-bold text-zinc-500 uppercase tracking-widest">Result</span>
                    <span className="font-bold text-white truncate text-right max-w-[90px]">{resultText}</span>
                </div>
            </div>
        </div>
    );
}

function ResultCenterV3({ pick, points, isWinnerCorrect }: { pick: string, points: number, isWinnerCorrect: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full relative">
            <div className="w-px h-full bg-gradient-to-b from-transparent via-zinc-800 to-transparent absolute left-1/2 -translate-x-1/2" />

            <div className="flex flex-col items-center z-10 bg-zinc-950 px-5 py-3 rounded-full border-2 border-zinc-800 shadow-2xl">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-0.5">Earned</span>
                <span className={cn("text-3xl font-black leading-none", points > 0 ? "text-yellow-500" : "text-zinc-600")}>+{points}</span>
            </div>

            <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 flex justify-between px-10 pointer-events-none mt-16">
                <div className="flex flex-col items-start bg-zinc-950/80 p-2 rounded backdrop-blur border border-zinc-800/50">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">My Pick</span>
                    <span className={cn("text-[10px] font-bold", isWinnerCorrect ? "text-blue-400" : "text-red-400 line-through")}>{pick}</span>
                </div>
                <div className="flex flex-col items-end bg-emerald-950/80 p-2 rounded backdrop-blur border border-emerald-900/50">
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500/70">Result</span>
                    <span className="text-[10px] font-bold text-emerald-400 text-right">{resultText}</span>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// CARD COMPONENT
// ============================================================================

function FinishedShowcaseCard({ variant, pick, points, isPerfect, isWinnerCorrect }: { variant: "v1" | "v2" | "v3", pick: string, points: number, isPerfect: boolean, isWinnerCorrect: boolean }) {

    return (
        <div className="w-full max-w-3xl mx-auto rounded-2xl overflow-hidden border border-red-500/40 bg-zinc-950 shadow-2xl relative h-[400px]">
            {/* EVENT HEADER */}
            <div className="absolute top-0 inset-x-0 z-20 pointer-events-none">
                <div className="bg-gradient-to-r from-zinc-950/95 via-red-950/90 to-zinc-950/95 py-1.5 border-b border-red-500/20 backdrop-blur-sm flex items-center justify-between px-3">
                    <div className="flex items-center gap-1.5">
                        <Flame className="h-3 w-3 text-red-500 fill-red-500/20" />
                        <span className="text-[9px] font-black tracking-[0.2em] uppercase text-red-100 drop-shadow-sm">Main Event</span>
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2">
                        <Badge variant="outline" className="bg-zinc-800/80 text-zinc-400 border-zinc-700 text-[10px] backdrop-blur-md shadow-lg shadow-black/50 py-0 h-5">FINISHED</Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="h-5 bg-black/40 border-red-500/20 text-red-100/80 text-[10px] font-bold px-2 py-0.5 uppercase tracking-tight">{f.division}</Badge>
                        <Badge variant="outline" className="h-5 bg-black/40 border-red-500/20 text-red-100/80 text-[10px] font-bold px-2 py-0.5 uppercase tracking-tight">{f.rounds} RND</Badge>
                    </div>
                </div>
            </div>

            {/* Fighters Area */}
            <div className="grid grid-cols-2 relative h-full">
                {/* MATCH RESULT CENTER (Replaces stats) */}
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center justify-center w-full max-w-[220px]">
                    {variant === "v1" && <ResultCenterV1 pick={pick} points={points} isWinnerCorrect={isWinnerCorrect} />}
                    {variant === "v2" && <ResultCenterV2 pick={pick} points={points} isPerfect={isPerfect} isWinnerCorrect={isWinnerCorrect} />}
                    {variant === "v3" && <ResultCenterV3 pick={pick} points={points} isWinnerCorrect={isWinnerCorrect} />}
                </div>

                {/* Fighter A (Loser) */}
                <div className="relative group overflow-hidden grayscale opacity-60">
                    <div className="absolute inset-0 bg-gradient-to-tr from-zinc-600/10 to-transparent opacity-30" />
                    <img src={f.fighterA.imageUrl} alt={f.fighterA.name} className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[90%] object-contain pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-full p-4 pb-4 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent flex flex-col justify-end h-full">
                        <h3 className="text-2xl sm:text-3xl font-black italic uppercase leading-[0.85] text-zinc-400">
                            {f.fighterA.name.split(" ").map((n, i) => <span key={i} className="block">{n}</span>)}
                        </h3>
                    </div>
                </div>

                {/* VS Badge removed from Finished state */}
                <div className="relative group overflow-hidden bg-blue-900/10">
                    <div className="absolute inset-0 bg-gradient-to-tl from-blue-600/20 to-transparent opacity-30" />
                    <img src={f.fighterB.imageUrl} alt={f.fighterB.name} className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[90%] scale-105 drop-shadow-[0_0_25px_rgba(37,99,235,0.4)] object-contain pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-full p-4 pb-4 text-right flex flex-col justify-end h-full">
                        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-blue-950/90 via-blue-950/30 to-transparent z-0" />
                        <div className="relative z-10 flex flex-col items-end">
                            <Badge className="bg-amber-500 text-black border-0 text-[10px] mb-1 shadow-lg shadow-amber-900/50 px-2 uppercase tracking-widest font-black">WINNER</Badge>
                            <h3 className="text-2xl sm:text-3xl font-black italic uppercase leading-[0.85] text-white drop-shadow-2xl text-right">
                                {f.fighterB.name.split(" ").map((n, i) => <span key={i} className="block">{n}</span>)}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function FightCardShowcase() {
    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-8 font-sans pb-32">
            <div className="max-w-5xl mx-auto space-y-16">

                <div className="text-center space-y-4 pt-10">
                    <h1 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter">Finished Card Center UI</h1>
                    <p className="text-zinc-400 max-w-xl mx-auto">
                        Proposals for replacing the Physical Stats / Wins by Method with the user's pick result when a fight is marked as FINISHED.
                    </p>
                </div>

                {/* DESIGN A: Clean Stack */}
                <section className="space-y-4">
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-white mb-1"><span className="text-blue-500 mr-2">V1</span>Clean Stack</h3>
                        <p className="text-xs text-zinc-500">Simple vertical layout with a clear hierarchy. Points first, then pick vs result.</p>
                    </div>

                    {/* Perfect Pick */}
                    <div className="p-6 bg-zinc-900/30 rounded-3xl border border-zinc-800">
                        <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest text-center mb-4">Example: Perfect Pick</h4>
                        <FinishedShowcaseCard variant="v1" pick="Hernandez (SUB R2)" points={25} isPerfect={true} isWinnerCorrect={true} />
                    </div>

                    {/* Wrong Picker */}
                    <div className="p-6 bg-zinc-900/30 rounded-3xl border border-zinc-800">
                        <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest text-center mb-4">Example: Completely Wrong</h4>
                        <FinishedShowcaseCard variant="v1" pick="Strickland (DEC)" points={0} isPerfect={false} isWinnerCorrect={false} />
                    </div>
                </section>

                {/* DESIGN B: Glass Pill */}
                <section className="space-y-4 border-t border-zinc-900 pt-16">
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-white mb-1"><span className="text-blue-500 mr-2">V2</span>Glass Box Status</h3>
                        <p className="text-xs text-zinc-500">More encapsulated pill design matching our drawer style. Includes an icon check/cross.</p>
                    </div>

                    {/* Perfect Pick */}
                    <div className="p-6 bg-zinc-900/30 rounded-3xl border border-zinc-800">
                        <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest text-center mb-4">Example: Perfect Pick</h4>
                        <FinishedShowcaseCard variant="v2" pick="Hernandez (SUB R2)" points={25} isPerfect={true} isWinnerCorrect={true} />
                    </div>

                    {/* Okay Pick */}
                    <div className="p-6 bg-zinc-900/30 rounded-3xl border border-zinc-800">
                        <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-widest text-center mb-4">Example: Winner Correct, Method Wrong</h4>
                        <FinishedShowcaseCard variant="v2" pick="Hernandez (KO R1)" points={10} isPerfect={false} isWinnerCorrect={true} />
                    </div>
                </section>

                {/* DESIGN C: VS Split */}
                <section className="space-y-4 border-t border-zinc-900 pt-16">
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-white mb-1"><span className="text-blue-500 mr-2">V3</span>Split Centered Badge</h3>
                        <p className="text-xs text-zinc-500">Floating central badge with pick/result anchored to the sides near the fighters.</p>
                    </div>

                    {/* Perfect Pick */}
                    <div className="p-6 bg-zinc-900/30 rounded-3xl border border-zinc-800">
                        <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest text-center mb-4">Example: Perfect Pick</h4>
                        <FinishedShowcaseCard variant="v3" pick="Hernandez (SUB R2)" points={25} isPerfect={true} isWinnerCorrect={true} />
                    </div>
                </section>

            </div>
        </div>
    );
}

export default FightCardShowcase;
