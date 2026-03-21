import { useAuth } from "@/context/AuthContext";
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
        <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
            {/* Left Sidebar */}
            <aside className="w-52 shrink-0 flex flex-col bg-zinc-900 border-r border-zinc-800 min-h-screen">
                {/* App Title */}
                <div className="px-4 py-5 border-b border-zinc-800">
                    <p className="font-black text-red-500 text-base tracking-tighter italic leading-none">
                        OCTAGON
                    </p>
                    <p className="text-zinc-500 text-xs font-medium mt-0.5 tracking-wide uppercase">
                        Admin
                    </p>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-zinc-800 text-white"
                                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                                )}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="px-2 py-3 border-t border-zinc-800">
                    <button
                        onClick={signOut}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors w-full"
                    >
                        <LogOut className="h-4 w-4 shrink-0" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-zinc-950 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
