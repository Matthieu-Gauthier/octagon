import { useParams, useNavigate } from "react-router-dom";
import { useEvent } from "@/hooks/useEvents";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { VegasFightCard } from "@/components/FightCard";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export function SurvivorPick() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    // SurvivorContext temporairement désactivé — stubs locaux
    const makePick = (_eventId: string, _fightId: string, _fighterId: string) => { };
    const getPicksForEvent = (_eventId: string): { fightId: string; fighterId: string }[] => [];

    // Fetch Data
    const { data: event, isLoading, error } = useEvent(eventId || "");

    // State
    const [selections, setSelections] = useState<Record<string, string>>({});

    // Effect to initialize picks once event is loaded
    useEffect(() => {
        if (event && eventId) {
            const existingPicks = getPicksForEvent(eventId);
            const initialSelections: Record<string, string> = {};
            existingPicks.forEach(p => { initialSelections[p.fightId] = p.fighterId; });
            setSelections(initialSelections);
        }
    }, [event, eventId, getPicksForEvent]);

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto pb-20 pt-10 px-4">
                <Skeleton className="h-8 w-64 mx-auto" />
                <Skeleton className="h-4 w-48 mx-auto" />
                <div className="space-y-4 mt-8">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-64 w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !event) return <div className="text-center py-10">Event not found</div>;


    const handlePickChange = (fightId: string, winnerId: string | null) => {
        if (!winnerId) return;
        setSelections(prev => ({ ...prev, [fightId]: winnerId }));
        makePick(event.id, fightId, winnerId);
    };

    const isComplete = (event.fights?.length || 0) === Object.keys(selections).length;

    const handleFinish = () => {
        if (!isComplete) {
            toast.error("Please pick a winner for every fight!");
            return;
        }
        toast.success("All picks saved!");
        navigate("/survivor");
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">Survivor Picks</h1>
                <p className="text-muted-foreground">Pick a winner for <span className="font-bold text-foreground">EVERY</span> fight.</p>
                <div className="text-sm font-medium">
                    Progress: {Object.keys(selections).length} / {event.fights?.length || 0}
                </div>
            </div>

            <div className="grid gap-4">
                {(event.fights || []).map((fight) => (
                    <VegasFightCard
                        key={fight.id}
                        fight={fight}

                        mode="winner"
                        value={selections[fight.id] ? { winnerId: selections[fight.id] } : null}
                        onPickChange={(pick) => handlePickChange(fight.id, pick?.winnerId ?? null)}
                    />
                ))}
            </div>

            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
                <Button
                    className="w-full shadow-lg"
                    size="lg"
                    onClick={handleFinish}
                    disabled={!isComplete}
                >
                    {isComplete ? "Confirm All Picks" : `${(event.fights?.length || 0) - Object.keys(selections).length} Picks Remaining`}
                </Button>
            </div>
        </div>
    );
}
