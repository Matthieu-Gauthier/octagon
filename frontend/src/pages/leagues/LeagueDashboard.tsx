// ==============================================================================
// LeagueDashboard.tsx — desktop league dashboard with atouts
// ==============================================================================

import { useParams, Link } from "react-router-dom";
import { useLeague, useLeagueStandings } from "@/hooks/useLeagues";
import { EventSkeleton } from "@/components/skeletons/EventSkeleton";
import { Fight, Bet, BetDTO, Event as ApiEvent, ScoringSettings } from "@/types/api";
import { calcFightPointsWithAtouts, getEffectiveBet, DEFAULT_SCORING } from "@/hooks/useLeagueData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Copy, Trophy, ChevronRight, ChevronLeft,
  MapPin, Target, ChevronDown, X,
} from "lucide-react";
import { ExplorerFightRow } from "@/components/ExplorerFightRow";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { FightCardPick } from "@/components/FightCard";
import { ShowcaseFightCard } from "@/pages/FightCardShowcase";
import { useEvents } from "@/hooks/useEvents";
import { useBets, usePlaceBet, useRemoveBet } from "@/hooks/useBets";
import { useAuth } from "@/context/AuthContext";
import { useGameRealtime } from "@/hooks/useGameRealtime";
import { createPortal } from "react-dom";
import { useAtouts, ATOUT_DEFS, AtoutType, PlayedAtout } from "@/hooks/useAtouts";

// ── Font injection ──────────────────────────────────────────────────────────
function useBebasNeue() {
  useEffect(() => {
    if (document.getElementById("bebas-font")) return;
    const link = document.createElement("link");
    link.id = "bebas-font";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap";
    document.head.appendChild(link);
  }, []);
}

// ── League-scoped fight card ────────────────────────────────────────────────
function LeagueFightCard({
  fight, leagueId, locked, myBets, allBets, onPlaceBet, onRemoveBet, settings, atouts,
}: {
  fight: Fight;
  leagueId: string;
  locked: boolean;
  myBets: Bet[];
  allBets: Bet[];
  onPlaceBet: (bet: BetDTO) => void;
  onRemoveBet: (betId: string) => void;
  settings: ScoringSettings;
  atouts: PlayedAtout[];
}) {
  const liveBet = myBets.find((b) => b.fightId === fight.id);
  const value = liveBet
    ? { winnerId: liveBet.winnerId, method: liveBet.method as FightCardPick["method"], round: liveBet.round }
    : null;

  let resultBreakdown = undefined;
  if (fight.status === "FINISHED" && fight.winnerId) {
    // Use the current user id from the bet (we have liveBet)
    const userId = liveBet?.userId ?? "";
    const { points, stolenPoints, winnerCorrect, methodCorrect, roundCorrect, atoutApplied } =
      calcFightPointsWithAtouts(fight, liveBet, atouts, userId, settings, allBets);
    const officialWinnerName = fight.winnerId === fight.fighterA.id ? fight.fighterA.name : fight.fighterB.name;
    // Show effective pick (after INVERSION) so user understands what was scored
    const effectiveBet = getEffectiveBet(liveBet, fight, atouts, userId);
    const pickWinnerName = effectiveBet?.winnerId
      ? effectiveBet.winnerId === fight.fighterA.id ? fight.fighterA.name
        : effectiveBet.winnerId === fight.fighterB.id ? fight.fighterB.name : "Unknown"
      : "";
    resultBreakdown = {
      userPick: { winnerId: effectiveBet?.winnerId ?? "", winnerName: pickWinnerName, method: effectiveBet?.method, round: effectiveBet?.round },
      result: { winnerId: fight.winnerId, winnerName: officialWinnerName, method: fight.method, round: fight.round },
      scoring: { winnerCorrect, methodCorrect, roundCorrect, points, stolenPoints },
      atoutApplied: atoutApplied
        ? { type: atoutApplied.type, ...ATOUT_DEFS.find((d) => d.type === atoutApplied.type) }
        : undefined,
    };
  }

  return (
    <ShowcaseFightCard
      fight={fight}
      value={value}
      locked={locked}
      resultBreakdown={resultBreakdown}
      onPickChange={locked ? undefined : (pick) => {
        if (!pick) { if (liveBet?.id) onRemoveBet(liveBet.id); return; }
        const isMethodDecision = pick.method === "DECISION";
        const isComplete = pick.winnerId && pick.method && (isMethodDecision || pick.round);
        if (isComplete) onPlaceBet({ leagueId, fightId: fight.id, winnerId: pick.winnerId, method: pick.method, round: pick.round });
      }}
    />
  );
}

// ── Atout badges below each fight card ─────────────────────────────────────
function AtoutFightBadges({
  fightId, atouts, currentUserId, fightFinished,
}: {
  fightId: string;
  atouts: PlayedAtout[];
  currentUserId: string;
  fightFinished: boolean;
}) {
  const relevant = atouts.filter((a) => a.fightId === fightId);
  if (relevant.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 px-1 pt-1 pb-2">
      {relevant.map((atout) => {
        // Hide completely from the target until fight is finished — global indicator handles the reveal
        if (atout.targetUserId === currentUserId && !fightFinished) return null;
        const def = ATOUT_DEFS.find((d) => d.type === atout.type);
        if (!def) return null;
        return (
          <div key={atout.id} className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border",
            def.bgColor, def.textColor, def.borderColor
          )}>
            <span>{def.icon}</span>
            <span>{def.name}</span>
            <span className="opacity-30 mx-0.5">|</span>
            <span className="opacity-80">{atout.playedByName}</span>
            {atout.targetUserName && (
              <><ChevronRight className="h-2.5 w-2.5 opacity-40" /><span className="opacity-80">{atout.targetUserName}</span></>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Atout play modal ────────────────────────────────────────────────────────
type AtoutStep = "select-type" | "select-fight" | "select-target" | "select-fight-after-target";

function AtoutPlayModal({
  open, onClose, onPlay, fights, members, currentUserId, atoutsState,
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
      setStep("select-type"); setSelectedType(null);
      setSelectedFightId(null); setSelectedTargetUserId(null); setSelectedTargetName("");
    }
  }, [open]);

  if (!open) return null;

  const def = selectedType ? ATOUT_DEFS.find((d) => d.type === selectedType) : null;
  const alreadyTargeted = (uid: string) => atoutsState.some((a) => a.targetUserId === uid);
  const eligibleTargets = members.filter((m) => m.userId !== currentUserId && !alreadyTargeted(m.userId));
  const eligibleFights = fights.filter((f) => f.isMainCard && f.status !== "FINISHED");

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

// ── Event hero ──────────────────────────────────────────────────────────────
function EventHero({
  events, safeEventIdx, setEventIdx,
}: {
  events: ApiEvent[];
  safeEventIdx: number;
  setEventIdx: (i: number) => void;
}) {
  const event = events[safeEventIdx];
  return (
    <div className="relative w-full rounded-2xl overflow-hidden h-52 sm:h-64 border border-zinc-800 bg-zinc-950 mb-6">
      {event.eventImg ? (
        <>
          <img src={event.eventImg} alt={event.name}
            className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/25 via-zinc-900/10 to-red-950/25" />
      )}
      <div className="absolute inset-0 flex items-end justify-between p-5 sm:p-6">
        <button onClick={() => setEventIdx(Math.max(0, safeEventIdx - 1))} disabled={safeEventIdx === 0}
          className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur border border-zinc-700/60 disabled:opacity-20 transition-all shrink-0">
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>

        <div className="text-center flex flex-col items-center gap-1 flex-1 px-4">
          <div className="mb-1">
            {event.status === "FINISHED"
              ? <Badge className="bg-zinc-800/90 text-zinc-400 border-zinc-700 text-[9px] font-black uppercase tracking-wider">Terminé</Badge>
              : event.status === "LIVE"
              ? <Badge className="bg-red-600/30 text-red-400 border-red-500/40 text-[9px] font-black uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5 animate-pulse inline-block" />Live
                </Badge>
              : <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 text-[9px] font-black uppercase tracking-wider">À venir</Badge>
            }
          </div>
          <h2 className="text-4xl sm:text-5xl font-black uppercase text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)] leading-none"
            style={{ fontFamily: "Bebas Neue, Impact, sans-serif" }}>
            {event.name.split(":")[0]}
          </h2>
          {event.name.includes(":") && (
            <p className="text-zinc-300 text-sm font-semibold drop-shadow mt-0.5">
              {event.name.split(":")[1]?.trim()}
            </p>
          )}
          {event.location && (
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1">
              <MapPin className="h-3 w-3" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        <button onClick={() => setEventIdx(Math.min(events.length - 1, safeEventIdx + 1))} disabled={safeEventIdx === events.length - 1}
          className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur border border-zinc-700/60 disabled:opacity-20 transition-all shrink-0">
          <ChevronRight className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export function LeagueDashboard() {
  useBebasNeue();

  const { leagueId } = useParams();
  const { user } = useAuth();
  const { data: league, isLoading: leagueLoading } = useLeague(leagueId || "");
  const { data: events, isLoading: eventsLoading, error: eventsError } = useEvents();
  const { data: allBets } = useBets(leagueId || "");
  const { mutate: placeBet } = usePlaceBet();
  const { mutate: removeBet } = useRemoveBet();

  const [eventIdx, setEventIdx] = useState(-1);
  const safeEventIdx = Math.max(0, Math.min(eventIdx === -1 ? 0 : eventIdx, (events?.length ?? 1) - 1));

  const { data: leagueStandings } = useLeagueStandings(
    leagueId || "",
    events && eventIdx !== -1 ? events[safeEventIdx]?.id : undefined
  );

  useGameRealtime(leagueId);

  const currentUserId = user?.id || "me";
  const myBets = allBets?.filter((b) => b.userId === currentUserId || b.userId === "me") ?? [];
  const currentEventId = events?.[safeEventIdx]?.id;

  const { atouts, play: playAtout, remove: removeAtout, playedBy } = useAtouts(leagueId || "", currentEventId);

  useEffect(() => {
    if (events && events.length > 0 && eventIdx === -1) {
      const nextIdx = events.findIndex((e) => e.status !== "FINISHED");
      setEventIdx(nextIdx !== -1 ? nextIdx : events.length - 1);
    }
  }, [events, eventIdx]);

  const [showAllStandings, setShowAllStandings] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"standings" | "explorer">("standings");
  const [showAtoutModal, setShowAtoutModal] = useState(false);

  if (eventsLoading || leagueLoading) return <EventSkeleton />;
  if (eventsError) return <div className="text-center text-red-500 py-10">Failed to load events.</div>;
  if (!league) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold">League not found</h2>
      <Link to="/leagues"><Button variant="link" className="mt-4">Back to Leagues</Button></Link>
    </div>
  );
  if (!events || events.length === 0) return (
    <div className="text-center py-20"><h2 className="text-2xl font-bold">No events scheduled</h2></div>
  );

  const event = events[safeEventIdx];
  const isFinished = event.status === "FINISHED";
  const hasStarted = isFinished || (event.fights || []).some((f) => f.status === "FINISHED");
  const locked = isFinished;

  const copyCode = () => { navigator.clipboard.writeText(league.code); toast.success("Invite code copied!"); };

  const settings = { ...DEFAULT_SCORING, ...((league.scoringSettings as object) || {}) } as ScoringSettings;

  // Backend already computes standings with atout effects applied — just sort
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Backend excludes members with no bets — just sort
  const sortedStandings = [...(leagueStandings || [])].sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      if ((b.perfectPicks ?? 0) !== (a.perfectPicks ?? 0)) return (b.perfectPicks ?? 0) - (a.perfectPicks ?? 0);
      return b.correct - a.correct;
    });

  const activeUserId = selectedUserId || currentUserId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeUserIdx = sortedStandings.findIndex((s: any) => s.userId === activeUserId);

  const getUserName = (userId: string) => {
    if (userId === "me" || userId === user?.id) return "You";
    const member = league.members?.find((m) => m.userId === userId);
    return member?.user?.username || userId;
  };

  const mainCardFights = (event.fights || []).filter((f) => f.isMainCard);
  const prelimFights = (event.fights || []).filter((f) => !f.isMainCard);

  const computeSectionStats = (fights: Fight[]) => {
    const myBetsList = allBets?.filter((b) => b.leagueId === league.id && b.userId === currentUserId) || [];
    let points = 0, correct = 0;
    for (const fight of fights.filter((f) => f.status === "FINISHED" && f.winnerId)) {
      const bet = myBetsList.find((b) => b.fightId === fight.id);
      const { points: p, winnerCorrect } = calcFightPointsWithAtouts(fight, bet, atouts, currentUserId, settings, allBets ?? []);
      if (winnerCorrect) correct++;
      points += p;
    }
    return { points, correct, total: fights.length };
  };
  const mainStats = computeSectionStats(mainCardFights);
  const prelimsStats = computeSectionStats(prelimFights);

  const portalTarget = document.getElementById("header-center-portal");

  // ── Pick explorer content ────────────────────────────────────────────────
  const completedFights = (event.fights || []).filter((f) => f.status === "FINISHED" && f.winnerId);
  const explorerBets = allBets?.filter((b) => b.leagueId === league.id && b.userId === activeUserId) || [];
  const mainCompleted = completedFights.filter((f) => f.isMainCard);
  const prelimsCompleted = completedFights.filter((f) => !f.isMainCard);

  const renderFightRows = (fights: Fight[], label: string) => {
    if (fights.length === 0) return null;
    return (
      <div className="px-3 py-2 space-y-1.5">
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-700 mb-2">{label}</p>
        {fights.map((fight) => {
          const bet = explorerBets.find((b) => b.fightId === fight.id);
          return (
            <ExplorerFightRow
              key={fight.id}
              fight={fight}
              bet={bet}
              atouts={atouts}
              userId={activeUserId}
              scoring={settings}
              allBets={allBets ?? []}
              getUserName={getUserName}
            />
          );
        })}
      </div>
    );
  };

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="max-w-[1440px] mx-auto">
      {/* Header portal */}
      {portalTarget && createPortal(
        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 mx-auto overflow-hidden">
          <Link to="/leagues" className="hidden sm:block">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 max-w-[200px] sm:max-w-[400px]">
            <h1 className="text-base sm:text-xl font-extrabold tracking-tight truncate">{league.name}</h1>
            <Badge variant="outline"
              className="font-mono text-[10px] hidden md:inline-flex cursor-pointer hover:bg-muted shrink-0"
              onClick={copyCode}>
              {league.code} <Copy className="ml-1 h-3 w-3 inline" />
            </Badge>
          </div>
        </div>,
        portalTarget
      )}

      {/* Event hero */}
      <EventHero events={events} safeEventIdx={safeEventIdx} setEventIdx={setEventIdx} />

      {/* Top row: Standings/Explorer full width */}
      <div className="mb-6">

        {/* Standings + Explorer */}
        <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
          <div className="flex border-b border-zinc-800/60">
            <button onClick={() => setSidebarTab("standings")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] font-black uppercase tracking-wider transition-colors",
                sidebarTab === "standings" ? "text-white bg-zinc-900/60 border-b-2 border-red-500" : "text-zinc-500 hover:text-zinc-300"
              )}>
              <Trophy className="h-3 w-3" /> Standings
            </button>
            <button onClick={() => setSidebarTab("explorer")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] font-black uppercase tracking-wider transition-colors",
                sidebarTab === "explorer" ? "text-white bg-zinc-900/60 border-b-2 border-red-500" : "text-zinc-500 hover:text-zinc-300"
              )}>
              <Target className="h-3 w-3" /> Explore
            </button>
          </div>
          {/* Standings */}
          {sidebarTab === "standings" && (
            <>
              <div className="divide-y divide-zinc-800/40">
                {(showAllStandings ? sortedStandings : sortedStandings.slice(0, 5))
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  .map((s: any, idx: number) => {
                    const isMe = s.userId === "me" || s.userId === currentUserId;
                    return (
                      <div key={s.userId}
                        onClick={() => { setSelectedUserId(s.userId); setSidebarTab("explorer"); }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                          isMe ? "bg-emerald-950/30" : "hover:bg-zinc-900/50"
                        )}>
                        <span className="text-sm w-6 shrink-0 text-center">
                          {idx < 3 ? medals[idx] : <span className="text-[10px] font-black text-zinc-600">#{idx + 1}</span>}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-black truncate", isMe ? "text-emerald-300" : "text-zinc-200")}>
                            {isMe ? "You" : (s.username || getUserName(s.userId))}
                          </p>
                          <p className="text-[9px] text-zinc-600">
                            {s.correct}/{s.total}
                            {(s.perfectPicks ?? 0) > 0 && <span className="text-emerald-700 ml-1">· {s.perfectPicks} ✓</span>}
                          </p>
                        </div>
                        <span className={cn("text-sm font-black shrink-0", isMe ? "text-emerald-400" : "text-zinc-300")}>
                          {s.points}<span className="text-[9px] font-normal text-zinc-600 ml-0.5">pts</span>
                        </span>
                      </div>
                    );
                  })}
              </div>
              {sortedStandings.length > 5 && (
                <button onClick={() => setShowAllStandings(!showAllStandings)}
                  className="w-full px-4 py-2.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1 border-t border-zinc-800/40">
                  {showAllStandings ? "Show less" : `+${sortedStandings.length - 5} players`}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", showAllStandings && "rotate-180")} />
                </button>
              )}
            </>
          )}
          {/* Pick Explorer */}
          {sidebarTab === "explorer" && (
            <>
              <div className="flex items-center px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/30">
                <button onClick={() => { if (activeUserIdx > 0) setSelectedUserId(sortedStandings[activeUserIdx - 1].userId); }}
                  disabled={activeUserIdx <= 0}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg disabled:opacity-20 transition-colors">
                  <ChevronLeft className="h-4 w-4 text-zinc-400" />
                </button>
                <div className="flex-1 text-center px-2">
                  <p className="text-xs font-black text-white truncate">
                    {activeUserId === currentUserId ? "My Picks" : `${getUserName(activeUserId)}'s Picks`}
                  </p>
                  {sortedStandings.length > 1 && (
                    <p className="text-[9px] text-zinc-600">
                      {activeUserIdx >= 0 ? `${activeUserIdx + 1} / ${sortedStandings.length}` : "-"}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => { if (activeUserIdx < sortedStandings.length - 1 && activeUserIdx !== -1) setSelectedUserId(sortedStandings[activeUserIdx + 1].userId); }}
                  disabled={activeUserIdx >= sortedStandings.length - 1 || activeUserIdx === -1}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg disabled:opacity-20 transition-colors">
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                </button>
              </div>
              {completedFights.length === 0
                ? <div className="text-center py-10 text-xs text-zinc-600">No results available</div>
                : <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-zinc-800/30">
                    <div className="divide-y divide-zinc-800/30">{renderFightRows(mainCompleted, "Main Card")}</div>
                    <div className="divide-y divide-zinc-800/30">{renderFightRows(prelimsCompleted, "Prelims")}</div>
                  </div>
              }
            </>
          )}
        </div>

      </div>

      {/* Atout bar */}
      {!locked && (() => {
        const myAtout = playedBy(currentUserId);
        const activeUserIds = new Set(sortedStandings.map((s: any) => s.userId));
        const members = (league.members ?? [])
          .filter((m) => activeUserIds.has(m.userId))
          .map((m) => ({
            userId: m.userId,
            username: m.user?.username || m.userId,
          }));
        const allFights = event.fights ?? [];
        const handlePlay = (type: AtoutType, fightId: string, targetUserId?: string, targetUserName?: string) => {
          playAtout({ type, playedByUserId: currentUserId, playedByName: getUserName(currentUserId), fightId, targetUserId, targetUserName });
          toast.success("Power up played!");
        };
        if (myAtout) {
          const def = ATOUT_DEFS.find((d) => d.type === myAtout.type);
          const fight = allFights.find((f) => f.id === myAtout.fightId);
          const fightLocked = fight?.status === "FINISHED";
          return (
            <>
              <AtoutPlayModal
                open={showAtoutModal}
                onClose={() => setShowAtoutModal(false)}
                onPlay={handlePlay}
                fights={allFights}
                members={members}
                currentUserId={currentUserId}
                atoutsState={atouts}
              />
              <div className={cn("mb-6 flex items-center gap-3 px-4 py-3 rounded-2xl border", def?.bgColor, def?.borderColor)}>
                <span className="text-xl">{def?.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-black", def?.textColor)}>{def?.name} played</p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    {fight ? `${fight.fighterA.name.split(" ").pop()} vs ${fight.fighterB.name.split(" ").pop()}` : ""}
                    {myAtout.targetUserName && ` · contre ${myAtout.targetUserName}`}
                  </p>
                </div>
                {!fightLocked ? (
                  <button
                    onClick={() => { removeAtout(myAtout.id); setShowAtoutModal(true); }}
                    className="text-[10px] font-black text-zinc-400 hover:text-white uppercase tracking-wider transition-colors shrink-0"
                  >
                    Edit
                  </button>
                ) : (
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-wider shrink-0">Locked</span>
                )}
              </div>
            </>
          );
        }
        return (
          <>
            <AtoutPlayModal
              open={showAtoutModal}
              onClose={() => setShowAtoutModal(false)}
              onPlay={handlePlay}
              fights={allFights}
              members={members}
              currentUserId={currentUserId}
              atoutsState={atouts}
            />
            <button
              onClick={() => setShowAtoutModal(true)}
              className="mb-6 w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-amber-800/50 bg-amber-950/30 hover:bg-amber-950/50 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">⚡</span>
                <div className="text-left">
                  <p className="text-xs font-black text-amber-400">1 power up available</p>
                  <p className="text-[10px] text-zinc-500">Inversion · Debt · x2</p>
                </div>
              </div>
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider group-hover:text-amber-300 transition-colors">
                Play →
              </span>
            </button>
          </>
        );
      })()}

      {/* Targeted indicator — visible when someone has an active atout against the current user */}
      {(() => {
        const allFights = event.fights ?? [];
        const isTargeted = atouts.some(
          (a) => a.targetUserId === currentUserId &&
            allFights.find((f) => f.id === a.fightId)?.status !== "FINISHED"
        );
        if (!isTargeted) return null;
        return (
          <div className="mb-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-red-800/40 bg-red-950/20">
            <span className="text-base">🎯</span>
            <p className="text-xs font-black text-red-400">Targeted</p>
            <p className="text-[10px] text-zinc-500">An opponent played a power up against you — you'll find out after the fight.</p>
          </div>
        );
      })()}

      {/* Full-width fight cards */}
      <div>
        {locked && (
          <div className="text-center text-xs text-zinc-500 bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 mb-4">
            🔒 This event is over — your picks are locked
          </div>
        )}

        <Tabs defaultValue="main" className="w-full">
          <TabsList className="w-full flex bg-transparent border-b border-zinc-800/50 p-0 rounded-none h-auto mb-6">
            <TabsTrigger value="main"
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-red-500 data-[state=active]:shadow-none data-[state=inactive]:opacity-60 border-b-2 border-transparent rounded-none py-4 transition-all">
              <div className="flex flex-col items-center gap-1.5">
                <span className="font-black uppercase tracking-widest text-xs">Main Card</span>
                <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400">
                  <span>{mainCardFights.length} fights</span>
                  {hasStarted && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-zinc-800" />
                      <span className="flex items-center gap-1"><Target className="h-3 w-3" />{mainStats.correct}/{mainStats.total}</span>
                      <span className="flex items-center gap-1 text-yellow-500"><Trophy className="h-3 w-3" />{mainStats.points}</span>
                    </>
                  )}
                </div>
              </div>
            </TabsTrigger>
            {prelimFights.length > 0 && (
              <TabsTrigger value="prelims"
                className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-red-500 data-[state=active]:shadow-none data-[state=inactive]:opacity-60 border-b-2 border-transparent rounded-none py-4 transition-all">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="font-black uppercase tracking-widest text-xs">Prelims</span>
                  <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400">
                    <span>{prelimFights.length} fights</span>
                    {hasStarted && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-zinc-800" />
                        <span className="flex items-center gap-1"><Target className="h-3 w-3" />{prelimsStats.correct}/{prelimsStats.total}</span>
                        <span className="flex items-center gap-1 text-yellow-500"><Trophy className="h-3 w-3" />{prelimsStats.points}</span>
                      </>
                    )}
                  </div>
                </div>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="main" className="mt-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {mainCardFights.map((fight) => (
              <div key={fight.id}>
                <LeagueFightCard fight={fight} leagueId={league.id}
                  locked={locked || fight.status === "FINISHED"}
                  myBets={myBets} allBets={allBets ?? []} onPlaceBet={placeBet} onRemoveBet={removeBet} settings={settings} atouts={atouts} />
                <AtoutFightBadges fightId={fight.id} atouts={atouts} currentUserId={currentUserId} fightFinished={fight.status === "FINISHED"} />
              </div>
            ))}
          </TabsContent>

          {prelimFights.length > 0 && (
            <TabsContent value="prelims" className="mt-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {prelimFights.map((fight) => (
                <div key={fight.id}>
                  <LeagueFightCard fight={fight} leagueId={league.id}
                    locked={locked || fight.status === "FINISHED"}
                    myBets={myBets} allBets={allBets ?? []} onPlaceBet={placeBet} onRemoveBet={removeBet} settings={settings} atouts={atouts} />
                  <AtoutFightBadges fightId={fight.id} atouts={atouts} currentUserId={currentUserId} fightFinished={fight.status === "FINISHED"} />
                </div>
              ))}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
