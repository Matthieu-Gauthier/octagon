// SurvivorContext — temporairement désactivé (pas encore utilisé en production)
// Ce contexte utilise encore des données mock (mock-survivor.ts) et devra être
// branché sur l'API backend avant d'être réactivé.
//
// Pour réactiver :
//   1. Importer SurvivorProvider dans main.tsx
//   2. Brancher sur l'API /api/survivor/*
//   3. Retirer ces commentaires

/*
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { SurvivorProfile, SurvivorPick, EventResult, MOCK_SURVIVOR_PICKS } from "@/data/mock-survivor";
import { useAuth } from "./AuthContext";

interface SurvivorContextType {
    profile: SurvivorProfile | null;
    picks: SurvivorPick[];
    makePick: (eventId: string, fightId: string, fighterId: string) => void;
    getPicksForEvent: (eventId: string) => SurvivorPick[];
    getEventResult: (eventId: string) => EventResult;
}

const SurvivorContext = createContext<SurvivorContextType | undefined>(undefined);

export function SurvivorProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [picks, setPicks] = useState<SurvivorPick[]>([]);

    useEffect(() => {
        if (user) {
            setPicks(MOCK_SURVIVOR_PICKS);
        }
    }, [user]);

    const getEventResult = (eventId: string): EventResult => {
        const eventPicks = picks.filter(p => p.eventId === eventId);
        if (eventPicks.length === 0) return "PENDING";
        if (eventPicks.some(p => p.status === "PENDING")) return "PENDING";
        if (eventPicks.some(p => p.status === "LOST")) return "FAILED";
        return "PERFECT";
    };

    const profile = useMemo<SurvivorProfile | null>(() => {
        if (!user) return null;

        const eventIds = [...new Set(picks.map(p => p.eventId))];
        const sortedEventIds = eventIds.sort((a: string, b: string) => a.localeCompare(b));

        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;

        for (const eventId of sortedEventIds) {
            const result = getEventResult(eventId);
            if (result === "PERFECT") {
                tempStreak++;
                if (tempStreak > bestStreak) bestStreak = tempStreak;
            } else if (result === "FAILED") {
                tempStreak = 0;
            }
        }
        currentStreak = tempStreak;

        return {
            userId: user.id || "me",
            currentStreak,
            bestStreak,
        };
    }, [picks, user]);

    const makePick = (eventId: string, fightId: string, fighterId: string) => {
        if (!profile) return;

        const existingPickIndex = picks.findIndex(p => p.fightId === fightId);

        const newPick: SurvivorPick = {
            id: existingPickIndex >= 0 ? picks[existingPickIndex].id : `p-${Date.now()}`,
            userId: user?.id || "me",
            eventId,
            fightId,
            fighterId,
            weekNumber: picks.length + 1,
            status: "PENDING"
        };

        if (existingPickIndex >= 0) {
            const newPicks = [...picks];
            newPicks[existingPickIndex] = newPick;
            setPicks(newPicks);
        } else {
            setPicks([...picks, newPick]);
        }
    };

    const getPicksForEvent = (eventId: string) => {
        return picks.filter(p => p.eventId === eventId);
    };

    return (
        <SurvivorContext.Provider value={{ profile, picks, makePick, getPicksForEvent, getEventResult }}>
            {children}
        </SurvivorContext.Provider>
    );
}

export function useSurvivor() {
    const context = useContext(SurvivorContext);
    if (context === undefined) {
        throw new Error("useSurvivor must be used within a SurvivorProvider");
    }
    return context;
}
*/

export { }; // Garde le module valide pour TypeScript
