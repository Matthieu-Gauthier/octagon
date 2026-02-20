import { Skeleton } from "@/components/ui/skeleton";

export function EventSkeleton() {
    return (
        <div className="space-y-6">
            {/* Hero Banner Skeleton */}
            <div className="rounded-2xl border border-zinc-800 p-6 sm:p-10 bg-zinc-950/50">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-4 w-24 rounded-full bg-zinc-800" />
                    <div className="space-y-2 text-center">
                        <Skeleton className="h-10 w-48 sm:w-64 mx-auto bg-zinc-800" />
                        <Skeleton className="h-4 w-32 mx-auto bg-zinc-800" />
                    </div>
                    <Skeleton className="h-4 w-40 rounded-full bg-zinc-800" />
                </div>
            </div>

            {/* Fight Cards Skeleton */}
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
                    <Skeleton className="h-5 w-32 bg-zinc-800" />
                    <Skeleton className="h-5 w-16 bg-zinc-800 rounded-full" />
                </div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 rounded-2xl border border-zinc-800 bg-zinc-950/30" />
                ))}
            </div>
        </div>
    );
}
