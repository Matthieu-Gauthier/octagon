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
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const leagueId = await createLeague(name, survivorEnabled);
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
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Creating..." : "Create League"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
