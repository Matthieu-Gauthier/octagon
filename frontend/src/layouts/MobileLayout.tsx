import { NavLink, Outlet, useParams } from "react-router-dom";
import { Flame, Trophy, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeague } from "@/hooks/useLeagues";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/context/AuthContext";

export function MobileLayout() {
    const { leagueId = "" } = useParams();
    const { user } = useAuth();
    const { data: league } = useLeague(leagueId);
    const { data: events } = useEvents();

    const currentEvent = events?.find(e => e.status !== "FINISHED") ?? events?.[events.length - 1];
    const eventDate = currentEvent
        ? new Date(currentEvent.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "";

    const initials = user?.email?.slice(0, 2).toUpperCase() ?? "?";

    const NAV = [
        { to: `/mobile/${leagueId}/picks`,     icon: Flame,   label: "Picks"     },
        { to: `/mobile/${leagueId}/standings`, icon: Trophy,  label: "Standings" },
        { to: `/mobile/${leagueId}/explore`,   icon: Compass, label: "Explore"   },
    ] as const;

    return (
        <div className="h-dvh bg-black text-white flex flex-col overflow-hidden">

            {/* ── Header ─────────────────────────────────────────────────── */}
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
                        <p className="text-[11px] font-black uppercase tracking-tight text-white leading-snug">
                            {currentEvent?.name ?? "—"}
                            {eventDate && (
                                <span className="text-zinc-600 font-bold not-italic tracking-normal"> · {eventDate}</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* User avatar */}
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-black text-zinc-400 uppercase select-none">
                    {initials}
                </div>
            </header>

            {/* ── Content area ────────────────────────────────────────────── */}
            <main className="flex-1 min-h-0 overflow-hidden">
                <Outlet />
            </main>

            {/* ── Bottom Nav ─────────────────────────────────────────────── */}
            <nav className="shrink-0 border-t border-zinc-900 bg-black/95 backdrop-blur safe-area-bottom">
                <div className="flex items-stretch h-14">
                    {NAV.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => cn(
                                "flex-1 flex flex-col items-center justify-center gap-1 transition-colors select-none",
                                isActive ? "text-red-500" : "text-zinc-600 active:text-zinc-300",
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon className={cn("w-5 h-5", isActive && "fill-red-500/20")} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    );
}
