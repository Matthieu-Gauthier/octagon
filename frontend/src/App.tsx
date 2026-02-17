import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminResults } from "@/pages/admin/AdminResults";
import { AdminEvents } from "@/pages/admin/AdminEvents";
import { LeagueProvider } from "@/context/LeagueContext";
import { LeaguesHub } from "@/pages/leagues/LeaguesHub";
import { CreateLeague } from "@/pages/leagues/CreateLeague";
import { LeagueDashboard } from "@/pages/leagues/LeagueDashboard";
import { SurvivorProvider } from "@/context/SurvivorContext";
import { SurvivorPick } from "@/pages/survivor/SurvivorPick";
import { FightCardShowcase } from "@/pages/FightCardShowcase";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { user, signOut } = useAuth();

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

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.user_metadata.avatar_url} />
                  <AvatarFallback>{user.email?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  Logout
                </Button>
              </div>
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

      {/* Main Content */}
      <main className="container py-6 md:py-10 max-w-4xl mx-auto px-4 animate-in fade-in duration-500">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Home → Leagues */}
          <Route path="/" element={<Navigate to="/leagues" replace />} />

          <Route path="/leagues" element={
            <ProtectedRoute>
              <LeaguesHub />
            </ProtectedRoute>
          } />
          <Route path="/leagues/create" element={
            <ProtectedRoute>
              <CreateLeague />
            </ProtectedRoute>
          } />
          <Route path="/leagues/:leagueId" element={
            <ProtectedRoute>
              <LeagueDashboard />
            </ProtectedRoute>
          } />

          {/* Survivor pick flow (within league context) */}
          <Route path="/leagues/:leagueId/survivor/pick/:eventId" element={
            <ProtectedRoute>
              <SurvivorPick />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="results" element={<AdminResults />} />
            <Route path="events" element={<AdminEvents />} />
          </Route>

          <Route path="/showcase" element={<FightCardShowcase />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <LeagueProvider>
          <SurvivorProvider>
            <AppContent />
            <Toaster position="top-center" richColors />
          </SurvivorProvider>
        </LeagueProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
