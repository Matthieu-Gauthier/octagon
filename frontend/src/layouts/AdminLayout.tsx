import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Trophy, Calendar, LogOut } from "lucide-react";

export function AdminLayout() {
    const { user, signOut, loading } = useAuth();
    const location = useLocation();

    if (loading) return null;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const navItems = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/events", label: "Events", icon: Calendar },
        { href: "/admin/results", label: "Results", icon: Trophy },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
            {/* Top Navigation for Admin */}
            <header className="border-b bg-muted/20 w-full">
                <div className="flex items-center justify-between p-4 max-w-4xl mx-auto w-full">
                    <div className="flex items-center gap-6">
                        <h2 className="font-black text-red-600 text-xl tracking-tighter italic">
                            OCTAGON <span className="text-foreground font-normal not-italic text-sm ml-2">Admin</span>
                        </h2>
                        <nav className="hidden md:flex items-center space-x-2">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link key={item.href} to={item.href}>
                                        <Button
                                            variant={isActive ? "secondary" : "ghost"}
                                            size="sm"
                                            className={cn("gap-2", isActive && "bg-secondary")}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {item.label}
                                        </Button>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                    <div className="flex items-center">
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={signOut}>
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Mobile Nav (if needed, simplified for now) */}
            <div className="md:hidden border-b bg-muted/10 w-full">
                <div className="flex overflow-x-auto p-2 gap-2 max-w-4xl mx-auto w-full">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} to={item.href} className="flex-1 min-w-[100px]">
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    size="sm"
                                    className={cn("w-full gap-2 text-xs", isActive && "bg-secondary")}
                                >
                                    <Icon className="h-3 w-3" />
                                    {item.label}
                                </Button>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-auto w-full">
                <div className="p-4 md:p-8 w-full max-w-4xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
