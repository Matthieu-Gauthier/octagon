import { Bet } from "@/store/useBets";
import { Fight } from "@/data/mock-data";

export const POINTS = {
    WINNER: 10,
    METHOD: 5,
    ROUND: 5,
};

export function calculatePoints(bet: Bet | undefined, fight: Fight): number {
    if (!bet || !fight.result) return 0;

    let points = 0;

    // 1. Correct Winner
    if (bet.winnerId === fight.result.winnerId) {
        points += POINTS.WINNER;

        // 2. Correct Method (Bonus)
        if (bet.method && bet.method === fight.result.method) {
            points += POINTS.METHOD;
        }

        // 3. Correct Round (Bonus) - Only if method is KO/TKO or SUBMISSION usually, but let's keep it simple
        // If decision, round is usually not applicable for betting unless it's specific "Decision in R3" which doesn't make sense.
        // Let's assume round bonus applies if they predicted the exact round of stoppage.
        if (bet.round && bet.round === fight.result.round) {
            points += POINTS.ROUND;
        }
    }

    return points;
}

export function calculateTotalScore(bets: Record<string, Bet>, fights: Fight[]): number {
    let total = 0;
    fights.forEach(fight => {
        const bet = bets[fight.id];
        total += calculatePoints(bet, fight);
    });
    return total;
}

export function isPerfectPick(bet: Bet | undefined, fight: Fight): boolean {
    if (!bet || !fight.result) return false;
    return (
        bet.winnerId === fight.result.winnerId &&
        bet.method === fight.result.method &&
        bet.round === fight.result.round
    );
}
