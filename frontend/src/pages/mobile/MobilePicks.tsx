import { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FullScreenFightCard } from "@/components/FullScreenFightCard";
import type { FightCardPick, ResultBreakdown } from "@/components/FightCard";
import { useEvents } from "@/hooks/useEvents";
import { useBets, usePlaceBet, useRemoveBet } from "@/hooks/useBets";
import { useLeague } from "@/hooks/useLeagues";
import { useAuth } from "@/context/AuthContext";
import { calcFightPoints, DEFAULT_SCORING } from "@/hooks/useLeagueData";
import type { Fight, BetDTO } from "@/types/api";

type Tab = "main" | "prelims";

export function MobilePicks({ eventId }: { eventId?: string }) {
    const { leagueId = "" } = useParams();
    const { user } = useAuth();

    const { data: events } = useEvents();
    const { data: league } = useLeague(leagueId);
    const { data: allBets } = useBets(leagueId);
    const { mutate: placeBet } = usePlaceBet();
    const { mutate: removeBet } = useRemoveBet();

    const [tab, setTab] = useState<Tab>("main");
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const event = eventId
        ? events?.find(e => e.id === eventId)
        : (events?.find(e => e.status !== "FINISHED") ?? events?.[events.length - 1]);

    // Reset scroll + index when event changes
    useEffect(() => {
        setTab("main");
        setCurrentIndex(0);
        requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({ left: 0, behavior: "instant" });
        });
    }, [event?.id]);

    const currentUserId = user?.id ?? "";
    const myBets = allBets?.filter(b => b.userId === currentUserId) ?? [];

    const allFights = event?.fights ?? [];
    const mainCard = allFights.filter(f => f.isMainCard);
    const prelims  = allFights.filter(f => !f.isMainCard);
    const fights   = tab === "main" ? mainCard : prelims;

    const switchTab = (next: Tab) => {
        setTab(next);
        setCurrentIndex(0);
        requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({ left: 0, behavior: "instant" });
        });
    };

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCurrentIndex(Math.round(el.scrollLeft / el.clientWidth));
    };

    const goTo = (index: number) => {
        scrollRef.current?.scrollTo({ left: index * (scrollRef.current.clientWidth), behavior: "smooth" });
    };

    const handlePickChange = (fight: Fight, pick: FightCardPick | null) => {
        const existing = myBets.find(b => b.fightId === fight.id);
        if (!pick) {
            if (existing) removeBet(existing.id);
            return;
        }
        const isComplete = pick.winnerId && pick.method && (pick.method === "DECISION" || pick.round);
        if (!isComplete) return;
        const dto: BetDTO = {
            leagueId,
            fightId: fight.id,
            winnerId: pick.winnerId,
            method: pick.method,
            round: pick.round,
        };
        placeBet(dto);
    };

    const getPickForFight = (fight: Fight): FightCardPick | null => {
        const bet = myBets.find(b => b.fightId === fight.id);
        if (!bet) return null;
        return { winnerId: bet.winnerId, method: bet.method as FightCardPick["method"], round: bet.round };
    };

    const isLocked = (fight: Fight) =>
        fight.status === "FINISHED" || event?.status === "FINISHED";

    const lockAt = (fight: Fight) =>
        fight.isPrelim ? (event?.prelimsStartAt ?? null) : (event?.mainCardStartAt ?? null);

    const scoring = { ...DEFAULT_SCORING, ...(league?.scoringSettings as object ?? {}) };

    const getResultBreakdown = (fight: Fight): ResultBreakdown | undefined => {
        if (fight.status !== "FINISHED" || !fight.winnerId) return undefined;
        const bet = myBets.find(b => b.fightId === fight.id);
        const winner = fight.winnerId === fight.fighterA.id ? fight.fighterA : fight.fighterB;
        const { points, winnerCorrect, methodCorrect, roundCorrect } = calcFightPoints(fight, bet, scoring);
        return {
            userPick: bet
                ? { winnerId: bet.winnerId, winnerName: (bet.winnerId === fight.fighterA.id ? fight.fighterA : fight.fighterB).name, method: bet.method, round: bet.round ?? undefined }
                : { winnerId: "", winnerName: "" },
            result: { winnerId: fight.winnerId, winnerName: winner.name, method: fight.method ?? undefined, round: fight.round ?? undefined },
            scoring: { winnerCorrect, methodCorrect, roundCorrect, points },
        };
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">

            {/* ── Tab toggle + fight counter ──────────────────────────────── */}
            <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-zinc-900/50 bg-black">
                <div className="flex gap-1 flex-1 bg-zinc-900/70 rounded-xl p-1">
                    {(["main", "prelims"] as Tab[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => switchTab(t)}
                            className={cn(
                                "flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                tab === t ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500",
                            )}
                        >
                            {t === "main" ? "Main Card" : "Prelims"}
                        </button>
                    ))}
                </div>
                <div className="shrink-0 text-right">
                    <p className="text-[11px] font-black text-zinc-300 leading-none">
                        {currentIndex + 1}
                        <span className="text-zinc-600 font-bold"> / {fights.length}</span>
                    </p>
                </div>
            </div>

            {/* ── Swipeable fight cards ───────────────────────────────────── */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 flex overflow-x-auto snap-x snap-mandatory min-h-0"
                style={{ scrollbarWidth: "none" } as React.CSSProperties}
            >
                {fights.map((fight, i) => (
                    <div
                        key={fight.id}
                        className={cn(
                            "w-full h-full shrink-0 snap-center transition-all duration-300",
                            i !== currentIndex && "opacity-40 scale-[0.97]",
                        )}
                    >
                        <FullScreenFightCard
                            fight={fight}
                            value={getPickForFight(fight)}
                            locked={isLocked(fight)}
                            lockAt={lockAt(fight)}
                            onPickChange={(pick) => handlePickChange(fight, pick)}
                            resultBreakdown={getResultBreakdown(fight)}
                        />
                    </div>
                ))}
                {fights.length === 0 && (
                    <div className="w-full h-full shrink-0 snap-center flex items-center justify-center">
                        <p className="text-zinc-600 text-sm font-bold uppercase tracking-widest">No fights</p>
                    </div>
                )}
            </div>

            {/* ── Navigation dots ─────────────────────────────────────────── */}
            <div className="shrink-0 flex items-center justify-center gap-1.5 py-2.5 border-t border-zinc-900/40 bg-black">
                {fights.map((fight, i) => (
                    <button
                        key={i}
                        onClick={() => goTo(i)}
                        className={cn(
                            "rounded-full transition-all duration-300",
                            i === currentIndex
                                ? "w-5 h-1.5 bg-red-500"
                                : getPickForFight(fight)
                                    ? "w-1.5 h-1.5 bg-zinc-500"
                                    : "w-1.5 h-1.5 bg-zinc-800",
                        )}
                        aria-label={`Fight ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
