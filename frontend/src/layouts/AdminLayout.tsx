import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Trophy, Calendar, LogOut } from "lucide-react";

export function AdminLayout() {
    const { user, signOut, loading } = useAuth();
    const location = useLocation();

    if (loading) return null;

    // TODO: Add actual admin check here (e.g., user.email === 'admin@example.com' or role check)
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const navItems = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/events", label: "Events", icon: Calendar },
        { href: "/admin/results", label: "Results", icon: Trophy },
    ];

    return (
        <div className="flex min-h-screen bg-background text-foreground font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-muted/20 hidden md:flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="font-black text-red-600 text-xl tracking-tighter italic">
                        OCTAGON <span className="text-foreground font-normal not-italic text-sm ml-2">Admin</span>
                    </h2>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} to={item.href}>
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={cn("w-full justify-start gap-2", isActive && "bg-secondary")}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t">
                    <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" onClick={signOut}>
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
