import { Plus } from "lucide-react";
import { toast } from "sonner";

export function AdminEvents() {
    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Events</h1>
                    <p className="text-zinc-500 text-sm mt-1">Create and edit UFC events</p>
                </div>
                <button
                    onClick={() => toast.info("Create Event functionality coming soon!")}
                    className="flex items-center gap-2 text-sm font-semibold px-4 h-9 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Create Event
                </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center p-14">
                <div className="text-center space-y-3">
                    <div className="bg-zinc-800 p-3 rounded-full w-fit mx-auto">
                        <Plus className="h-5 w-5 text-zinc-500" />
                    </div>
                    <h3 className="font-semibold text-white">No events created yet</h3>
                    <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                        Start by creating a new event, adding fights, and setting the schedule.
                    </p>
                    <button
                        onClick={() => toast.info("Create Event functionality coming soon!")}
                        className="mt-2 inline-flex items-center gap-2 text-sm font-medium px-4 h-8 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                    >
                        Create First Event
                    </button>
                </div>
            </div>
        </div>
    );
}
