import { useState, useEffect } from "react";
import { EventSelector } from "@/components/EventSelector";
import { useEvents, useFetchNextEvent, useRemoveEvent } from "@/hooks/useEvents";
import { useUpdateFightResult } from "@/hooks/useAdminFights";
import { EventSkeleton } from "@/components/skeletons/EventSkeleton";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, RotateCcw, Trash2 } from "lucide-react";

export function AdminResults() {
    const { data: events, isLoading, error } = useEvents();
    const updateResult = useUpdateFightResult();
    const fetchEventMutation = useFetchNextEvent();
    const removeEventMutation = useRemoveEvent();

    const [currentEventId, setCurrentEventId] = useState<string>("");

    // Smart event auto-selection: LIVE first, then most recent FINISHED, then first
    useEffect(() => {
        if (events && events.length > 0 && !currentEventId) {
            const liveEvent = events.find(e => e.status === "LIVE");
            if (liveEvent) {
                setCurrentEventId(liveEvent.id);
                return;
            }
            const finishedEvents = events
                .filter(e => e.status === "FINISHED")
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            if (finishedEvents.length > 0) {
                setCurrentEventId(finishedEvents[0].id);
                return;
            }
            setCurrentEventId(events[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events]);

    const currentEvent = events?.find(e => e.id === currentEventId);

    const [results, setResults] = useState<Record<string, { winnerId: string; method: string; round: number }>>({});
    const [hideCompleted, setHideCompleted] = useState(false);

    const handleRemoveEvent = () => {
        if (currentEvent && window.confirm(`Are you sure you want to remove ${currentEvent.name}? This will delete all associated fights and bets.`)) {
            removeEventMutation.mutate(currentEvent.id, {
                onSuccess: () => {
                    setCurrentEventId("");
                    window.alert("Event removed successfully.");
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onError: (err: any) => {
                    window.alert(`Failed to remove event: ${err?.message || "Unknown error"}`);
                }
            });
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleResultChange = (fight: any, field: string, value: string | number) => {
        setResults(prev => {
            const current = Object.keys(prev).includes(fight.id) ? prev[fight.id] : {
                winnerId: fight.winnerId || "",
                method: fight.method || "",
                round: fight.round || 0
            };

            const newResult = { ...current, [field]: value };

            const isDrawOrNC = newResult.method === "DRAW" || newResult.method === "NC";
            const isComplete = isDrawOrNC ||
                (newResult.winnerId && newResult.method && (newResult.method === "DECISION" || newResult.round > 0));

            if (isComplete) {
                const isDecision = newResult.method === "DECISION";
                updateResult.mutate({
                    fightId: fight.id,
                    data: {
                        winnerId: isDrawOrNC ? undefined : newResult.winnerId,
                        method: newResult.method,
                        round: (isDecision || isDrawOrNC) ? undefined : newResult.round
                    }
                });
            }

            return { ...prev, [fight.id]: newResult };
        });
    };

    const handleReset = (fightId: string) => {
        updateResult.mutate({
            fightId,
            data: { method: null, winnerId: null, round: null }
        });
        setResults(prev => {
            const next = { ...prev };
            delete next[fightId];
            return next;
        });
    };

    if (isLoading) return <EventSkeleton />;
    if (error) return <div className="text-red-500 p-8">Failed to load events.</div>;

    const statusBadge = (status?: string) => {
        if (!status) return null;
        const styles: Record<string, string> = {
            LIVE: "bg-red-500/20 text-red-400 border border-red-500/30",
            FINISHED: "bg-zinc-800 text-zinc-400 border border-zinc-700",
            SCHEDULED: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
        };
        return (
            <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full", styles[status] || styles.SCHEDULED)}>
                {status}
            </span>
        );
    };

    const renderHeader = () => (
        <div className="bg-zinc-900 border-b border-zinc-800 px-8 py-5">
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-xl font-black text-white tracking-tight truncate">
                            {currentEvent?.name || "Fight Results"}
                        </h1>
                        {statusBadge(currentEvent?.status)}
                    </div>
                    <p className="text-zinc-600 text-xs">
                        {currentEvent
                            ? new Date(currentEvent.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
                            : "Select an event to manage results"}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {currentEvent && (
                        <button
                            onClick={() => setHideCompleted(!hideCompleted)}
                            className={cn(
                                "flex items-center gap-1.5 text-xs font-medium px-3 h-7 rounded-full border transition-colors",
                                hideCompleted
                                    ? "bg-zinc-700 text-white border-zinc-600"
                                    : "bg-transparent text-zinc-500 border-zinc-700 hover:text-zinc-300 hover:border-zinc-600"
                            )}
                        >
                            {hideCompleted ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {hideCompleted ? "Show All" : "Hide Completed"}
                        </button>
                    )}

                    <button
                        onClick={() => fetchEventMutation.mutate(undefined, {
                            onSuccess: () => window.alert("Upcoming event fetched successfully!"),
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onError: (err: any) => window.alert(`Failed to fetch event: ${err?.message || "Check the console."}`)
                        })}
                        disabled={fetchEventMutation.isPending}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
                    >
                        {fetchEventMutation.isPending ? "Fetching..." : "Fetch Event"}
                    </button>

                    {currentEvent && (
                        <>
                            <EventSelector currentEvent={currentEvent} onEventChange={setCurrentEventId} />
                            <button
                                onClick={handleRemoveEvent}
                                disabled={removeEventMutation.isPending}
                                title="Remove Event"
                                className="flex items-center justify-center w-7 h-7 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    if (!events || events.length === 0) return (
        <div>
            {renderHeader()}
            <div className="p-8">
                <div className="text-zinc-500 text-sm text-center py-16 bg-zinc-900/40 rounded-xl border border-zinc-800/50">
                    No events found. Click "Fetch Event" to populate the database.
                </div>
            </div>
        </div>
    );

    if (!currentEvent) return (
        <div>
            {renderHeader()}
            <div className="p-8 text-zinc-500 text-sm">Select an event to manage results.</div>
        </div>
    );

    // Sorting: Main Event -> Co-Main -> Main Card -> Prelims
    let sortedFights = [...(currentEvent.fights || [])].sort((a, b) => {
        if (a.isMainEvent) return -1;
        if (b.isMainEvent) return 1;
        if (a.isCoMainEvent) return -1;
        if (b.isCoMainEvent) return 1;
        if (a.isMainCard && !b.isMainCard) return -1;
        if (!a.isMainCard && b.isMainCard) return 1;
        return 0;
    });

    if (hideCompleted) {
        sortedFights = sortedFights.filter(f => !f.method);
    }

    const mainCardFights = sortedFights.filter(f => f.isMainCard);
    const prelimFights = sortedFights.filter(f => !f.isMainCard);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderFightRow = (fight: any) => {
        const currentResult = results[fight.id] || {
            winnerId: fight.winnerId || "",
            method: fight.method || "",
            round: fight.round || 0
        };

        const isDrawOrNC = currentResult.method === "DRAW" || currentResult.method === "NC";
        const isSaved = !!fight.method;
        const isDecision = currentResult.method === "DECISION";
        const isUpdatingThisFight = updateResult.variables?.fightId === fight.id && updateResult.isPending;
        const showRounds = !isDecision && !isDrawOrNC;

        const METHODS = [
            { label: "KO/TKO", value: "KO/TKO" },
            { label: "SUB",    value: "SUBMISSION" },
            { label: "DEC",    value: "DECISION" },
            { label: "DRAW",   value: "DRAW" },
            { label: "NC",     value: "NC" },
        ];
        const maxRounds = fight.rounds || 3;

        return (
            <div key={fight.id} className={cn("flex items-center border-b border-zinc-800/50 transition-opacity group", isSaved ? "opacity-50 hover:opacity-100" : "")}>

                {/* Badge — 80px */}
                <div className="w-20 shrink-0 px-4 py-2">
                    {fight.isMainEvent && <span className="text-[9px] font-black uppercase text-amber-500 border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 rounded">Main</span>}
                    {fight.isCoMainEvent && !fight.isMainEvent && <span className="text-[9px] font-black uppercase text-zinc-400 border border-zinc-700 px-1.5 py-0.5 rounded">Co-Main</span>}
                </div>

                {/* Fighter A — flex-1 */}
                <div className="flex-1 min-w-0 py-2 pr-2">
                    <button onClick={() => !isDrawOrNC && handleResultChange(fight, "winnerId", fight.fighterA.id)} disabled={isDrawOrNC} title={fight.fighterA.name}
                        className={cn("h-7 px-3 text-[11px] font-bold rounded truncate w-full transition-colors", currentResult.winnerId === fight.fighterA.id ? "bg-white text-zinc-900" : "bg-zinc-800/50 text-zinc-400 hover:text-white border border-zinc-700")}>
                        {fight.fighterA.name}
                    </button>
                </div>

                {/* vs */}
                <span className="text-zinc-700 text-[10px] font-bold shrink-0 px-1">vs</span>

                {/* Fighter B — flex-1 */}
                <div className="flex-1 min-w-0 py-2 pl-2">
                    <button onClick={() => !isDrawOrNC && handleResultChange(fight, "winnerId", fight.fighterB.id)} disabled={isDrawOrNC} title={fight.fighterB.name}
                        className={cn("h-7 px-3 text-[11px] font-bold rounded truncate w-full transition-colors", currentResult.winnerId === fight.fighterB.id ? "bg-white text-zinc-900" : "bg-zinc-800/50 text-zinc-400 hover:text-white border border-zinc-700")}>
                        {fight.fighterB.name}
                    </button>
                </div>

                {/* Separator */}
                <div className="w-px h-8 bg-zinc-800 mx-3 shrink-0" />

                {/* Method — 220px */}
                <div className="w-[220px] shrink-0 flex gap-1 py-2">
                    {METHODS.map(({ label, value }) => (
                        <button key={value} onClick={() => handleResultChange(fight, "method", value)}
                            className={cn("flex-1 h-7 rounded text-[10px] font-bold transition-colors", currentResult.method === value ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:text-white hover:bg-zinc-800")}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Separator */}
                <div className="w-px h-8 bg-zinc-800 mx-3 shrink-0" />

                {/* Rounds — 140px (5 × 28px) */}
                <div className={cn("w-[140px] shrink-0 flex gap-1 py-2", !showRounds && "opacity-0 pointer-events-none")}>
                    {Array.from({ length: maxRounds }, (_, i) => i + 1).map((r) => (
                        <button key={r} onClick={() => showRounds && handleResultChange(fight, "round", r)}
                            className={cn("flex-1 h-7 rounded text-[10px] font-bold transition-colors", currentResult.round === r && showRounds ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:text-white hover:bg-zinc-800")}>
                            {r}
                        </button>
                    ))}
                </div>

                {/* Status / reset — 96px */}
                <div className="w-24 shrink-0 flex items-center justify-end gap-2 px-4 py-2">
                    {isUpdatingThisFight && <span className="animate-pulse text-zinc-500 text-[10px]">Saving…</span>}
                    {isSaved && !isUpdatingThisFight && (
                        <>
                            <span className="text-emerald-500 text-xs">✓</span>
                            <button onClick={() => handleReset(fight.id)} title="Reset"
                                className="flex items-center gap-1 h-6 px-2 text-[10px] text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-zinc-800">
                                <RotateCcw className="w-2.5 h-2.5" /> Reset
                            </button>
                        </>
                    )}
                </div>

            </div>
        );
    };

    const sectionLabel = (title: string) => (
        <div className="text-xs font-black uppercase tracking-widest text-zinc-600 pt-6 pb-2 px-4">
            {title}
        </div>
    );

    return (
        <div>
            {renderHeader()}

            <div className="w-full max-w-5xl mx-auto pb-20">
                {mainCardFights.length > 0 && (
                    <>
                        {sectionLabel("Main Card")}
                        <div>
                            {mainCardFights.map(renderFightRow)}
                        </div>
                    </>
                )}

                {prelimFights.length > 0 && (
                    <>
                        {sectionLabel("Prelims")}
                        <div>
                            {prelimFights.map(renderFightRow)}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
