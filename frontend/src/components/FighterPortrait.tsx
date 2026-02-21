import { Fighter } from "@/types";
import { cn } from "@/lib/utils";

interface FighterPortraitProps {
    fighter: Fighter;
    isWinner: boolean;
    isLoser: boolean;
    isSelected: boolean;
    onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    layout: "left" | "right";
    children?: React.ReactNode;
    className?: string;
}

export function FighterPortrait({
    fighter,
    isLoser,
    isSelected,
    onClick,
    layout,
    children,
    className
}: FighterPortraitProps) {
    const isLeft = layout === "left";

    return (
        <div
            className={cn(
                "relative h-full w-full transition-all duration-500 cursor-pointer group",
                isLoser && "opacity-50 grayscale",
                onClick && "hover:opacity-100",
                className
            )}
            onClick={onClick}
        >
            {/* Fighter Image */}
            <img
                src={fighter.imagePath || "/fighter-silhouette.png"}
                alt={fighter.name}
                className={cn(
                    "absolute bottom-0 h-[90%] w-full object-contain object-bottom transition-transform duration-500",
                    !isLeft && "scale-x-[-1]",
                    isSelected && (isLeft ? "scale-105" : "scale-x-[-1] scale-y-[1.05]"),
                    isSelected && "drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                )}
            />

            {/* Custom Content Overlay (Name, Record, etc) */}
            {children}

            {/* Selection indicator placeholder */}
            <div className={cn(
                "absolute bottom-1/3 flex flex-col justify-center items-center pointer-events-none transition-opacity duration-300 z-10",
                isLeft ? "right-4" : "left-4",
                isSelected ? "opacity-100" : "opacity-0"
            )}>
            </div>
        </div>
    );
}
