import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { Flame, Trophy, CheckCircle } from "lucide-react";
import type { Event } from "@/types/api";

export function SurvivorHub({ leagueId, events = [] }: { leagueId?: string; events?: Event[] }) {
    // SurvivorContext temporairement désactivé — stubs locaux
    const profile = { currentStreak: 0, bestStreak: 0 };
    const picks: { eventId: string; fightId: string; fighterId: string; id: string; status: string }[] = [];
    const getPicksForEvent = (_eventId: string) => [];
    const getEventResult = (_eventId: string): 'PERFECT' | 'FAILED' | 'PENDING' => 'PENDING';
    const currentEvent = events.find(e => new Date(e.date) > new Date()) || events[0];
    const eventPicks = currentEvent ? getPicksForEvent(currentEvent.id) : [];
    const hasPicked = eventPicks.length > 0;
    const picksCount = eventPicks.length;
    const totalFights = currentEvent?.fights?.length ?? 0;
    const isComplete = picksCount === totalFights && totalFights > 0;

    if (!profile) return <div>Loading...</div>;
    if (!currentEvent) return <div className="text-center text-muted-foreground py-8">No upcoming event found.</div>;

    // Group picks by event
    const picksByEvent = picks.reduce((acc: Record<string, typeof picks>, pick) => {
        if (!acc[pick.eventId]) {
            acc[pick.eventId] = [];
        }
        acc[pick.eventId].push(pick);
        return acc;
    }, {} as Record<string, typeof picks>);

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-black tracking-tighter uppercase italic text-red-600">
                    Survivor Mode <span className="text-foreground text-xl not-italic border border-destructive px-2 py-1 rounded">HARDCORE</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                    Pick <span className="text-foreground font-bold">ALL</span> winners per event.
                    <br />
                    One wrong pick = <span className="text-destructive font-bold">Streak Reset</span>.
                    <br />
                    <span className="text-sm text-green-600 font-semibold">(Draw/No Contest = Safe)</span>
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-orange-500/50 bg-orange-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Flame className="h-5 w-5 text-orange-500" />
                            Current Streak
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-orange-500">{profile.currentStreak}</div>
                        <p className="text-sm text-muted-foreground mt-1">Consecutive perfect events</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Best Streak
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black">{profile.bestStreak}</div>
                        <p className="text-sm text-muted-foreground mt-1">All-time record</p>
                    </CardContent>
                </Card>

                <Card className="flex flex-col justify-center p-6 space-y-4">
                    {isComplete ? (
                        <Link to={leagueId ? `/leagues/${leagueId}/survivor/pick/${currentEvent.id}` : `/survivor/pick/${currentEvent.id}`}>
                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Picks Complete ({picksCount}/{totalFights})
                            </Button>
                        </Link>
                    ) : (
                        <Link to={leagueId ? `/leagues/${leagueId}/survivor/pick/${currentEvent.id}` : `/survivor/pick/${currentEvent.id}`}>
                            <Button className="w-full" size="lg">
                                {hasPicked ? `Continue Picking (${picksCount}/${totalFights})` : `Start Picks for ${currentEvent.name.split(":")[0]}`}
                            </Button>
                        </Link>
                    )}
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {Object.entries(picksByEvent)
                            .sort(([eventIdA], [eventIdB]) => {
                                const eventA = events.find(e => e.id === eventIdA);
                                const eventB = events.find(e => e.id === eventIdB);
                                if (!eventA || !eventB) return 0;
                                return new Date(eventB.date).getTime() - new Date(eventA.date).getTime();
                            })
                            .map(([eventId, eventPicks]) => {
                                const event = events.find(e => e.id === eventId);
                                const eventName = event ? event.name : eventId;
                                const totalPicks = eventPicks.length;
                                const result = getEventResult(eventId);

                                const resultConfig = {
                                    PERFECT: { color: "text-green-600", text: "PERFECT ✅", badgeVariant: "default" as const },
                                    FAILED: { color: "text-destructive", text: "FAILED ❌", badgeVariant: "destructive" as const },
                                    PENDING: { color: "text-yellow-500", text: "PENDING ⏳", badgeVariant: "outline" as const },
                                };
                                const { color, text } = resultConfig[result];

                                return (
                                    <AccordionItem key={eventId} value={eventId}>
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="flex flex-col items-start gap-1 pr-4 w-full md:flex-row md:items-center md:justify-between">
                                                <div className="text-left">
                                                    <div className="font-bold text-lg">{eventName}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {event ? new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Unknown Date'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm mt-2 md:mt-0">
                                                    <span className={color + " font-bold"}>
                                                        {text}
                                                    </span>
                                                    <Badge variant="outline">
                                                        {totalPicks} Picks
                                                    </Badge>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-2 pt-2">
                                                {eventPicks.map((pick) => {
                                                    // Find the fight to show fighter names
                                                    const fight = event?.fights?.find(f => f.id === pick.fightId);
                                                    const pickedFighter = fight
                                                        ? (fight.fighterA.id === pick.fighterId ? fight.fighterA.name : fight.fighterB.name)
                                                        : pick.fighterId;
                                                    const opponent = fight
                                                        ? (fight.fighterA.id === pick.fighterId ? fight.fighterB.name : fight.fighterA.name)
                                                        : "—";

                                                    return (
                                                        <div key={pick.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                                            <div>
                                                                <span className="font-semibold">{pickedFighter}</span>
                                                                <span className="text-muted-foreground mx-2">vs</span>
                                                                <span className="text-muted-foreground">{opponent}</span>
                                                                {fight && (
                                                                    <span className="ml-2 text-xs text-muted-foreground">({fight.division})</span>
                                                                )}
                                                            </div>
                                                            <Badge variant={
                                                                pick.status === "WON" ? "default" :
                                                                    pick.status === "LOST" ? "destructive" :
                                                                        pick.status === "DRAW" || pick.status === "NC" ? "secondary" :
                                                                            "outline"
                                                            }>
                                                                {pick.status}
                                                            </Badge>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                    </Accordion>
                    {picks.length === 0 && <p className="text-muted-foreground text-center py-8">No history yet.</p>}
                </CardContent>
            </Card>
        </div>
    );
}
