import { useState, useEffect } from "react";
import type { FightCardPick } from "@/components/FightCard";

export type BetMethod = "KO/TKO" | "SUBMISSION" | "DECISION";

interface UseFightPickOptions {
    mode?: "full" | "winner";
    value?: FightCardPick | null;
    locked?: boolean;
    lockAt?: string | null;
    onPickChange?: (pick: FightCardPick | null) => void;
}

export function useFightPick({
    mode = "full",
    value = null,
    locked = false,
    lockAt,
    onPickChange,
}: UseFightPickOptions) {
    const [winner, setWinner] = useState<string | null>(value?.winnerId ?? null);
    const [method, setMethod] = useState<BetMethod | null>((value?.method as BetMethod) ?? null);
    const [round, setRound] = useState<number | null>(value?.round ?? null);

    const isLocked = locked || (!!lockAt && new Date() >= new Date(lockAt));

    useEffect(() => {
        setWinner(value?.winnerId ?? null);
        setMethod((value?.method as BetMethod) ?? null);
        setRound(value?.round ?? null);
    }, [value?.winnerId, value?.method, value?.round]);

    const isComplete =
        mode === "winner"
            ? !!winner
            : !!winner && !!method && (method === "DECISION" || !!round);

    const notify = (w: string | null, m: BetMethod | null, r: number | null) => {
        onPickChange?.(w ? { winnerId: w, method: m ?? undefined, round: r ?? undefined } : null);
    };

    const selectWinner = (id: string) => {
        if (isLocked) return;
        if (winner === id) {
            setWinner(null); setMethod(null); setRound(null);
            notify(null, null, null);
        } else {
            setWinner(id); setMethod(null); setRound(null);
            notify(id, null, null);
        }
    };

    const selectMethod = (m: BetMethod) => {
        if (isLocked || !winner) return;
        const next = method === m ? null : m;
        setMethod(next); setRound(null);
        notify(winner, next, null);
    };

    const selectRound = (r: number) => {
        if (isLocked || !winner) return;
        const next = round === r ? null : r;
        setRound(next);
        notify(winner, method, next);
    };

    const reset = () => {
        if (isLocked) return;
        setWinner(null); setMethod(null); setRound(null);
        notify(null, null, null);
    };

    const getSummary = (): string | null => {
        if (!winner) return null;
        if (mode === "winner") return "WIN";
        if (!method) return null;
        if (method === "DECISION") return "DEC";
        return `${method === "SUBMISSION" ? "SUB" : method} · R${round}`;
    };

    return {
        winner,
        method,
        round,
        isLocked,
        isComplete,
        selectWinner,
        selectMethod,
        selectRound,
        reset,
        getSummary,
    };
}
