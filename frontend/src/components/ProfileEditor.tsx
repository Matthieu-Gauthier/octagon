import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useMe, useUpdateDisplayName } from "@/hooks/useUser";
import { useAuth } from "@/context/AuthContext";

export function ProfileEditor({ onClose }: { onClose: () => void }) {
    const { data: me } = useMe();
    const { mutate: update, isPending } = useUpdateDisplayName();
    const { signOut } = useAuth();
    const [value, setValue] = useState("");

    useEffect(() => {
        if (me?.username) setValue(me.username);
    }, [me?.username]);

    const handleSave = () => {
        const trimmed = value.trim();
        if (!trimmed || trimmed === me?.username) { onClose(); return; }
        update(trimmed, { onSuccess: onClose });
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur text-white">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-zinc-900">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Profile</p>
                <button
                    onClick={onClose}
                    className="p-1 text-zinc-500 active:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content — centré sur desktop, collé en haut sur mobile */}
            <div className="flex-1 flex flex-col justify-start sm:justify-center px-4 py-8 max-w-sm w-full mx-auto space-y-6">
                <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        Display Name
                    </p>
                    <input
                        type="text"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSave()}
                        maxLength={32}
                        placeholder="Enter your name…"
                        autoFocus
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-[14px] font-bold text-white placeholder-zinc-600 outline-none focus:border-zinc-600 transition-colors"
                    />
                    <p className="text-[9px] text-zinc-600 font-bold">
                        Visible to other players in standings and explore.
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isPending || !value.trim()}
                    className="w-full py-3 rounded-2xl bg-red-600 text-white text-[12px] font-black uppercase tracking-widest disabled:opacity-40 active:bg-red-700 transition-colors"
                >
                    {isPending ? "Saving…" : "Save"}
                </button>

                <button
                    onClick={() => signOut()}
                    className="w-full py-3 rounded-2xl border border-zinc-800 text-zinc-500 text-[12px] font-black uppercase tracking-widest active:text-white active:border-zinc-600 transition-colors"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
