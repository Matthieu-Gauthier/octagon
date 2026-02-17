import { createContext, useContext, useState } from "react";
import { League, MOCK_LEAGUES } from "@/data/mock-leagues";
import { useAuth } from "./AuthContext";

interface LeagueContextType {
    myLeagues: League[];
    getLeague: (id: string) => League | undefined;
    createLeague: (name: string, survivorEnabled?: boolean, scoringSettings?: { winner: number; method: number; round: number; decision: number }) => Promise<string>;
    joinLeague: (code: string) => Promise<boolean>;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export function LeagueProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [leagues, setLeagues] = useState<League[]>(MOCK_LEAGUES);

    const myLeagues = leagues.filter(l =>
        l.members.includes("me") || (user && l.members.includes(user.id))
    );

    const getLeague = (id: string) => leagues.find(l => l.id === id);

    const createLeague = async (name: string, survivorEnabled = false, scoringSettings: { winner: number; method: number; round: number; decision: number } = { winner: 10, method: 5, round: 10, decision: 10 }) => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        const newLeague: League = {
            id: `l-${Date.now()}`,
            name,
            code,
            adminId: user?.id || "me",
            members: [user?.id || "me"],
            survivorEnabled,
            scoringSettings,
        };

        setLeagues([...leagues, newLeague]);
        return newLeague.id;
    };

    const joinLeague = async (code: string) => {
        const leagueIndex = leagues.findIndex(l => l.code === code);
        if (leagueIndex === -1) {
            throw new Error("Invalid league code");
        }

        const league = leagues[leagueIndex];
        const userId = user?.id || "me";

        if (league.members.includes(userId)) {
            throw new Error("You are already in this league");
        }

        const updatedLeague = {
            ...league,
            members: [...league.members, userId]
        };

        const newLeagues = [...leagues];
        newLeagues[leagueIndex] = updatedLeague;
        setLeagues(newLeagues);

        return true;
    };

    return (
        <LeagueContext.Provider value={{ myLeagues, getLeague, createLeague, joinLeague }}>
            {children}
        </LeagueContext.Provider>
    );
}

export function useLeague() {
    const context = useContext(LeagueContext);
    if (context === undefined) {
        throw new Error("useLeague must be used within a LeagueProvider");
    }
    return context;
}
