import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLeague } from "@/context/LeagueContext";
import { Plus, Users, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export function LeaguesHub() {
    const { myLeagues, joinLeague } = useLeague();
    const [joinCode, setJoinCode] = useState("");

    const handleJoin = async () => {
        try {
            await joinLeague(joinCode);
            toast.success("Joined league successfully!");
            setJoinCode("");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to join");
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Leagues</h1>
                    <p className="text-muted-foreground">Compete against your friends.</p>
                </div>
                <Link to="/leagues/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create League
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/30 p-4 rounded-lg border">
                <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-sm">Join a League</h3>
                    <p className="text-xs text-muted-foreground">Got an invite code?</p>
                </div>
                <div className="flex gap-2 w-full max-w-sm">
                    <Input
                        className="h-9"
                        placeholder="Enter Code..."
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    />
                    <Button size="sm" onClick={handleJoin}>Join</Button>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-bold">My Leagues</h2>
                {myLeagues.length === 0 ? (
                    <div className="text-center py-10 bg-muted/20 rounded-lg border-2 border-dashed">
                        <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <h3 className="font-semibold">No leagues yet</h3>
                        <p className="text-sm text-muted-foreground">Join one above or create your own!</p>
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {myLeagues.map(league => (
                            <Link key={league.id} to={`/leagues/${league.id}`}>
                                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                                    <CardHeader>
                                        <CardTitle className="flex justify-between items-center">
                                            {league.name}
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2">
                                            {league.members.length} members
                                            {league.survivorEnabled && (
                                                <span className="text-orange-500 text-[10px] font-bold">🔥 SURVIVOR</span>
                                            )}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xs bg-secondary inline-block px-2 py-1 rounded font-mono">
                                            Code: {league.code}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
