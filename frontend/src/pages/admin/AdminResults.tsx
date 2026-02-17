import { useState } from "react";
import { MOCK_EVENTS } from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { EventSelector } from "@/components/EventSelector";

export function AdminResults() {
    const [currentEventId, setCurrentEventId] = useState(MOCK_EVENTS[0].id);
    const currentEvent = MOCK_EVENTS.find(e => e.id === currentEventId) || MOCK_EVENTS[0];

    // Local state to hold temporary results before "saving"
    const [results, setResults] = useState<Record<string, { winnerId: string; method: string; round: number }>>({});

    const handleResultChange = (fightId: string, field: string, value: string | number) => {
        setResults(prev => ({
            ...prev,
            [fightId]: {
                ...prev[fightId],
                [field]: value
            }
        }));
    };

    const handleSave = (fightId: string) => {
        const result = results[fightId];
        if (!result || !result.winnerId || !result.method || !result.round) {
            toast.error("Please fill all fields");
            return;
        }

        // In a real app, this would be an API call
        console.log(`Saving result for fight ${fightId}:`, result);
        toast.success("Result saved successfully!");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fight Results</h1>
                    <p className="text-muted-foreground">Enter official results to update the leaderboard.</p>
                </div>
                <EventSelector currentEvent={currentEvent} onEventChange={setCurrentEventId} />
            </div>

            <div className="grid gap-4">
                {currentEvent.fights.map((fight) => (
                    <Card key={fight.id}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">
                                    {fight.fighterA.name} <span className="text-muted-foreground text-sm font-normal">vs</span> {fight.fighterB.name}
                                </CardTitle>
                                <Button size="sm" onClick={() => handleSave(fight.id)}>Save Result</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Winner</Label>
                                    <Select
                                        onValueChange={(val) => handleResultChange(fight.id, "winnerId", val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Winner" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={fight.fighterA.id}>{fight.fighterA.name}</SelectItem>
                                            <SelectItem value={fight.fighterB.id}>{fight.fighterB.name}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Method</Label>
                                    <Select
                                        onValueChange={(val) => handleResultChange(fight.id, "method", val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="KO/TKO">KO/TKO</SelectItem>
                                            <SelectItem value="SUBMISSION">Submission</SelectItem>
                                            <SelectItem value="DECISION">Decision</SelectItem>
                                            <SelectItem value="DRAW">Draw</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Round</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="5"
                                        placeholder="Round"
                                        onChange={(e) => handleResultChange(fight.id, "round", parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
