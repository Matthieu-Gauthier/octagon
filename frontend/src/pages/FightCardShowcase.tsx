import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, X, ChevronLeft, ChevronRight, Target, RotateCcw, Flame, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// TYPES & DATA
// ============================================================================
type Method = "KO/TKO" | "SUBMISSION" | "DECISION";
type SelectionVariant = "inline-strip" | "full-panel" | "bottom-drawer" | "segmented";

const METHODS: { value: Method; short: string; icon: string; label: string }[] = [
    { value: "KO/TKO", short: "KO", icon: "💥", label: "KO / TKO" },
    { value: "SUBMISSION", short: "SUB", icon: "🔒", label: "Submission" },
    { value: "DECISION", short: "DEC", icon: "📋", label: "Decision" },
];

const FALLBACK_IMAGE = "/fighter-silhouette.png";

const fight = {
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
    },
};

const fightNoImages = {
    id: "f2",
    division: "Lightweight",
    rounds: 3,
    fighterA: {
        id: "fc",
        name: "John Doe",
        record: "10-3-0",
        imageUrl: "",
    },
    fighterB: {
        id: "fd",
        name: "James Smith",
        record: "8-2-0",
        imageUrl: "",
    },
};

// ============================================================================
// CARD COMPONENT (shared across all variants)
// ============================================================================
interface ShowcaseCardProps {
    height?: string;
    eventType?: "main" | "comain" | "standard";
    selectionVariant: SelectionVariant;
    customFight?: typeof fight;
}

function ShowcaseCard({ height = "h-[400px]", eventType = "standard", selectionVariant, customFight }: ShowcaseCardProps) {
    const f = customFight || fight;
    const [winner, setWinner] = useState<string | null>(null);
    const [method, setMethod] = useState<Method | null>(null);
    const [round, setRound] = useState<number | null>(null);
    const [showDrawer, setShowDrawer] = useState(true);

    const isComplete = !!winner && !!method && (method === "DECISION" || !!round);

    // Auto-close drawer 1s after pick is complete
    useEffect(() => {
        if (isComplete) {
            const timer = setTimeout(() => setShowDrawer(false), 1000);
            return () => clearTimeout(timer);
        } else {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowDrawer(true);
        }
    }, [isComplete, method, round]);

    const handleFighterClick = (id: string, e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.selection-area')) return;
        if (winner === id) {
            setWinner(null); setMethod(null); setRound(null); setShowDrawer(true);
        } else {
            setWinner(id); setMethod(null); setRound(null); setShowDrawer(true);
        }
    };

    const pickMethod = (m: Method) => { setMethod(method === m ? null : m); setRound(null); };
    const pickRound = (r: number) => { setRound(round === r ? null : r); };
    const reset = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setWinner(null); setMethod(null); setRound(null); setShowDrawer(true);
    };

    const getShortSummary = () => {
        if (!method) return null;
        const methodText = method === "SUBMISSION" ? "Submission" : method === "DECISION" ? "Decision" : method;
        if (method === "DECISION") return methodText;
        return `${methodText} - Round ${round}`;
    };

    const containerClass = cn(
        "w-full max-w-3xl mx-auto rounded-2xl overflow-hidden border bg-zinc-950 shadow-2xl relative transition-all duration-500",
        eventType === "main" ? "border-red-500/40" : eventType === "comain" ? "border-zinc-700" : "border-zinc-800"
    );

    const imgHeight = "h-[90%]";

    return (
        <div className={containerClass}>
            {/* EVENT HEADER */}
            <div className="absolute top-0 inset-x-0 z-20 pointer-events-none">
                {eventType === "main" && (
                    <div className="bg-gradient-to-r from-zinc-950/95 via-red-950/90 to-zinc-950/95 py-1.5 border-b border-red-500/20 backdrop-blur-sm flex items-center justify-between px-3">
                        <div className="flex items-center gap-1.5">
                            <Flame className="h-3 w-3 text-red-500 fill-red-500/20" />
                            <span className="text-[9px] font-black tracking-[0.2em] uppercase text-red-100 drop-shadow-sm">Main Event</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="h-5 bg-black/40 border-red-500/20 text-red-100/80 text-[10px] font-bold px-2 py-0.5 uppercase tracking-tight">{f.division}</Badge>
                            <Badge variant="outline" className="h-5 bg-black/40 border-red-500/20 text-red-100/80 text-[10px] font-bold px-2 py-0.5 uppercase tracking-tight">{f.rounds} RND</Badge>
                        </div>
                    </div>
                )}
                {eventType === "comain" && (
                    <div className="bg-gradient-to-r from-zinc-950/95 via-zinc-900/90 to-zinc-950/95 py-1.5 border-b border-zinc-700/50 backdrop-blur-sm flex items-center justify-between px-3">
                        <div className="flex items-center gap-1.5">
                            <Shield className="h-3 w-3 text-zinc-400 fill-zinc-400/20" />
                            <span className="text-[9px] font-black tracking-[0.2em] uppercase text-zinc-300 drop-shadow-sm">Co-Main Event</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="h-5 bg-black/40 border-zinc-700 text-zinc-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-tight">{f.division}</Badge>
                            <Badge variant="outline" className="h-5 bg-black/40 border-zinc-700 text-zinc-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-tight">{f.rounds} RND</Badge>
                        </div>
                    </div>
                )}
                {eventType === "standard" && (
                    <div className="flex justify-between items-start p-3 bg-gradient-to-b from-zinc-950/80 to-transparent">
                        <Badge variant="outline" className="bg-zinc-950/50 backdrop-blur border-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 font-bold uppercase tracking-tight">{f.division}</Badge>
                        <Badge variant="outline" className="bg-zinc-950/50 backdrop-blur border-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 font-bold uppercase tracking-tight">{f.rounds} RND</Badge>
                    </div>
                )}
            </div>

            {/* Fighters Area */}
            <div className={cn("grid grid-cols-2 relative transition-all", height)}>
                {/* Fighter A */}
                <div
                    onClick={(e) => handleFighterClick(f.fighterA.id, e)}
                    className={cn(
                        "relative group cursor-pointer overflow-hidden transition-all duration-500",
                        winner === f.fighterA.id ? "bg-red-900/20" : "hover:bg-zinc-900/10",
                        winner === f.fighterB.id && "grayscale opacity-50",
                        !winner && "grayscale"
                    )}
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-red-600/10 to-transparent opacity-30" />
                    <img src={f.fighterA.imageUrl || FALLBACK_IMAGE} alt={f.fighterA.name}
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                        className={cn(
                            "absolute bottom-0 left-1/2 -translate-x-1/2 transition-all duration-700 ease-out origin-bottom object-contain pointer-events-none",
                            imgHeight,
                            winner === f.fighterA.id ? "scale-105 drop-shadow-[0_0_25px_rgba(220,38,38,0.4)]" : "scale-100 group-hover:scale-105"
                        )}
                    />
                    <div className="absolute bottom-0 left-0 w-full p-4 pb-4 transition-all flex flex-col justify-end h-full pointer-events-none">
                        <div className="transition-transform duration-300 origin-bottom-left group-hover:scale-105 mb-1">
                            {winner === f.fighterA.id && (
                                <Badge className="bg-red-600 text-white border-0 text-[8px] mb-1 shadow-lg shadow-red-900/50 animate-in zoom-in px-1.5 py-0 tracking-wider font-bold">PICK</Badge>
                            )}
                            <h3 className="text-2xl sm:text-3xl font-black text-white italic uppercase leading-[0.85] drop-shadow-2xl break-words hyphens-auto">
                                {f.fighterA.name.split(" ").map((n, i) => <span key={i} className="block">{n}</span>)}
                            </h3>
                            <p className="text-sm font-bold text-red-500 mt-1 font-mono tracking-wider">{f.fighterA.record}</p>
                            {winner === f.fighterA.id && isComplete && (
                                <div className="mt-1.5 inline-flex items-center gap-1 bg-red-950/90 border border-red-500/30 rounded-full pl-1.5 pr-2.5 py-0.5 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-bottom-2 pointer-events-auto cursor-default">
                                    <Check className="w-2.5 h-2.5 text-red-400" />
                                    <span className="text-[9px] font-black text-red-200 uppercase tracking-wide">{getShortSummary()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* VS Badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                    <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full font-black italic text-xs transition-all shadow-2xl duration-500",
                        winner ? "bg-zinc-900 text-zinc-600 scale-75 border border-zinc-700" : "bg-white text-black scale-100 border-2 border-zinc-950"
                    )}>
                        <span className="-ml-0.5 mt-0.5">VS</span>
                    </div>
                </div>

                {/* Fighter B */}
                <div
                    onClick={(e) => handleFighterClick(f.fighterB.id, e)}
                    className={cn(
                        "relative group cursor-pointer overflow-hidden transition-all duration-500",
                        winner === f.fighterB.id ? "bg-blue-900/20" : "hover:bg-zinc-900/10",
                        winner === f.fighterA.id && "grayscale opacity-50",
                        !winner && "grayscale"
                    )}
                >
                    <div className="absolute inset-0 bg-gradient-to-tl from-blue-600/10 to-transparent opacity-30" />
                    <img src={f.fighterB.imageUrl || FALLBACK_IMAGE} alt={f.fighterB.name}
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                        className={cn(
                            "absolute bottom-0 left-1/2 -translate-x-1/2 transition-all duration-700 ease-out origin-bottom object-contain pointer-events-none",
                            imgHeight,
                            winner === f.fighterB.id ? "scale-105 drop-shadow-[0_0_25px_rgba(37,99,235,0.4)]" : "scale-100 group-hover:scale-105"
                        )}
                    />
                    <div className="absolute bottom-0 right-0 w-full p-4 pb-4 text-right bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent flex flex-col justify-end h-full pointer-events-none">
                        <div className="flex flex-col items-end transition-transform duration-300 origin-bottom-right group-hover:scale-105 mb-1">
                            {winner === f.fighterB.id && (
                                <Badge className="bg-blue-600 text-white border-0 text-[8px] mb-1 shadow-lg shadow-blue-900/50 animate-in zoom-in px-1.5 py-0 tracking-wider font-bold">PICK</Badge>
                            )}
                            <h3 className="text-2xl sm:text-3xl font-black text-white italic uppercase leading-[0.85] drop-shadow-2xl break-words hyphens-auto">
                                {f.fighterB.name.split(" ").map((n, i) => <span key={i} className="block">{n}</span>)}
                            </h3>
                            <p className="text-sm font-bold text-blue-500 mt-1 font-mono tracking-wider">{f.fighterB.record}</p>
                            {winner === f.fighterB.id && isComplete && (
                                <div className="mt-1.5 inline-flex items-center gap-1 bg-blue-950/90 border border-blue-500/30 rounded-full pl-1.5 pr-2.5 py-0.5 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-bottom-2 pointer-events-auto cursor-default">
                                    <Check className="w-2.5 h-2.5 text-blue-400" />
                                    <span className="text-[9px] font-black text-blue-200 uppercase tracking-wide">{getShortSummary()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================== */}
            {/* SELECTION AREA — switches based on selectionVariant           */}
            {/* ============================================================== */}

            {/* ── VARIANT A: Inline Strip (existing, baseline) ── */}
            {selectionVariant === "inline-strip" && winner && showDrawer && (
                <div className="selection-area bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 animate-in slide-in-from-bottom-4 duration-200 relative z-40">
                    <div className="flex items-center h-9 px-2 gap-1">
                        {!method && (
                            <>
                                <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider mr-1 shrink-0">How</span>
                                {METHODS.map((m) => (
                                    <button key={m.value} onClick={() => pickMethod(m.value)}
                                        className="px-2 py-1 rounded text-[9px] font-bold bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white hover:bg-zinc-800/80 transition-all active:scale-95 whitespace-nowrap cursor-pointer">
                                        {m.icon} {m.short}
                                    </button>
                                ))}
                                <div className="flex-1" />
                                <button onClick={() => reset()} className="text-zinc-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-zinc-900 cursor-pointer"><X className="h-3 w-3" /></button>
                            </>
                        )}
                        {method && method !== "DECISION" && !round && (
                            <>
                                <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider mr-1 shrink-0">Rnd</span>
                                {Array.from({ length: f.rounds }).map((_, i) => (
                                    <button key={i} onClick={() => pickRound(i + 1)}
                                        className="px-2 py-1 rounded text-[9px] font-black bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white hover:bg-zinc-800/80 transition-all active:scale-95 cursor-pointer">
                                        R{i + 1}
                                    </button>
                                ))}
                                <div className="flex-1" />
                                <button onClick={() => setMethod(null)} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-900 cursor-pointer"><ChevronLeft className="h-3 w-3" /></button>
                                <button onClick={() => reset()} className="text-zinc-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-zinc-900 cursor-pointer"><X className="h-3 w-3" /></button>
                            </>
                        )}
                        {isComplete && (
                            <>
                                <div className="flex items-center gap-1.5">
                                    <div className="bg-green-500 rounded-full p-0.5"><Check className="h-2 w-2 text-black" /></div>
                                    <span className="text-[9px] font-bold text-green-400 uppercase tracking-wider">{getShortSummary()}</span>
                                </div>
                                <div className="flex-1" />
                                <button onClick={() => reset()} className="text-[8px] uppercase font-bold text-zinc-600 hover:text-red-400 transition-colors flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-zinc-900 cursor-pointer">
                                    <RotateCcw className="h-2.5 w-2.5" /> Reset
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── VARIANT B: Full-Width Panel (large buttons below card) ── */}
            {selectionVariant === "full-panel" && winner && showDrawer && (
                <div className="selection-area bg-zinc-900/95 border-t border-zinc-800 animate-in slide-in-from-bottom-4 duration-300 relative z-40">
                    {!isComplete ? (
                        <div className="p-4 space-y-3">
                            {/* Method row */}
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                    {!method ? "How does it end?" : `${METHODS.find(m => m.value === method)?.icon} ${method} — Which round?`}
                                </p>
                                {!method ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {METHODS.map((m) => (
                                            <button key={m.value} onClick={() => pickMethod(m.value)}
                                                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-zinc-800/60 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/60 hover:border-zinc-600 hover:text-white transition-all active:scale-95 cursor-pointer">
                                                <span className="text-xl">{m.icon}</span>
                                                <span className="text-[11px] font-bold uppercase tracking-wide">{m.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : method !== "DECISION" ? (
                                    <div className="flex gap-2">
                                        {Array.from({ length: f.rounds }).map((_, i) => (
                                            <button key={i} onClick={() => pickRound(i + 1)}
                                                className="flex-1 py-3 rounded-xl text-sm font-black bg-zinc-800/60 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/60 hover:border-zinc-600 hover:text-white transition-all active:scale-95 cursor-pointer">
                                                R{i + 1}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                            <div className="flex justify-between items-center">
                                {method && (
                                    <button onClick={() => setMethod(null)} className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer">
                                        <ChevronLeft className="h-3 w-3" /> Back
                                    </button>
                                )}
                                <button onClick={() => reset()} className="text-[10px] text-zinc-600 hover:text-red-400 flex items-center gap-1 ml-auto cursor-pointer">
                                    <RotateCcw className="h-3 w-3" /> Reset
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-2">
                                <div className="bg-green-500 rounded-full p-0.5"><Check className="h-3 w-3 text-black" /></div>
                                <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{getShortSummary()}</span>
                                <span className="text-[10px] text-zinc-500">Pick locked in</span>
                            </div>
                            <button onClick={() => reset()} className="text-[10px] uppercase font-bold text-zinc-600 hover:text-red-400 flex items-center gap-1 cursor-pointer">
                                <RotateCcw className="h-3 w-3" /> Reset
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── VARIANT C: Bottom Drawer (glassmorphism overlay) ── */}
            {selectionVariant === "bottom-drawer" && winner && showDrawer && (
                <div className="selection-area absolute bottom-0 inset-x-0 z-40 animate-in slide-in-from-bottom-8 duration-300">
                    {/* Backdrop gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent pointer-events-none" />
                    <div className="relative backdrop-blur-xl p-4 pt-6">
                        {/* Handle */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-zinc-700" />

                        {!isComplete ? (
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center">
                                    {!method ? "How does it end?" : `${METHODS.find(m => m.value === method)?.icon} ${method} — Which round?`}
                                </p>
                                {!method ? (
                                    <div className="flex gap-2 justify-center">
                                        {METHODS.map((m) => (
                                            <button key={m.value} onClick={() => pickMethod(m.value)}
                                                className="flex items-center gap-2 py-2.5 px-4 rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all active:scale-95 cursor-pointer backdrop-blur-sm">
                                                <span className="text-base">{m.icon}</span>
                                                <span className="text-[11px] font-bold uppercase tracking-wide">{m.short}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : method !== "DECISION" ? (
                                    <div className="flex gap-2 justify-center">
                                        {Array.from({ length: f.rounds }).map((_, i) => (
                                            <button key={i} onClick={() => pickRound(i + 1)}
                                                className="w-12 h-12 rounded-full text-sm font-black bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all active:scale-95 cursor-pointer backdrop-blur-sm">
                                                R{i + 1}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                                <div className="flex justify-center gap-4 pt-1">
                                    {method && (
                                        <button onClick={() => setMethod(null)} className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer">
                                            <ChevronLeft className="h-3 w-3" /> Back
                                        </button>
                                    )}
                                    <button onClick={() => reset()} className="text-[10px] text-zinc-600 hover:text-red-400 flex items-center gap-1 cursor-pointer">
                                        <RotateCcw className="h-3 w-3" /> Reset
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-3 py-1">
                                <div className="bg-green-500 rounded-full p-0.5"><Check className="h-3 w-3 text-black" /></div>
                                <span className="text-sm font-black text-green-400 uppercase tracking-wider">{getShortSummary()}</span>
                                <button onClick={() => reset()} className="text-[10px] text-zinc-600 hover:text-red-400 flex items-center gap-1 ml-2 cursor-pointer">
                                    <RotateCcw className="h-3 w-3" /> Change
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── VARIANT D: Segmented Control (iOS-style) ── */}
            {selectionVariant === "segmented" && winner && showDrawer && (
                <div className="selection-area bg-zinc-900 border-t border-zinc-800 animate-in slide-in-from-bottom-4 duration-300 relative z-40">
                    {!isComplete ? (
                        <div className="p-3 space-y-2">
                            {/* Method segmented row */}
                            {!method ? (
                                <div>
                                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5 text-center">Method</p>
                                    <div className="flex bg-zinc-800/80 rounded-lg p-1 gap-0.5">
                                        {METHODS.map((m) => (
                                            <button key={m.value} onClick={() => pickMethod(m.value)}
                                                className="flex-1 py-2 rounded-md text-[11px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all active:scale-[0.97] cursor-pointer flex items-center justify-center gap-1.5">
                                                <span>{m.icon}</span>
                                                <span>{m.short}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : method !== "DECISION" ? (
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <button onClick={() => setMethod(null)} className="text-[9px] text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5 cursor-pointer">
                                            <ChevronLeft className="h-3 w-3" /> Method
                                        </button>
                                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">
                                            {METHODS.find(m => m.value === method)?.icon} {method} — Round
                                        </p>
                                        <div className="w-12" />
                                    </div>
                                    <div className="flex bg-zinc-800/80 rounded-lg p-1 gap-0.5">
                                        {Array.from({ length: f.rounds }).map((_, i) => (
                                            <button key={i} onClick={() => pickRound(i + 1)}
                                                className="flex-1 py-2 rounded-md text-[11px] font-black text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all active:scale-[0.97] cursor-pointer">
                                                R{i + 1}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            <div className="flex justify-end">
                                <button onClick={() => reset()} className="text-[9px] text-zinc-600 hover:text-red-400 flex items-center gap-0.5 cursor-pointer">
                                    <RotateCcw className="h-2.5 w-2.5" /> Reset
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between px-3 py-2.5">
                            <div className="flex items-center gap-2">
                                <div className="flex bg-green-500/15 rounded-lg px-3 py-1.5 items-center gap-1.5 border border-green-500/20">
                                    <Check className="h-3 w-3 text-green-400" />
                                    <span className="text-[11px] font-black text-green-400 uppercase tracking-wide">{getShortSummary()}</span>
                                </div>
                            </div>
                            <button onClick={() => reset()} className="text-[9px] uppercase font-bold text-zinc-600 hover:text-red-400 flex items-center gap-1 cursor-pointer">
                                <RotateCcw className="h-3 w-3" /> Reset
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// SHOWCASE PAGE
// ============================================================================
export function FightCardShowcase() {
    return (
        <div className="space-y-16 max-w-4xl mx-auto py-8 pb-24">
            {/* ── TITLE ── */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-black uppercase tracking-tight text-red-600">🥊 Fight Card Showcase</h1>
                <p className="text-muted-foreground text-sm">
                    Bottom Drawer selection + silhouette fallback.
                </p>
            </div>


            {/* ── SECTION 2: CARD SIZES ── */}
            <div className="space-y-12">
                <div className="flex items-center justify-center">
                    <div className="h-px bg-zinc-800 w-full max-w-xs" />
                    <span className="px-4 text-zinc-500 font-mono text-xs uppercase tracking-widest whitespace-nowrap">Card Sizes</span>
                    <div className="h-px bg-zinc-800 w-full max-w-xs" />
                </div>

                {/* Micro 220px */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded">Micro</span>
                        <div>
                            <h3 className="text-lg font-bold">Micro Fight (220px)</h3>
                            <p className="text-xs text-zinc-500">Test extrême pour voir si ça tient la route.</p>
                        </div>
                    </div>
                    <div className="border border-dashed border-zinc-700 rounded-2xl p-6 bg-zinc-950/50">
                        <ShowcaseCard height="h-[220px]" eventType="standard" selectionVariant="bottom-drawer" />
                    </div>
                </section>

                {/* Small 300px */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-zinc-100 text-zinc-950 text-xs font-bold px-2.5 py-1 rounded">Small</span>
                        <div>
                            <h3 className="text-lg font-bold">Small Fight (300px)</h3>
                            <p className="text-xs text-zinc-500">Format compact pour les listes denses.</p>
                        </div>
                    </div>
                    <div className="border border-dashed border-zinc-700 rounded-2xl p-6 bg-zinc-950/50">
                        <ShowcaseCard height="h-[300px]" eventType="comain" selectionVariant="bottom-drawer" />
                    </div>
                </section>

                {/* Standard 400px */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-zinc-100 text-zinc-950 text-xs font-bold px-2.5 py-1 rounded">Standard</span>
                        <div>
                            <h3 className="text-lg font-bold">Standard Fight (400px)</h3>
                            <p className="text-xs text-zinc-500">Format principal.</p>
                        </div>
                    </div>
                    <div className="border border-dashed border-zinc-700 rounded-2xl p-6 bg-zinc-950/50">
                        <ShowcaseCard height="h-[400px]" eventType="main" selectionVariant="bottom-drawer" />
                    </div>
                </section>
            </div>

            {/* ── SECTION 2: NO IMAGE FALLBACK ── */}
            <div className="space-y-12">
                <div className="flex items-center justify-center">
                    <div className="h-px bg-zinc-800 w-full max-w-xs" />
                    <span className="px-4 text-zinc-500 font-mono text-xs uppercase tracking-widest whitespace-nowrap">No Image Fallback</span>
                    <div className="h-px bg-zinc-800 w-full max-w-xs" />
                </div>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-zinc-600 text-white text-xs font-bold px-2.5 py-1 rounded">👤</span>
                        <div>
                            <h3 className="text-lg font-bold">Silhouette Fallback (400px)</h3>
                            <p className="text-xs text-zinc-500">Quand il n'y a pas d'image de combattant, une silhouette par défaut s'affiche.</p>
                        </div>
                    </div>
                    <div className="border border-dashed border-zinc-700 rounded-2xl p-6 bg-zinc-950/50">
                        <ShowcaseCard height="h-[400px]" eventType="standard" selectionVariant="bottom-drawer" customFight={fightNoImages} />
                    </div>
                </section>
            </div>

            {/* ── SECTION 3: MY PICKS SUMMARY VARIANTS ── */}
            <div className="space-y-12">
                <div className="flex items-center justify-center pt-8">
                    <div className="h-px bg-zinc-800 w-full max-w-xs" />
                    <span className="px-4 text-zinc-500 font-mono text-xs uppercase tracking-widest whitespace-nowrap">My Picks Summary Variants</span>
                    <div className="h-px bg-zinc-800 w-full max-w-xs" />
                </div>

                {/* Variant 1: Current Compact Table */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded">V1</span>
                        <div>
                            <h3 className="text-lg font-bold">Current (Compact Table)</h3>
                            <p className="text-xs text-zinc-500">The current dense data table view.</p>
                        </div>
                    </div>
                    <div className="border border-dashed border-zinc-700 rounded-2xl bg-zinc-950/50 p-4">
                        <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950">
                            <div className="w-full flex items-center gap-3 px-3 py-2.5 bg-zinc-900/50 border-b border-zinc-800">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">My Picks</span>
                                <div className="flex-1" />
                                <span className="text-xs font-black text-yellow-500">45</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 text-[8px] font-bold uppercase tracking-wider text-zinc-700 border-b border-zinc-800/50">
                                <span className="w-2" />
                                <span className="w-24">Fight</span>
                                <span className="flex-1">Result</span>
                                <span className="flex-1 text-blue-400/80">Choice</span>
                                <span className="w-8 text-right">Pts</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                <span className="text-xs font-bold text-zinc-300 w-24 truncate">Strickland</span>
                                <span className="flex-1 text-zinc-500 text-[9px] truncate">Strickland (DEC)</span>
                                <span className="flex-1 text-blue-300/80 text-[9px] truncate font-bold">Strickland (DEC)</span>
                                <span className="font-black text-sm text-yellow-500 w-8 text-right">15</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-zinc-800/30 transition-colors">
                                <div className="w-2 h-2 rounded-full bg-red-500/50 shrink-0" />
                                <span className="text-xs font-bold text-zinc-300 w-24 truncate">Hernandez</span>
                                <span className="flex-1 text-zinc-500 text-[9px] truncate">Hernandez (SUB R2)</span>
                                <span className="flex-1 text-blue-300/80 text-[9px] truncate font-bold">Strickland (KO R1)</span>
                                <span className="font-black text-sm text-zinc-600 w-8 text-right">0</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Variant 2: Card Grid */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded">V2</span>
                        <div>
                            <h3 className="text-lg font-bold">Card Grid</h3>
                            <p className="text-xs text-zinc-500">Visual grid of picks, emphasizes fighters.</p>
                        </div>
                    </div>
                    <div className="border border-dashed border-zinc-700 rounded-2xl bg-zinc-950/50 p-4">
                        <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950 p-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">My Picks</span>
                                <span className="text-lg font-black text-yellow-500">45 PTS</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {/* Correct Pick */}
                                <div className="bg-zinc-900 border border-green-500/30 rounded-xl p-3 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-8 h-8 bg-green-500/20 rounded-bl-xl flex items-center justify-center">
                                        <Check className="w-4 h-4 text-green-500" />
                                    </div>
                                    <p className="text-[9px] uppercase font-bold text-zinc-500 mb-1">Middleweight</p>
                                    <h4 className="font-black text-white text-sm">Strickland</h4>
                                    <div className="mt-2 space-y-1">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-zinc-500">Choice:</span>
                                            <span className="font-bold text-blue-400">DEC</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-zinc-500">Result:</span>
                                            <span className="font-bold text-zinc-300">DEC</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-zinc-800 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-green-500">+15 Pts</span>
                                    </div>
                                </div>
                                {/* Incorrect Pick */}
                                <div className="bg-zinc-900 border border-red-500/30 rounded-xl p-3 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-8 h-8 bg-red-500/10 rounded-bl-xl flex items-center justify-center">
                                        <X className="w-4 h-4 text-red-500/50" />
                                    </div>
                                    <p className="text-[9px] uppercase font-bold text-zinc-500 mb-1">Lightweight</p>
                                    <h4 className="font-black text-white text-sm">Hernandez</h4>
                                    <div className="mt-2 space-y-1">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-zinc-500">Choice:</span>
                                            <span className="font-bold text-blue-400">KO R1</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-zinc-500">Result:</span>
                                            <span className="font-bold text-zinc-300">SUB R2</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-zinc-800 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-zinc-600">0 Pts</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Variant 3a: Compact Timeline Feed (Stacked, No Red/Blue for results) */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-amber-600 text-white text-xs font-bold px-2.5 py-1 rounded">V3a</span>
                        <div>
                            <h3 className="text-lg font-bold">Timeline (Stacked)</h3>
                            <p className="text-xs text-zinc-500">Includes player selector. Uses Green/Orange/Gray for results to avoid Red/Blue corner confusion.</p>
                        </div>
                    </div>
                    <div className="border border-dashed border-zinc-700 rounded-2xl bg-zinc-950/50 p-4 max-w-sm mx-auto">
                        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">

                            {/* Card Header with Player Selector */}
                            <div className="w-full flex items-center justify-between px-3 py-2.5 bg-zinc-900/50 border-b border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <Target className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">My Picks</span>
                                </div>
                                <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
                                    <button className="p-1 hover:bg-zinc-800 rounded transition-colors">
                                        <ChevronLeft className="h-3 w-3 text-zinc-400" />
                                    </button>
                                    <span className="text-[9px] font-bold text-zinc-500 px-1 text-center min-w-[30px]">1 / 8</span>
                                    <button className="p-1 hover:bg-zinc-800 rounded transition-colors">
                                        <ChevronRight className="h-3 w-3 text-zinc-400" />
                                    </button>
                                </div>
                                <span className="text-xs font-black text-yellow-500">45 PTS</span>
                            </div>

                            <div className="p-1">
                                {/* --- MAIN CARD SECTION --- */}
                                <div className="px-2 pt-2 pb-1">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="h-px bg-zinc-800 flex-1" />
                                        <span className="text-[8px] font-bold tracking-widest text-zinc-400 uppercase">Main Card</span>
                                        <div className="h-px bg-zinc-800 flex-1" />
                                    </div>

                                    {/* Feed Item 1 (Correct) */}
                                    <div className="px-2 py-1.5 hover:bg-zinc-900/50 transition-colors border-b border-zinc-800/50 last:border-0 rounded-md">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                                <div className="relative w-6 h-6 bg-zinc-900 rounded-full border border-emerald-500/50 flex items-center justify-center shrink-0">
                                                    <span className="text-[10px]">✅</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline justify-between gap-1">
                                                        <h4 className="text-[11px] font-black text-white truncate">Sean Strickland</h4>
                                                        <span className="text-[8px] font-bold text-zinc-500 bg-zinc-900 px-1 rounded">MW</span>
                                                    </div>
                                                    <div className="flex gap-1.5 text-[9px] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                                        <span className="text-emerald-400 font-bold truncate">Pick: <span className="text-white">DEC</span></span>
                                                        <span className="text-zinc-600 shrink-0">•</span>
                                                        <span className="text-zinc-400 truncate">Result: DEC</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black text-emerald-500 shrink-0">+15</span>
                                        </div>
                                    </div>

                                    {/* Feed Item 2 (Incorrect) */}
                                    <div className="px-2 py-1.5 hover:bg-zinc-900/50 transition-colors border-b border-zinc-800/50 last:border-0 rounded-md">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                                <div className="relative w-6 h-6 bg-zinc-900 rounded-full border border-zinc-500/30 flex items-center justify-center shrink-0 grayscale opacity-70">
                                                    <span className="text-[10px]">❌</span>
                                                </div>
                                                <div className="flex-1 min-w-0 opacity-80">
                                                    <div className="flex items-baseline justify-between gap-1">
                                                        <h4 className="text-[11px] font-black text-zinc-400 truncate strike-through">Anthony Hernandez</h4>
                                                        <span className="text-[8px] font-bold text-zinc-600 bg-zinc-900 px-1 rounded">MW</span>
                                                    </div>
                                                    <div className="flex gap-1.5 text-[9px] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                                        <span className="text-zinc-500 font-bold truncate">Pick: <span className="line-through">KO R1</span></span>
                                                        <span className="text-zinc-700 shrink-0">•</span>
                                                        <span className="text-zinc-400 truncate">Result: SUB R2</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black text-zinc-600 shrink-0">0</span>
                                        </div>
                                    </div>
                                </div>

                                {/* --- PRELIMS SECTION --- */}
                                <div className="px-2 pt-2 pb-1 mt-1">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="h-px bg-zinc-800 flex-1" />
                                        <span className="text-[8px] font-bold tracking-widest text-zinc-500 uppercase">Prelims</span>
                                        <div className="h-px bg-zinc-800 flex-1" />
                                    </div>

                                    {/* Feed Item 3 (Partial) */}
                                    <div className="px-2 py-1.5 hover:bg-zinc-900/50 transition-colors border-b border-zinc-800/50 last:border-0 rounded-md">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                                <div className="relative w-6 h-6 bg-zinc-900 rounded-full border border-amber-500/50 flex items-center justify-center shrink-0">
                                                    <span className="text-[10px]">⚠️</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline justify-between gap-1">
                                                        <h4 className="text-[11px] font-black text-white truncate">John Doe</h4>
                                                        <span className="text-[8px] font-bold text-zinc-500 bg-zinc-900 px-1 rounded">LW</span>
                                                    </div>
                                                    <div className="flex gap-1.5 text-[9px] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                                        <span className="text-amber-500 font-bold truncate">Pick: <span className="text-white">KO R2</span></span>
                                                        <span className="text-zinc-600 shrink-0">•</span>
                                                        <span className="text-zinc-400 truncate">Result: KO R1</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black text-amber-500 shrink-0">+10</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Variant 3b: Compact Timeline Feed (Side-by-Side) */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-orange-600 text-white text-xs font-bold px-2.5 py-1 rounded">V3b</span>
                        <div>
                            <h3 className="text-lg font-bold">Timeline (Side-by-Side)</h3>
                            <p className="text-xs text-zinc-500">Separates Main Card and Prelims horizontally for wider screens.</p>
                        </div>
                    </div>
                    <div className="border border-dashed border-zinc-700 rounded-2xl bg-zinc-950/50 p-4 max-w-2xl mx-auto">
                        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col">

                            {/* Card Header with Player Selector */}
                            <div className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/50 border-b border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-zinc-400 shrink-0" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">My Picks</span>
                                </div>
                                <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
                                    <button className="p-1.5 hover:bg-zinc-800 rounded transition-colors">
                                        <ChevronLeft className="h-4 w-4 text-zinc-400" />
                                    </button>
                                    <span className="text-[10px] font-bold text-zinc-500 px-2 text-center min-w-[40px]">1 / 8</span>
                                    <button className="p-1.5 hover:bg-zinc-800 rounded transition-colors">
                                        <ChevronRight className="h-4 w-4 text-zinc-400" />
                                    </button>
                                </div>
                                <span className="text-sm font-black text-yellow-500">45 PTS</span>
                            </div>

                            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-800/50">
                                {/* --- MAIN CARD SECTION --- */}
                                <div className="flex-1 p-2">
                                    <div className="flex items-center gap-2 mb-2 px-2 pt-1">
                                        <span className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">Main Card</span>
                                        <div className="h-px bg-zinc-800 flex-1" />
                                    </div>

                                    {/* Feed Item 1 (Correct) */}
                                    <div className="px-2 py-1.5 hover:bg-zinc-900/50 transition-colors rounded-md mb-1 border border-transparent hover:border-zinc-800/50">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                                <div className="relative w-7 h-7 bg-zinc-900 rounded-full border border-emerald-500/50 flex items-center justify-center shrink-0">
                                                    <span className="text-xs">✅</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline justify-between gap-1">
                                                        <h4 className="text-xs font-black text-white truncate">Sean Strickland</h4>
                                                        <span className="text-[9px] font-bold text-zinc-500 bg-zinc-900 px-1 rounded">MW</span>
                                                    </div>
                                                    <div className="flex gap-1.5 text-[10px] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                                        <span className="text-emerald-400 font-bold truncate">Pick: <span className="text-white">DEC</span></span>
                                                        <span className="text-zinc-600 shrink-0">•</span>
                                                        <span className="text-zinc-400 truncate">Result: DEC</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-black text-emerald-500 shrink-0">+15</span>
                                        </div>
                                    </div>

                                    {/* Feed Item 2 (Incorrect) */}
                                    <div className="px-2 py-1.5 hover:bg-zinc-900/50 transition-colors rounded-md mb-1 border border-transparent hover:border-zinc-800/50">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                                <div className="relative w-7 h-7 bg-zinc-900 rounded-full border border-zinc-500/30 flex items-center justify-center shrink-0 grayscale opacity-70">
                                                    <span className="text-xs">❌</span>
                                                </div>
                                                <div className="flex-1 min-w-0 opacity-80">
                                                    <div className="flex items-baseline justify-between gap-1">
                                                        <h4 className="text-xs font-black text-zinc-400 truncate line-through">Anthony Hernandez</h4>
                                                        <span className="text-[9px] font-bold text-zinc-600 bg-zinc-900 px-1 rounded">MW</span>
                                                    </div>
                                                    <div className="flex gap-1.5 text-[10px] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                                        <span className="text-zinc-500 font-bold truncate">Pick: <span className="line-through">KO R1</span></span>
                                                        <span className="text-zinc-700 shrink-0">•</span>
                                                        <span className="text-zinc-400 truncate">Result: SUB R2</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-black text-zinc-600 shrink-0">0</span>
                                        </div>
                                    </div>
                                </div>

                                {/* --- PRELIMS SECTION --- */}
                                <div className="flex-1 p-2 bg-zinc-950/30">
                                    <div className="flex items-center gap-2 mb-2 px-2 pt-1">
                                        <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Prelims</span>
                                        <div className="h-px bg-zinc-800 flex-1" />
                                    </div>

                                    {/* Feed Item 3 (Partial) */}
                                    <div className="px-2 py-1.5 hover:bg-zinc-900/50 transition-colors rounded-md mb-1 border border-transparent hover:border-zinc-800/50">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                                <div className="relative w-7 h-7 bg-zinc-900 rounded-full border border-amber-500/50 flex items-center justify-center shrink-0">
                                                    <span className="text-xs">⚠️</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline justify-between gap-1">
                                                        <h4 className="text-xs font-black text-white truncate">John Doe</h4>
                                                        <span className="text-[9px] font-bold text-zinc-500 bg-zinc-900 px-1 rounded">LW</span>
                                                    </div>
                                                    <div className="flex gap-1.5 text-[10px] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                                        <span className="text-amber-500 font-bold truncate">Pick: <span className="text-white">KO R2</span></span>
                                                        <span className="text-zinc-600 shrink-0">•</span>
                                                        <span className="text-zinc-400 truncate">Result: KO R1</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-black text-amber-500 shrink-0">+10</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
