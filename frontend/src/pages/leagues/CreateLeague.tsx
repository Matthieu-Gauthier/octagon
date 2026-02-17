import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLeague } from "@/context/LeagueContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function CreateLeague() {
    const { createLeague } = useLeague();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [survivorEnabled, setSurvivorEnabled] = useState(false);

    // Scoring Settings
    const [winnerPoints, setWinnerPoints] = useState(10);
    const [methodPoints, setMethodPoints] = useState(5);
    const [roundPoints, setRoundPoints] = useState(10);
    const [decisionPoints, setDecisionPoints] = useState(10);

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const leagueId = await createLeague(name, survivorEnabled, {
                winner: winnerPoints,
                method: methodPoints,
                round: roundPoints,
                decision: decisionPoints
            });
            toast.success("League created!");
            navigate(`/leagues/${leagueId}`);
        } catch (error) {
            toast.error("Failed to create league");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Create a League</CardTitle>
                    <CardDescription>Start a group for your friends or office.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">League Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. UFC 300 Watch Party"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-zinc-800 hover:bg-zinc-900 transition-colors">
                            <input
                                type="checkbox"
                                checked={survivorEnabled}
                                onChange={(e) => setSurvivorEnabled(e.target.checked)}
                                className="w-4 h-4 rounded"
                            />
                            <div>
                                <span className="font-semibold text-sm">🔥 Enable Survivor Mode</span>
                                <p className="text-xs text-muted-foreground">Players pick every fight winner. Wrong pick resets streak.</p>
                            </div>
                        </label>

                        {/* Scoring Configuration */}
                        <div className="space-y-3 pt-4 border-t border-zinc-800">
                            <h3 className="text-sm font-bold uppercase text-zinc-500 tracking-wider">Scoring Rules</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="winnerPts" className="text-xs">Winner Points</Label>
                                    <Input id="winnerPts" type="number" min="0" value={winnerPoints} onChange={(e) => setWinnerPoints(Number(e.target.value))} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="methodPts" className="text-xs">Method Bonus</Label>
                                    <Input id="methodPts" type="number" min="0" value={methodPoints} onChange={(e) => setMethodPoints(Number(e.target.value))} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="roundPts" className="text-xs">Round Bonus</Label>
                                    <Input id="roundPts" type="number" min="0" value={roundPoints} onChange={(e) => setRoundPoints(Number(e.target.value))} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="decisionPts" className="text-xs">Decision Bonus</Label>
                                    <Input id="decisionPts" type="number" min="0" value={decisionPoints} onChange={(e) => setDecisionPoints(Number(e.target.value))} />
                                    <p className="text-[10px] text-zinc-500">Awarded for correct decision (replaces round bonus)</p>
                                </div>
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Creating..." : "Create League"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
