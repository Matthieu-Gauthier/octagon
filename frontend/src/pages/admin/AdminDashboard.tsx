import { useEvents } from "@/hooks/useEvents";
import { EventSkeleton } from "@/components/skeletons/EventSkeleton";

export function AdminDashboard() {
    const { data: events, isLoading, error } = useEvents();

    if (isLoading) return <EventSkeleton />;
    if (error) return <div className="text-red-500 p-8">Failed to load dashboard data.</div>;

    const safeEvents = events || [];
    const upcomingEvents = safeEvents.filter(e => new Date(e.date) > new Date()).length;
    const totalFights = safeEvents.reduce((acc, e) => acc + (e.fights?.length || 0), 0);

    const stats = [
        {
            value: safeEvents.length,
            label: "Total Events",
            description: `${upcomingEvents} upcoming`,
        },
        {
            value: totalFights,
            label: "Total Fights",
            description: "Across all events",
        },
        {
            value: "—",
            label: "Active Users",
            description: "User stats not yet available",
        },
    ];

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
                <p className="text-zinc-500 text-sm mt-1">Manage your UFC league</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-5"
                    >
                        <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">
                            {stat.label}
                        </p>
                        <p className="text-4xl font-black text-white leading-none mb-1">
                            {stat.value}
                        </p>
                        <p className="text-zinc-600 text-xs mt-2">{stat.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
