import { useParams, Navigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";
import { LeagueDashboard } from "./LeagueDashboard";

export function LeagueView() {
    const { leagueId = "" } = useParams();
    const isMobile = useIsMobile();
    if (isMobile) return <Navigate to={`/mobile/${leagueId}/picks`} replace />;
    return <LeagueDashboard />;
}
