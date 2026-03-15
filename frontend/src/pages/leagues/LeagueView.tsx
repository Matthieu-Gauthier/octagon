import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Flame, Trophy, Compass, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeague } from "@/hooks/useLeagues";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { LeagueDashboard } from "./LeagueDashboard";
import { MobilePicks } from "@/pages/mobile/MobilePicks";
import { MobileStandings } from "@/pages/mobile/MobileStandings";
import { MobileExplore } from "@/pages/mobile/MobileExplore";
import { ProfileEditor } from "@/components/ProfileEditor";
import { useMe } from "@/hooks/useUser";

type Tab = "picks" | "standings" | "explore";

const NAV: { tab: Tab; icon: typeof Flame; label: string }[] = [
    { tab: "picks",     icon: Flame,   label: "Picks"     },
    { tab: "standings", icon: Trophy,  label: "Standings" },
    { tab: "explore",   icon: Compass, label: "Explore"   },
];

function EventPicker({
    events,
    selectedId,
    onSelect,
    onClose,
}: {
    events: { id: string; name: string; date: string; status: string }[];
    selectedId: string;
    onSelect: (id: string) => void;
    onClose: () => void;
}) {
    return (
        <div className="absolute inset-0 z-10 flex flex-col bg-black/95 backdrop-blur">
            <div className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-zinc-900">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Select Event</p>
                <button
                    onClick={onClose}
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-500 active:text-white transition-colors"
                >
                    Done
                </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-none py-3 px-4 space-y-1.5">
                {[...events].reverse().map(event => {
                    const isSelected = event.id === selectedId;
                    const dateStr = new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                    return (
                        <button
                            key={event.id}
                            onClick={() => { onSelect(event.id); onClose(); }}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all",
                                isSelected
                                    ? "border-zinc-600 bg-zinc-900"
                                    : "border-zinc-900 bg-zinc-950 active:bg-zinc-900",
                            )}
                        >
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "text-[12px] font-black uppercase tracking-tight truncate",
                                    isSelected ? "text-white" : "text-zinc-300",
                                )}>
                                    {event.name}
                                </p>
                                <p className="text-[9px] font-bold text-zinc-600 mt-0.5 uppercase tracking-wider">
                                    {dateStr}
                                    {event.status === "FINISHED" && (
                                        <span className="ml-2 text-zinc-700">· Finished</span>
                                    )}
                                </p>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function MobileLeagueView() {
    const { leagueId = "" } = useParams();
    const { user } = useAuth();
    const { data: league } = useLeague(leagueId);
    const { data: events } = useEvents();
    const { data: me } = useMe();
    const [tab, setTab] = useState<Tab>("picks");
    const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
    const [showEventPicker, setShowEventPicker] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [exploreUserId, setExploreUserId] = useState<string | undefined>(undefined);

    // Default to first non-finished event once events load
    useEffect(() => {
        if (!events || selectedEventId) return;
        const def = events.find(e => e.status !== "FINISHED") ?? events[events.length - 1];
        if (def) setSelectedEventId(def.id);
    }, [events, selectedEventId]);

    const currentEvent = selectedEventId
        ? events?.find(e => e.id === selectedEventId)
        : (events?.find(e => e.status !== "FINISHED") ?? events?.[events.length - 1]);

    const eventDate = currentEvent
        ? new Date(currentEvent.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "";
    const initials = me?.username
        ? me.username.slice(0, 2).toUpperCase()
        : (user?.email?.slice(0, 2).toUpperCase() ?? "?");

    return (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col overflow-hidden">

            {/* ── Header (fixe) ───────────────────────────────────────────── */}
            <header className="shrink-0 flex items-center justify-between px-4 border-b border-zinc-900 bg-black h-14">
                <div className="flex items-center gap-2.5">
                    <span className="font-black text-red-600 text-lg tracking-tighter italic leading-none">
                        OCTAGON
                    </span>
                    <div className="w-px h-4 bg-zinc-800" />
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 leading-none">
                            {league?.name ?? "—"}
                        </p>
                        {/* Clickable event — opens picker */}
                        <button
                            onClick={() => setShowEventPicker(true)}
                            className="flex items-center gap-1 group"
                        >
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-tight text-white leading-snug group-active:text-zinc-400 transition-colors">
                                    {currentEvent?.name ?? "—"}
                                </p>
                                {eventDate && (
                                    <p className="text-[9px] font-bold text-zinc-500 leading-none">{eventDate}</p>
                                )}
                            </div>
                            <ChevronRight className="w-3 h-3 text-zinc-600 group-active:text-zinc-400 transition-colors shrink-0" />
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => setShowProfile(true)}
                    className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-black text-zinc-400 uppercase select-none active:bg-zinc-700 transition-colors"
                >
                    {initials}
                </button>
            </header>

            {/* ── Content (flex-1 — les images de combattants s'adaptent) ── */}
            <main className="flex-1 min-h-0 overflow-hidden relative">
                {tab === "picks"     && <MobilePicks     eventId={selectedEventId} />}
                {tab === "standings" && <MobileStandings eventId={selectedEventId} onSelectUser={(userId) => { setExploreUserId(userId); setTab("explore"); }} />}
                {tab === "explore"   && <MobileExplore   eventId={selectedEventId} defaultUserId={exploreUserId} />}

                {/* ── Event picker overlay ─────────────────────────────── */}
                {showEventPicker && events && (
                    <EventPicker
                        events={events}
                        selectedId={selectedEventId ?? ""}
                        onSelect={setSelectedEventId}
                        onClose={() => setShowEventPicker(false)}
                    />
                )}

                {/* ── Profile overlay ──────────────────────────────────── */}
                {showProfile && (
                    <ProfileEditor onClose={() => setShowProfile(false)} />
                )}
            </main>

            {/* ── Bottom Nav (fixe) ───────────────────────────────────────── */}
            <nav className="shrink-0 border-t border-zinc-900 bg-black/95 backdrop-blur safe-area-bottom">
                <div className="flex items-stretch h-14">
                    {NAV.map(({ tab: t, icon: Icon, label }) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center gap-1 transition-colors select-none",
                                tab === t ? "text-red-500" : "text-zinc-600 active:text-zinc-300",
                            )}
                        >
                            <Icon className={cn("w-5 h-5", tab === t && "fill-red-500/20")} />
                            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
}

export function LeagueView() {
    const isMobile = useIsMobile();
    return isMobile ? <MobileLeagueView /> : <LeagueDashboard />;
}
