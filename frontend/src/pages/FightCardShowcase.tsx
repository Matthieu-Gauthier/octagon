import { useState } from "react";
import { Flame } from "lucide-react";
import { BrowserFightCard } from "@/components/BrowserFightCard";
import type { Fight } from "@/types/api";
import type { FightCardPick } from "@/components/FightCard";

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockMainEvent: Fight = {
    id: "jones-vs-miocic",
    eventId: "ufc-309",
    division: "Heavyweight",
    rounds: 5,
    isMainEvent: true,
    isCoMainEvent: false,
    isMainCard: true,
    isPrelim: false,
    status: "SCHEDULED",
    fighterA: {
        id: "jon-jones", name: "Jon Jones",
        nickname: "Bones",
        isChampion: true,
        hometown: "Rochester, New York, United States",
        wins: 27, losses: 1, draws: 0, noContests: 0,
        winsByKo: 11, winsBySub: 6, winsByDec: 10,
        age: 37, height: `6'4"`, reach: `84.5"`, weight: "265 lbs",
        imagePath: "/fighters/jones.png",
        recentForm: [
            { result: "D", method: "Draw" },
            { result: "W", method: "Submission" },
            { result: "W", method: "Decision" },
        ],
    },
    fighterB: {
        id: "stipe-miocic", name: "Stipe Miocic",
        hometown: "Cleveland, Ohio, United States",
        wins: 20, losses: 4, draws: 0, noContests: 0,
        winsByKo: 12, winsBySub: 2, winsByDec: 6,
        age: 42, height: `6'4"`, reach: `79"`, weight: "265 lbs",
        imagePath: "/fighters/miocic.png",
        recentForm: [
            { result: "W", method: "KO/TKO" },
            { result: "L", method: "KO/TKO" },
            { result: "W", method: "Decision" },
        ],
    },
};

const mockCoMain: Fight = {
    id: "duplessis-vs-adesanya",
    eventId: "ufc-305",
    division: "Middleweight",
    rounds: 5,
    isMainEvent: false,
    isCoMainEvent: true,
    isMainCard: true,
    isPrelim: false,
    status: "SCHEDULED",
    fighterA: {
        id: "dricus-du-plessis", name: "Dricus Du Plessis",
        nickname: "Stillknocks",
        isChampion: true,
        hometown: "Pretoria, South Africa",
        wins: 22, losses: 2, draws: 0, noContests: 0,
        winsByKo: 8, winsBySub: 9, winsByDec: 5,
        age: 31, height: `6'2"`, reach: `76"`, weight: "185 lbs",
        imagePath: "/fighters/duplessis.png",
        recentForm: [
            { result: "W", method: "Submission" },
            { result: "W", method: "KO/TKO" },
            { result: "W", method: "Decision" },
        ],
    },
    fighterB: {
        id: "israel-adesanya", name: "Israel Adesanya",
        nickname: "The Last Stylebender",
        rankingPosition: 3,
        hometown: "Auckland, New Zealand",
        wins: 24, losses: 3, draws: 0, noContests: 0,
        winsByKo: 10, winsBySub: 1, winsByDec: 13,
        age: 35, height: `6'4"`, reach: `80"`, weight: "185 lbs",
        imagePath: "/fighters/adesanya.png",
        recentForm: [
            { result: "L", method: "Decision" },
            { result: "W", method: "KO/TKO" },
            { result: "W", method: "Decision" },
        ],
    },
};

const mockPrelimA: Fight = {
    id: "gaethje-vs-fiziev",
    eventId: "ufc-309",
    division: "Lightweight",
    rounds: 3,
    isMainEvent: false, isCoMainEvent: false,
    isMainCard: false, isPrelim: true,
    status: "SCHEDULED",
    fighterA: {
        id: "justin-gaethje", name: "Justin Gaethje",
        nickname: "The Highlight",
        hometown: "Page, Arizona, United States",
        wins: 25, losses: 5, draws: 0, noContests: 0,
        winsByKo: 18, winsBySub: 1, winsByDec: 6,
        height: `5'11"`, reach: `70"`, weight: "155 lbs",
        imagePath: "/fighters/gaethje.png",
        recentForm: [
            { result: "W", method: "KO/TKO" },
            { result: "L", method: "Submission" },
            { result: "W", method: "KO/TKO" },
        ],
    },
    fighterB: {
        id: "rafael-fiziev", name: "Rafael Fiziev",
        hometown: "Almaty, Kazakhstan",
        wins: 12, losses: 3, draws: 0, noContests: 0,
        winsByKo: 9, winsBySub: 0, winsByDec: 3,
        height: `5'11"`, reach: `74"`, weight: "155 lbs",
        imagePath: "/fighters/fiziev.png",
        recentForm: [
            { result: "W", method: "KO/TKO" },
            { result: "W", method: "KO/TKO" },
            { result: "L", method: "Decision" },
        ],
    },
};

const mockPrelimB: Fight = {
    id: "muhammad-vs-holloway",
    eventId: "ufc-308",
    division: "Welterweight",
    rounds: 5,
    isMainEvent: false, isCoMainEvent: false,
    isMainCard: true, isPrelim: false,
    status: "SCHEDULED",
    fighterA: {
        id: "belal-muhammad", name: "Belal Muhammad",
        nickname: "Remember The Name",
        hometown: "Chicago, Illinois, United States",
        wins: 23, losses: 3, draws: 1, noContests: 0,
        winsByKo: 4, winsBySub: 6, winsByDec: 13,
        height: `5'11"`, reach: `74"`, weight: "170 lbs",
        imagePath: "/fighters/muhammad.png",
        recentForm: [
            { result: "L", method: "KO/TKO" },
            { result: "W", method: "Decision" },
            { result: "W", method: "Decision" },
        ],
    },
    fighterB: {
        id: "max-holloway", name: "Max Holloway",
        nickname: "Blessed",
        hometown: "Waianae, Hawaii, United States",
        wins: 26, losses: 7, draws: 0, noContests: 0,
        winsByKo: 12, winsBySub: 2, winsByDec: 12,
        height: `5'11"`, reach: `69"`, weight: "170 lbs",
        imagePath: "/fighters/holloway.png",
        recentForm: [
            { result: "W", method: "KO/TKO" },
            { result: "W", method: "Decision" },
            { result: "L", method: "Decision" },
        ],
    },
};

// ── Dev page (/showcase) ──────────────────────────────────────────────────────

export function FightCardShowcase() {
    const [mainPick, setMainPick] = useState<FightCardPick | null>(null);
    const [coMainPick, setCoMainPick] = useState<FightCardPick | null>(null);
    const [prelimAPick, setPrelimAPick] = useState<FightCardPick | null>(null);
    const [prelimBPick, setPrelimBPick] = useState<FightCardPick | null>(null);

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

                <div className="px-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-600 mb-1 font-mono">
                        Octagon · Fight Card
                    </p>
                    <h1 className="text-3xl font-black uppercase tracking-tight">
                        UFC <span className="text-red-500">309</span>
                    </h1>
                    <p className="text-[12px] text-zinc-600 font-medium mt-0.5">Jones vs Miocic · Nov 16, 2024</p>
                </div>

                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2 px-1 flex items-center gap-1.5">
                        <Flame className="w-3 h-3 text-red-500 fill-red-500/30" />
                        Main Event — Interactif
                    </p>
                    <BrowserFightCard
                        fight={mockMainEvent}
                        value={mainPick}
                        onPickChange={setMainPick}
                    />
                </div>

                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2 px-1">
                        Co-Main — Verrouillé
                    </p>
                    <BrowserFightCard
                        fight={mockCoMain}
                        locked
                        value={{ winnerId: "israel-adesanya", method: "DECISION" }}
                    />
                </div>

                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2 px-1">
                        Co-Main — Interactif
                    </p>
                    <BrowserFightCard
                        fight={mockCoMain}
                        value={coMainPick}
                        onPickChange={setCoMainPick}
                    />
                </div>

                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2 px-1">
                        Prelims — Interactifs
                    </p>
                    <div className="space-y-3">
                        <BrowserFightCard
                            fight={mockPrelimA}
                            value={prelimAPick}
                            onPickChange={setPrelimAPick}
                        />
                        <BrowserFightCard
                            fight={mockPrelimB}
                            value={prelimBPick}
                            onPickChange={setPrelimBPick}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}

export default FightCardShowcase;
