import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileEditor } from "@/components/ProfileEditor";
import { useMe } from "@/hooks/useUser";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminResults } from "@/pages/admin/AdminResults";
import { AdminEvents } from "@/pages/admin/AdminEvents";
import { LeaguesHub } from "@/pages/leagues/LeaguesHub";
import { CreateLeague } from "@/pages/leagues/CreateLeague";
import { LeagueView } from "@/pages/leagues/LeagueView";
import { SurvivorPick } from "@/pages/survivor/SurvivorPick";
import { FightCardShowcase } from "@/pages/FightCardShowcase";
import { MobileApp } from "@/pages/mobile/MobileApp";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { user } = useAuth();
  const { data: me } = useMe();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="font-black text-red-600 text-2xl tracking-tighter italic hover:opacity-80 transition-opacity">
              OCTAGON
            </Link>
            <Badge variant="outline" className="hidden sm:inline-flex text-[10px] h-5">
              Reforged
            </Badge>
          </div>

          {/* Portal Target for dynamic page headers */}
          <div id="header-center-portal" className="flex-1 flex justify-center items-center px-4 overflow-hidden" />

          <div className="flex items-center gap-4">
            {user ? (
              <button onClick={() => setShowProfile(true)} className="rounded-full focus:outline-none">
                <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage src={user.user_metadata.avatar_url} />
                  <AvatarFallback>
                    {me?.username ? me.username.slice(0, 2).toUpperCase() : user.email?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            ) : (
              <Link to="/login">
                <Button variant="default" size="sm">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {showProfile && <ProfileEditor onClose={() => setShowProfile(false)} />}

      {/* Main Content */}
      <main className="container py-6 md:py-10 mx-auto px-4 animate-in fade-in duration-500">
        <Routes>
          {/* Constrained width routes */}
          <Route element={<div className="max-w-4xl mx-auto w-full"><Outlet /></div>}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<Navigate to="/leagues" replace />} />
            <Route path="/leagues" element={<ProtectedRoute><LeaguesHub /></ProtectedRoute>} />
            <Route path="/leagues/create" element={<ProtectedRoute><CreateLeague /></ProtectedRoute>} />
            <Route path="/leagues/:leagueId" element={<ProtectedRoute><LeagueView /></ProtectedRoute>} />
            <Route path="/leagues/:leagueId/survivor/pick/:eventId" element={<ProtectedRoute><SurvivorPick /></ProtectedRoute>} />
            <Route path="/showcase" element={<FightCardShowcase />} />
          </Route>

          {/* Full width routes (Admin layout manages its own width) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="results" element={<AdminResults />} />
            <Route path="events" element={<AdminEvents />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Mobile experience — full-screen layout, no desktop header */}
          <Route path="/mobile/:leagueId/*" element={<MobileApp />} />
          {/* Desktop experience — existing layout */}
          <Route path="/*" element={<AppContent />} />
        </Routes>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </Router>
  );
}

export default App;
