import type { Fighter } from "@/types/api";

export function RankBadge({ fighter }: { fighter: Fighter }) {
    if (fighter.isChampion) {
        return (
            <span className="text-[15px] font-black text-yellow-400 leading-none drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]">
                C
            </span>
        );
    }
    if (fighter.rankingPosition != null) {
        return (
            <span className="text-[13px] font-black text-white/90 leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                #{fighter.rankingPosition}
            </span>
        );
    }
    return null;
}
