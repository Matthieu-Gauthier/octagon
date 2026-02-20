import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEvents } from "@/hooks/useEvents";
import { EventSkeleton } from "@/components/skeletons/EventSkeleton";

export function AdminDashboard() {
    const { data: events, isLoading, error } = useEvents();

    if (isLoading) return <EventSkeleton />;
    if (error) return <div className="text-red-500">Failed to load dashboard data.</div>;

    const safeEvents = events || [];
    const upcomingEvents = safeEvents.filter(e => new Date(e.date) > new Date()).length;
    const totalFights = safeEvents.reduce((acc, e) => acc + (e.fights?.length || 0), 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Manage your UFC league from here.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{safeEvents.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {upcomingEvents} upcoming
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Fights</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalFights}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all events
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">-</div>
                        <p className="text-xs text-muted-foreground">
                            User stats not yet available
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
