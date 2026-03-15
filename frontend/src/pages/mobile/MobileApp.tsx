import { Routes, Route, Navigate } from "react-router-dom";
import { MobileLayout } from "@/layouts/MobileLayout";
import { MobilePicks } from "./MobilePicks";
import { MobileStandings } from "./MobileStandings";
import { MobileExplore } from "./MobileExplore";

export function MobileApp() {
    return (
        <Routes>
            <Route element={<MobileLayout />}>
                <Route index element={<Navigate to="/mobile/picks" replace />} />
                <Route path="picks" element={<MobilePicks />} />
                <Route path="standings" element={<MobileStandings />} />
                <Route path="explore" element={<MobileExplore />} />
            </Route>
        </Routes>
    );
}
