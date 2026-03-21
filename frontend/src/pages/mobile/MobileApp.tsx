import { Routes, Route, Navigate } from 'react-router-dom';
import { MobileLayout } from '@/layouts/MobileLayout';
import {MobilePicks} from "@/pages/mobile/MobilePicks.tsx";
import {MobileStandings} from "@/pages/mobile/MobileStandings.tsx";
import {MobileExplore} from "@/pages/mobile/MobileExplore.tsx";

export function MobileApp() {
  return (
    <Routes>
      <Route element={<MobileLayout />}>
        <Route index element={<Navigate to="picks" replace />} />
        <Route path="picks" element={<MobilePicks />} />
        <Route path="standings" element={<MobileStandings />} />
        <Route path="explore" element={<MobileExplore />} />
      </Route>
    </Routes>
  );
}
