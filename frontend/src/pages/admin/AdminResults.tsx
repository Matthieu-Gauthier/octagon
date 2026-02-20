import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventSelector } from "@/components/EventSelector";
import { useEvents, useFetchNextEvent, useRemoveEvent } from "@/hooks/useEvents";
import { useUpdateFightResult } from "@/hooks/useAdminFights";
import { EventSkeleton } from "@/components/skeletons/EventSkeleton";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Eye, EyeOff, RotateCcw, Trash2 } from "lucide-react";

export function AdminResults() {
    const { data: events, isLoading, error } = useEvents();
    const updateResult = useUpdateFightResult();
    const fetchEventMutation = useFetchNextEvent();
    const removeEventMutation = useRemoveEvent();

    // Default to first event ID once loaded
    const [currentEventId, setCurrentEventId] = useState<string>("");

    // Initialize currentEventId when events load
    useEffect(() => {
        if (events && events.length > 0 && !currentEventId) {
            setCurrentEventId(events[0].id);
        }
    }, [events]);

    const currentEvent = events?.find(e => e.id === currentEventId);

    // Local state to hold temporary results
    const [results, setResults] = useState<Record<string, { winnerId: string; method: string; round: number }>>({});

    // UI State
    const [hideCompleted, setHideCompleted] = useState(false);
    const [mainCardOpen, setMainCardOpen] = useState(true);
    const [prelimsOpen, setPrelimsOpen] = useState(true);

    const handleRemoveEvent = () => {
        if (currentEvent && window.confirm(`Are you sure you want to remove ${currentEvent.name}? This will delete all associated fights and bets.`)) {
            removeEventMutation.mutate(currentEvent.id, {
                onSuccess: () => {
                    setCurrentEventId(""); // Reset selection
                    window.alert(`Event removed successfully.`);
                },
                onError: (err: any) => {
                    window.alert(`Failed to remove event: ${err?.message || "Unknown error"}`);
                }
            });
        }
    };

    const handleResultChange = (fight: any, field: string, value: string | number) => {
        setResults(prev => {
            const current = Object.keys(prev).includes(fight.id) ? prev[fight.id] : {
                winnerId: fight.winnerId || "",
                method: fight.method || "",
                round: fight.round || 0
            };

            const newResult = {
                ...current,
                [field]: value
            };

            // Check if ready to save
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

            return {
                ...prev,
                [fight.id]: newResult
            };
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
    if (error) return <div className="text-red-500">Failed to load events.</div>;

    // Header logic abstracted here to be visible even if no events
    const renderHeader = () => (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Fight Results</h1>
                <p className="text-zinc-400">Manage official outcomes for {currentEvent?.name || "events"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {currentEvent && (
                    <Button
                        variant={hideCompleted ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHideCompleted(!hideCompleted)}
                        className="gap-2"
                    >
                        {hideCompleted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {hideCompleted ? "Show All" : "Hide Completed"}
                    </Button>
                )}

                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchEventMutation.mutate(undefined, {
                        onSuccess: () => window.alert("Upcoming event fetched successfully!"),
                        onError: (err: any) => window.alert(`Failed to fetch event: ${err?.message || "Check the console."}`)
                    })}
                    disabled={fetchEventMutation.isPending}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                    {fetchEventMutation.isPending ? "Fetching..." : "Fetch Upcoming Event"}
                </Button>

                {currentEvent && (
                    <>
                        <div className="h-6 w-px bg-zinc-800 mx-1 hidden sm:block" />
                        <EventSelector currentEvent={currentEvent} onEventChange={setCurrentEventId} />
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={handleRemoveEvent}
                            disabled={removeEventMutation.isPending}
                            className="w-9 h-9 shrink-0"
                            title="Remove Event"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </>
                )}
            </div>
        </div>
    );

    if (!events || events.length === 0) return (
        <div className="space-y-8 pb-20 w-full max-w-4xl mx-auto">
            {renderHeader()}
            <div className="text-zinc-400 text-center py-12 bg-zinc-900/20 rounded-xl border border-zinc-800/50">
                No events found. Click "Fetch Upcoming Event" to populate the database.
            </div>
        </div>
    );
    if (!currentEvent) return <div>Select an event to manage results.</div>;

    // Sorting Logic: Main Event -> Co-Main -> Main Card -> Prelims
    let sortedFights = [...(currentEvent.fights || [])].sort((a, b) => {
        if (a.isMainEvent) return -1;
        if (b.isMainEvent) return 1;
        if (a.isCoMainEvent) return -1;
        if (b.isCoMainEvent) return 1;
        if (a.isMainCard && !b.isMainCard) return -1;
        if (!a.isMainCard && b.isMainCard) return 1;
        return 0; // Keep original order otherwise
    });

    if (hideCompleted) {
        sortedFights = sortedFights.filter(f => !f.method); // Using method to detect completion since DRAW/NC have no winner
    }

    const mainCardFights = sortedFights.filter(f => f.isMainCard);
    const prelimFights = sortedFights.filter(f => !f.isMainCard);

    const renderFightCard = (fight: any) => {
        // Init state from existing fight data if not in local state
        const currentResult = results[fight.id] || {
            winnerId: fight.winnerId || "",
            method: fight.method || "",
            round: fight.round || 0
        };

        const isDrawOrNC = currentResult.method === "DRAW" || currentResult.method === "NC";
        const isSaved = !!fight.method;
        const isDecision = currentResult.method === "DECISION";

        // Show saving feedback
        const isUpdatingThisFight = updateResult.variables?.fightId === fight.id && updateResult.isPending;

        return (
            <Card key={fight.id} className={cn("transition-all overflow-hidden border-zinc-800", isSaved ? "opacity-60 hover:opacity-100" : "")}>
                <div className="p-3 sm:p-4 flex flex-col gap-3">
                    {/* Header Row: Matchup & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                            {fight.isMainEvent && <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 h-5 text-zinc-400 border-zinc-700">Main</Badge>}
                            {fight.isCoMainEvent && <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 h-5 text-zinc-400 border-zinc-700">Co-Main</Badge>}
                            <div className="flex items-center gap-2 text-sm font-medium truncate">
                                <span className={cn(fight.winnerId === fight.fighterA.id ? "text-white font-bold" : "text-zinc-400")}>{fight.fighterA.name}</span>
                                <span className="text-zinc-600 text-xs">vs</span>
                                <span className={cn(fight.winnerId === fight.fighterB.id ? "text-white font-bold" : "text-zinc-400")}>{fight.fighterB.name}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 ml-auto sm:ml-0">
                            {isUpdatingThisFight && <span className="text-xs text-zinc-500 animate-pulse">Saving...</span>}
                            {isSaved && !isUpdatingThisFight && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReset(fight.id)}
                                    disabled={isUpdatingThisFight}
                                    className="h-7 px-2 text-zinc-500 hover:text-white"
                                    title="Reset Result"
                                >
                                    <RotateCcw className="w-3 h-3 mr-1" /> Reset
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                        {/* Winner - Takes up more space on mobile, 4 cols on desktop */}
                        <div className={cn("lg:col-span-4 grid grid-cols-2 gap-2 transition-opacity", isDrawOrNC ? "opacity-30 pointer-events-none" : "opacity-100")}>
                            <Button
                                variant={currentResult.winnerId === fight.fighterA.id ? "default" : "outline"}
                                className={cn(
                                    "h-9 text-xs justify-center px-1 truncate border-zinc-700",
                                    currentResult.winnerId === fight.fighterA.id ? "bg-zinc-100 text-zinc-900 border-transparent hover:bg-white" : "hover:bg-zinc-800 text-zinc-400"
                                )}
                                onClick={() => handleResultChange(fight, "winnerId", fight.fighterA.id)}
                                title={fight.fighterA.name}
                                disabled={isDrawOrNC}
                            >
                                {fight.fighterA.name.split(' ').pop()}
                            </Button>
                            <Button
                                variant={currentResult.winnerId === fight.fighterB.id ? "default" : "outline"}
                                className={cn(
                                    "h-9 text-xs justify-center px-1 truncate border-zinc-700",
                                    currentResult.winnerId === fight.fighterB.id ? "bg-zinc-100 text-zinc-900 border-transparent hover:bg-white" : "hover:bg-zinc-800 text-zinc-400"
                                )}
                                onClick={() => handleResultChange(fight, "winnerId", fight.fighterB.id)}
                                title={fight.fighterB.name}
                                disabled={isDrawOrNC}
                            >
                                {fight.fighterB.name.split(' ').pop()}
                            </Button>
                        </div>

                        {/* Method - 4 Cols */}
                        <div className="lg:col-span-5 flex gap-1 bg-zinc-900/50 p-1 rounded-md border border-zinc-800/50 overflow-x-auto">
                            {["KO/TKO", "SUB", "DEC", "DRAW/NC"].map((label) => {
                                const value = label === "SUB" ? "SUBMISSION" : label === "DEC" ? "DECISION" : label === "DRAW/NC" ? "NC" : label;
                                const isActive = currentResult.method === value || (value === "NC" && currentResult.method === "DRAW");
                                return (
                                    <button
                                        key={label}
                                        onClick={() => handleResultChange(fight, "method", value)}
                                        className={cn(
                                            "flex-1 h-7 px-1 rounded text-[10px] font-medium transition-all whitespace-nowrap min-w-[30px]",
                                            isActive
                                                ? "bg-zinc-100 text-zinc-900 font-bold shadow-sm"
                                                : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                                        )}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Round - Dynamic based on fight rounds */}
                        <div className={cn("lg:col-span-3 flex gap-1 bg-zinc-900/50 p-1 rounded-md border border-zinc-800/50 transition-opacity", (isDecision || isDrawOrNC) ? "opacity-30 pointer-events-none" : "opacity-100")}>
                            {Array.from({ length: fight.rounds || 3 }, (_, i) => i + 1).map((round) => (
                                <button
                                    key={round}
                                    onClick={() => handleResultChange(fight, "round", round)}
                                    className={cn(
                                        "flex-1 h-7 rounded text-[10px] font-bold transition-all",
                                        currentResult.round === round
                                            ? "bg-zinc-100 text-zinc-900 font-bold shadow-sm"
                                            : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                                    )}
                                    disabled={isDecision || isDrawOrNC}
                                >
                                    {round}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div className="space-y-8 pb-20 w-full max-w-4xl mx-auto">
            {renderHeader()}

            {mainCardFights.length > 0 && (
                <div className="space-y-4">
                    <button
                        onClick={() => setMainCardOpen(!mainCardOpen)}
                        className="flex items-center gap-2 text-xl font-bold px-1 text-white hover:text-zinc-300 transition-colors w-full text-left"
                    >
                        {mainCardOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        Main Card
                    </button>

                    {mainCardOpen && (
                        <div className="grid gap-6 animate-in slide-in-from-top-2 duration-200">
                            {mainCardFights.map(renderFightCard)}
                        </div>
                    )}
                </div>
            )}

            {prelimFights.length > 0 && (
                <div className="space-y-4 pt-4">
                    <button
                        onClick={() => setPrelimsOpen(!prelimsOpen)}
                        className="flex items-center gap-2 text-xl font-bold px-1 text-zinc-400 hover:text-zinc-300 transition-colors w-full text-left"
                    >
                        {prelimsOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        Prelims
                    </button>

                    {prelimsOpen && (
                        <div className="grid gap-6 animate-in slide-in-from-top-2 duration-200">
                            {prelimFights.map(renderFightCard)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
