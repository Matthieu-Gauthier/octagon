import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, X } from "lucide-react";
import { ATOUT_DEFS, type AtoutType, type PlayedAtout } from "@/hooks/useAtouts";
import type { Fight } from "@/types/api";

type AtoutStep = "select-type" | "select-fight" | "select-target" | "select-fight-after-target";

export function AtoutPlayModal({
  open,
  onClose,
  onPlay,
  fights,
  members,
  currentUserId,
  atoutsState,
}: {
  open: boolean;
  onClose: () => void;
  onPlay: (type: AtoutType, fightId: string, targetUserId?: string, targetUserName?: string) => void;
  fights: Fight[];
  members: { userId: string; username: string }[];
  currentUserId: string;
  atoutsState: PlayedAtout[];
}) {
  const [step, setStep] = useState<AtoutStep>("select-type");
  const [selectedType, setSelectedType] = useState<AtoutType | null>(null);
  const [selectedFightId, setSelectedFightId] = useState<string | null>(null);
  const [selectedTargetUserId, setSelectedTargetUserId] = useState<string | null>(null);
  const [selectedTargetName, setSelectedTargetName] = useState("");

  useEffect(() => {
    if (open) {
      setStep("select-type");
      setSelectedType(null);
      setSelectedFightId(null);
      setSelectedTargetUserId(null);
      setSelectedTargetName("");
    }
  }, [open]);

  if (!open) return null;

  const def = selectedType ? ATOUT_DEFS.find((d) => d.type === selectedType) : null;
  const alreadyTargeted = (uid: string) => atoutsState.some((a) => a.targetUserId === uid);
  const eligibleTargets = members.filter((m) => m.userId !== currentUserId && !alreadyTargeted(m.userId));
  // fights are ordered main event first → first prelim last; fight played *before* index i is at i+1
  const eligibleFights = fights.filter((f, i) => {
    if (!f.isMainCard || f.status === "FINISHED") return false;
    const prevFight = fights[i + 1];
    return !prevFight || prevFight.status !== "FINISHED";
  });

  const handleSelectType = (type: AtoutType) => {
    const d = ATOUT_DEFS.find((x) => x.type === type);
    if (!d) return;
    setSelectedType(type);
    setStep(d.selfTarget ? "select-fight" : "select-target");
  };

  const handleConfirm = () => {
    if (!selectedType || !selectedFightId) return;
    onPlay(selectedType, selectedFightId, selectedTargetUserId || undefined, selectedTargetName || undefined);
    onClose();
  };

  const stepBack = () => {
    if (step === "select-fight" || step === "select-target") setStep("select-type");
    else if (step === "select-fight-after-target") setStep("select-target");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-black">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div>
            {step === "select-type" && (
              <>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Power up available</p>
                <h3 className="text-lg font-black text-white">Choose your power up</h3>
              </>
            )}
            {(step === "select-fight" || step === "select-fight-after-target") && def && (
              <>
                <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", def.textColor)}>{def.icon} {def.name}</p>
                <h3 className="text-lg font-black text-white">
                  {step === "select-fight-after-target" ? `Target → ${selectedTargetName}` : "Choose a fight"}
                </h3>
              </>
            )}
            {step === "select-target" && def && (
              <>
                <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", def.textColor)}>{def.icon} {def.name}</p>
                <h3 className="text-lg font-black text-white">Choose an opponent</h3>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="h-4 w-4 text-zinc-400" />
          </button>
        </div>

        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-2">
          {/* STEP 1 — Select atout type */}
          {step === "select-type" && (
            <div className="grid grid-cols-2 gap-3">
              {ATOUT_DEFS.map((d) => (
                <button key={d.type} onClick={() => handleSelectType(d.type)}
                  className={cn(
                    "flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] hover:brightness-125",
                    d.bgColor, d.borderColor
                  )}>
                  <span className="text-2xl">{d.icon}</span>
                  <div>
                    <p className={cn("font-black text-sm", d.textColor)}>{d.name}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">{d.description}</p>
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded border",
                    d.selfTarget ? "border-zinc-700 text-zinc-500 bg-zinc-900/50" : "border-red-900/50 text-red-400 bg-red-950/30"
                  )}>
                    {d.selfTarget ? "Self" : "Opponent"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* STEP 2a — Select target */}
          {step === "select-target" && (
            eligibleTargets.length === 0
              ? <div className="text-center py-8 text-zinc-500 text-sm">No opponents available to target.</div>
              : eligibleTargets.map((m) => (
                <button key={m.userId}
                  onClick={() => { setSelectedTargetUserId(m.userId); setSelectedTargetName(m.username); setStep("select-fight-after-target"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-black text-zinc-300">
                    {m.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-bold text-sm text-white flex-1">{m.username}</span>
                  <ChevronRight className="h-4 w-4 text-zinc-600" />
                </button>
              ))
          )}

          {/* STEP 2b — Select fight */}
          {(step === "select-fight" || step === "select-fight-after-target") && (
            eligibleFights.length === 0
              ? <div className="text-center py-8 text-zinc-500 text-sm">No fights available.</div>
              : <>
                  {eligibleFights.map((fight) => (
                    <button key={fight.id} onClick={() => setSelectedFightId(fight.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
                        selectedFightId === fight.id ? "border-red-500/50 bg-red-950/30" : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800"
                      )}>
                      <div className="flex-1">
                        <p className="font-black text-sm text-white">
                          {fight.fighterA.name} <span className="text-zinc-500 font-normal">vs</span> {fight.fighterB.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {fight.division}
                          {fight.isMainEvent && <span className="ml-2 text-red-400 font-bold">· MAIN EVENT</span>}
                          {fight.isCoMainEvent && <span className="ml-2 text-orange-400 font-bold">· CO-MAIN</span>}
                        </p>
                      </div>
                      {selectedFightId === fight.id && (
                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                          <span className="text-white text-[10px]">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                  {selectedFightId && (
                    <button onClick={handleConfirm}
                      className="w-full mt-2 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-red-900/30">
                      {def?.icon} Play {def?.name}
                    </button>
                  )}
                </>
          )}
        </div>

        {step !== "select-type" && (
          <div className="px-5 pb-4">
            <button onClick={stepBack} className="text-[10px] font-bold text-zinc-600 hover:text-zinc-300 transition-colors">
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
