import { useState } from "react";
import { MobileFightCard } from "@/components/MobileFightCard";
import type { Fight } from "@/types";
import type { FightCardPick } from "@/components/FightCard";

// ============================================================================
// Mock Data
// ============================================================================
const mainEvent: Fight = {
    id: "strickland-vs-hernandez",
    eventId: "ufc-315",
    division: "Middleweight",
    rounds: 5,
    isMainEvent: true,
    isCoMainEvent: false,
    isMainCard: true,
    isPrelim: false,
    status: "SCHEDULED",
    fighterA: {
        id: "sean-strickland",
        name: "Sean Strickland",
        hometown: "Anaheim, California, United States",
        wins: 28,
        losses: 6,
        noContests: 0,
        winsByKo: 11,
        winsBySub: 3,
        winsByDec: 14,
        height: "6'1\"",
        weight: "185 lbs.",
        reach: "76\"",
        imagePath:
            "https://ufc.com/images/styles/athlete_bio_full_body/s3/2025-01/5/STRICKLAND_SEAN_L_06-01.png?itok=S_BauaBm",
        recentForm: [
            { result: "L", method: "Decision" },
            { result: "W", method: "Decision" },
            { result: "W", method: "Decision" },
        ],
    },
    fighterB: {
        id: "anthony-hernandez",
        name: "Anthony Hernandez",
        hometown: "Los Angeles, California, United States",
        wins: 13,
        losses: 2,
        noContests: 0,
        winsByKo: 5,
        winsBySub: 6,
        winsByDec: 2,
        height: "6'1\"",
        weight: "185 lbs.",
        reach: "75\"",
        imagePath:
            "https://ufc.com/images/styles/athlete_bio_full_body/s3/2025-01/5/HERNANDEZ_ANTHONY_L_10-19.png?itok=6ys_gZcX",
        recentForm: [
            { result: "W", method: "Submission" },
            { result: "W", method: "KO/TKO" },
            { result: "W", method: "Submission" },
        ],
    },
};

// ============================================================================
// Showcase
// ============================================================================
export function FightCardShowcase() {
    const [pick, setPick] = useState<FightCardPick | null>(null);

    return (
        <div className="min-h-screen bg-black text-white font-sans pb-24">
            <div className="px-4 py-6 max-w-sm mx-auto">
                <MobileFightCard
                    fight={mainEvent}
                    mode="full"
                    value={pick}
                    onPickChange={setPick}
                />
            </div>
        </div>
    );
}

export default FightCardShowcase;
