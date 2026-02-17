import { MOCK_LEADERBOARD, MOCK_EVENTS } from "@/data/mock-data";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useBets } from "@/store/useBets";
import { calculateTotalScore, isPerfectPick } from "@/lib/scoring";

export function Leaderboard() {
    const { bets } = useBets();

    // Calculate stats for the current user
    const allFights = MOCK_EVENTS.flatMap(e => e.fights);
    const myPoints = calculateTotalScore(bets, allFights);
    const myBetsCount = Object.keys(bets).length;

    const myPerfectPicks = allFights.reduce((count, fight) => {
        const bet = bets[fight.id];
        return isPerfectPick(bet, fight) ? count + 1 : count;
    }, 0);

    // Create an entry for the current user
    const myEntry = {
        userId: "me",
        user: { id: "me", username: "You" },
        points: myPoints,
        betsPlaced: myBetsCount,
        perfectPicks: myPerfectPicks
    };

    // Combine with mock data and sort
    const combinedLeaderboard = [...MOCK_LEADERBOARD, myEntry].sort((a, b) => b.points - a.points);

    return (
        <div className="w-full max-w-2xl mx-auto bg-card rounded-lg border shadow-sm">
            <div className="p-6 border-b">
                <h2 className="text-2xl font-bold tracking-tight">Leaderboard</h2>
                <p className="text-muted-foreground text-sm">Live scores for this event</p>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Rank</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead className="text-center hidden sm:table-cell">Bets</TableHead>
                        <TableHead className="text-center hidden sm:table-cell">Perfect</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {combinedLeaderboard.map((entry, index) => {
                        const rank = index + 1;
                        const isTop3 = rank <= 3;
                        const isMe = entry.userId === "me";

                        return (
                            <TableRow
                                key={entry.userId}
                                className={`${isTop3 ? "bg-accent/50 font-medium" : ""} ${isMe ? "bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary" : ""}`}
                            >
                                <TableCell className="font-mono text-lg">
                                    {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            {isMe ? (
                                                <AvatarFallback className="bg-primary text-primary-foreground">ME</AvatarFallback>
                                            ) : (
                                                <>
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.user.username}`} />
                                                    <AvatarFallback>{entry.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </>
                                            )}
                                        </Avatar>
                                        <span className={isMe ? "font-bold text-primary" : ""}>
                                            {entry.user.username}
                                            {isMe && " (You)"}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center hidden sm:table-cell text-muted-foreground">
                                    {entry.betsPlaced}
                                </TableCell>
                                <TableCell className="text-center hidden sm:table-cell">
                                    {entry.perfectPicks > 0 && (
                                        <Badge variant="outline" className="border-yellow-600 text-yellow-600 text-xs">
                                            {entry.perfectPicks} 🔥
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-bold text-lg text-primary">
                                    {entry.points}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
