import { useRef, useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEvents } from '@/hooks/useEvents';
import { useBets, usePlaceBet, useRemoveBet } from '@/hooks/useBets';
import { useLeague } from '@/hooks/useLeagues';
import { useAuth } from '@/context/AuthContext';
import { calcFightPointsWithAtouts, DEFAULT_SCORING } from '@/hooks/useLeagueData';
import { ResultCenter } from '@/components/FightCard';
import { ATOUT_DEFS, useAtouts, type PlayedAtout } from '@/hooks/useAtouts';
import { FightPickControls } from '@/components/FightPickControls';
import type { Fight, Fighter } from '@/types/api';
import type { FightCardPick, ResultBreakdown } from '@/components/FightCard';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type Tab = 'main' | 'prelims';

interface OutletCtx {
  currentEvent: { id: string; fights?: Fight[] } | undefined;
  atoutsState: ReturnType<typeof useAtouts>;
  currentUserId: string;
  currentUserName: string;
}

/* ─── Fighter Avatar ──────────────────────────────────────────────────────── */
function FighterPhoto({
  fighter,
  side,
  dim,
}: {
  fighter: Fighter;
  side: 'left' | 'right';
  dim: boolean;
}) {
  return (
    <div className={cn('relative flex-1 overflow-hidden transition-all duration-400', dim && 'opacity-30')}>
      {fighter.imagePath ? (
        <img
          src={fighter.imagePath}
          alt={fighter.name}
          className={cn(
            'absolute inset-0 w-full h-full object-cover object-top',
            side === 'right' && 'scale-x-[-1]'
          )}
        />
      ) : (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            side === 'left'
              ? 'bg-gradient-to-br from-blue-950 to-zinc-950'
              : 'bg-gradient-to-bl from-red-950 to-zinc-950'
          )}
        >
          <span
            className={cn(
              'text-[80px] font-black opacity-20 select-none',
              side === 'left' ? 'text-blue-400' : 'text-red-400'
            )}
          >
            {fighter.name.split(' ').pop()?.[0] ?? '?'}
          </span>
        </div>
      )}
      {/* Inner shadow gradient */}
      <div
        className={cn(
          'absolute inset-0',
          side === 'left'
            ? 'bg-gradient-to-r from-black/10 via-transparent to-black/50'
            : 'bg-gradient-to-l from-black/10 via-transparent to-black/50'
        )}
      />
    </div>
  );
}


/* ─── Atout Badge ─────────────────────────────────────────────────────────── */
function AtoutBadge({ atout }: { atout: PlayedAtout }) {
  const def = ATOUT_DEFS.find(d => d.type === atout.type);
  if (!def) return null;
  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border',
        def.bgColor,
        def.borderColor,
        def.textColor
      )}
    >
      <span>{def.icon}</span>
      <span>{def.name}</span>
    </div>
  );
}

/* ─── Fight Card ───────────────────────────────────────────────────────── */
function FightCardItem({
  fight,
  value,
  onPickChange,
  locked,
  resultBreakdown,
  atoutsOnFight,
  currentUserId,
}: {
  fight: Fight;
  value: FightCardPick | null;
  onPickChange: (pick: FightCardPick | null) => void;
  locked: boolean;
  resultBreakdown?: ResultBreakdown;
  atoutsOnFight: PlayedAtout[];
  currentUserId: string;
}) {
  const winnerId = value?.winnerId ?? null;
  const selectedA = winnerId === fight.fighterA.id;
  const selectedB = winnerId === fight.fighterB.id;
  const hasWinner = !!winnerId;

  const myAtoutOnFight = atoutsOnFight.find(a => a.playedByUserId === currentUserId);

  const isResult = !!resultBreakdown;
  const { points = 0, winnerCorrect = false, methodCorrect = false, roundCorrect = false } =
    resultBreakdown?.scoring ?? {};
  const isPerfect = winnerCorrect && methodCorrect && (value?.method === 'DECISION' || roundCorrect);

  const eventBadgeLabel = fight.isMainEvent
    ? 'Main Event'
    : fight.isCoMainEvent
    ? 'Co-Main'
    : fight.isMainCard
    ? 'Main Card'
    : 'Prelims';
  const eventBadgeColor = fight.isMainEvent
    ? 'text-red-500 bg-red-950/60 border-red-900/60'
    : fight.isCoMainEvent
    ? 'text-orange-400 bg-orange-950/50 border-orange-900/50'
    : 'text-zinc-500 bg-zinc-900 border-zinc-800';

  const recentForm = (f: Fighter) => (f.recentForm ?? []).slice(0, 4);

  const methodAbbr = (method: string): string => {
    const m = (method ?? '').toUpperCase();
    if (m.includes('KO') || m.includes('TKO')) return 'KO';
    if (m.includes('SUB')) return 'SUB';
    if (m.includes('DEC')) return 'DEC';
    return '';
  };

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden">

      {/* ── Top strip: badges ─────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-3 pt-2 pb-1 gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className={cn('text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0', eventBadgeColor)}>
            {eventBadgeLabel}
          </span>
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider truncate">
            {fight.division}
          </span>
          <span className="text-[9px] font-black text-zinc-700 shrink-0 ml-auto uppercase tracking-wider">
            {fight.rounds} ROUNDS
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {myAtoutOnFight && <AtoutBadge atout={myAtoutOnFight} />}
          {locked && (
            <span className="flex items-center gap-1 text-[9px] font-black text-zinc-600">
              <Lock className="w-3 h-3" /> Locked
            </span>
          )}
        </div>
      </div>

      {/* ── Fighter photos ─────────────────────────────────────────────── */}
      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        <FighterPhoto fighter={fight.fighterA} side="left" dim={hasWinner && !selectedA} />

        {/* Thin center divider */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-800/40 pointer-events-none z-10" />

        <FighterPhoto fighter={fight.fighterB} side="right" dim={hasWinner && !selectedB} />

        {/* Result overlay */}
        {isResult && resultBreakdown && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
            <div className={cn(
              'rounded-3xl border px-6',
              isPerfect ? 'bg-emerald-950/80 border-emerald-700/60' :
              points > 0 ? 'bg-amber-950/80 border-amber-700/60' :
              'bg-zinc-950/80 border-zinc-700/60'
            )}>
              <ResultCenter resultBreakdown={resultBreakdown} />
              {isPerfect && (
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider text-center pb-3">🎯 Perfect</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Fighter names + records ────────────────────────────────────── */}
      <div className="shrink-0 flex border-t border-zinc-900/60">
        {/* Fighter A */}
        <div className={cn('flex-1 px-3 py-2.5 transition-all', selectedA && 'bg-blue-950/20')}>
          <p className={cn('text-[15px] font-black uppercase tracking-tight leading-tight', selectedA ? 'text-blue-300' : 'text-white')}>
            {fight.fighterA.name.split(' ').pop()}
          </p>
          <p className="text-[9px] text-zinc-600 font-bold mt-0.5">
            {fight.fighterA.wins ?? 0} - {fight.fighterA.losses ?? 0} - {fight.fighterA.draws ?? 0}
            {(fight.fighterA.noContests ?? 0) > 0 && (
              <span className="text-zinc-700"> ({fight.fighterA.noContests})</span>
            )}
          </p>
        </div>
        {/* Divider */}
        <div className="w-px bg-zinc-900/60 my-2" />
        {/* Fighter B */}
        <div className={cn('flex-1 px-3 py-2.5 text-right transition-all', selectedB && 'bg-red-950/20')}>
          <p className={cn('text-[15px] font-black uppercase tracking-tight leading-tight', selectedB ? 'text-red-300' : 'text-white')}>
            {fight.fighterB.name.split(' ').pop()}
          </p>
          <p className="text-[9px] text-zinc-600 font-bold mt-0.5">
            {fight.fighterB.wins ?? 0} - {fight.fighterB.losses ?? 0} - {fight.fighterB.draws ?? 0}
            {(fight.fighterB.noContests ?? 0) > 0 && (
              <span className="text-zinc-700"> ({fight.fighterB.noContests})</span>
            )}
          </p>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-zinc-900/60 px-3 py-2 space-y-1.5">

        {/* Row 1 — Forme récente avec méthode */}
        <div className="flex items-center gap-1">
          {/* Fighter A: oldest → newest */}
          <div className="flex gap-0.5">
            {recentForm(fight.fighterA).map((r, i) => {
              const abbr = (r.result === 'W' || r.result === 'L') ? methodAbbr(r.method) : r.result;
              const cls = r.result === 'W'
                ? abbr === 'KO'  ? 'bg-red-900/50 text-red-400 border-red-800/40'
                : abbr === 'SUB' ? 'bg-orange-900/50 text-orange-400 border-orange-800/40'
                :                   'bg-green-900/40 text-green-500 border-green-800/30'
                : r.result === 'L'
                ? abbr === 'KO'  ? 'bg-zinc-900 text-red-500/70 border-red-900/40'
                : abbr === 'SUB' ? 'bg-zinc-900 text-orange-500/60 border-orange-900/30'
                :                   'bg-zinc-900 text-zinc-600 border-zinc-800'
                :                   'bg-zinc-900 text-zinc-700 border-zinc-800';
              return (
                <div key={i} className={cn('w-7 h-4 rounded border flex items-center justify-center text-[7px] font-black', cls)}>
                  {abbr || r.result}
                </div>
              );
            })}
          </div>
          <div className="flex-1 flex justify-center">
            <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">Form</span>
          </div>
          {/* Fighter B: newest → oldest (most recent innermost) */}
          <div className="flex gap-0.5 flex-row-reverse">
            {recentForm(fight.fighterB).map((r, i) => {
              const abbr = (r.result === 'W' || r.result === 'L') ? methodAbbr(r.method) : r.result;
              const cls = r.result === 'W'
                ? abbr === 'KO'  ? 'bg-red-900/50 text-red-400 border-red-800/40'
                : abbr === 'SUB' ? 'bg-orange-900/50 text-orange-400 border-orange-800/40'
                :                   'bg-green-900/40 text-green-500 border-green-800/30'
                : r.result === 'L'
                ? abbr === 'KO'  ? 'bg-zinc-900 text-red-500/70 border-red-900/40'
                : abbr === 'SUB' ? 'bg-zinc-900 text-orange-500/60 border-orange-900/30'
                :                   'bg-zinc-900 text-zinc-600 border-zinc-800'
                :                   'bg-zinc-900 text-zinc-700 border-zinc-800';
              return (
                <div key={i} className={cn('w-7 h-4 rounded border flex items-center justify-center text-[7px] font-black', cls)}>
                  {abbr || r.result}
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 2 — Victoires par méthode */}
        <div className="flex items-center gap-1">
          <div className="flex gap-1.5">
            {(fight.fighterA.winsByKo ?? 0) > 0 && (
              <span className="text-[9px] font-black text-red-500">{fight.fighterA.winsByKo} KO</span>
            )}
            {(fight.fighterA.winsBySub ?? 0) > 0 && (
              <span className="text-[9px] font-black text-orange-500">{fight.fighterA.winsBySub} SUB</span>
            )}
            {(fight.fighterA.winsByDec ?? 0) > 0 && (
              <span className="text-[9px] font-black text-zinc-500">{fight.fighterA.winsByDec} DEC</span>
            )}
            {!(fight.fighterA.winsByKo) && !(fight.fighterA.winsBySub) && !(fight.fighterA.winsByDec) && (
              <span className="text-[9px] font-bold text-zinc-700">—</span>
            )}
          </div>
          <div className="flex-1" />
          <div className="flex gap-1.5 justify-end">
            {(fight.fighterB.winsByDec ?? 0) > 0 && (
              <span className="text-[9px] font-black text-zinc-500">{fight.fighterB.winsByDec} DEC</span>
            )}
            {(fight.fighterB.winsBySub ?? 0) > 0 && (
              <span className="text-[9px] font-black text-orange-500">{fight.fighterB.winsBySub} SUB</span>
            )}
            {(fight.fighterB.winsByKo ?? 0) > 0 && (
              <span className="text-[9px] font-black text-red-500">{fight.fighterB.winsByKo} KO</span>
            )}
            {!(fight.fighterB.winsByKo) && !(fight.fighterB.winsBySub) && !(fight.fighterB.winsByDec) && (
              <span className="text-[9px] font-bold text-zinc-700">—</span>
            )}
          </div>
        </div>

        {/* Row 3 — Age · Taille · Reach · Poids */}
        {[
          { label: 'Age',    a: fight.fighterA.age != null ? String(fight.fighterA.age) : undefined, b: fight.fighterB.age != null ? String(fight.fighterB.age) : undefined },
          { label: 'Height', a: fight.fighterA.height, b: fight.fighterB.height },
          { label: 'Reach',  a: fight.fighterA.reach,  b: fight.fighterB.reach  },
          { label: 'Weight', a: fight.fighterA.weight, b: fight.fighterB.weight  },
        ].map(({ label, a, b }) => {
          if (!a && !b) return null;
          return (
            <div key={label} className="flex items-center gap-1">
              <span className={cn('text-[9px] font-black flex-1', a ? 'text-zinc-300' : 'text-zinc-700')}>
                {a ?? '—'}
              </span>
              <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest w-10 text-center shrink-0">
                {label}
              </span>
              <span className={cn('text-[9px] font-black flex-1 text-right', b ? 'text-zinc-300' : 'text-zinc-700')}>
                {b ?? '—'}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Pick controls — single row, fixed height ───────────────────── */}
      <FightPickControls
        fight={fight}
        value={value}
        onPickChange={onPickChange}
        locked={locked}
        resultBreakdown={resultBreakdown}
      />
    </div>
  );
}

/* ─── MobilePicks ───────────────────────────────────────────────────────── */
export function MobilePicks({ eventId }: { eventId?: string }) {
  const { leagueId = '' } = useParams();
  const { user } = useAuth();
  const ctx = useOutletContext<OutletCtx>();

  const { data: events } = useEvents();
  const { data: league } = useLeague(leagueId);
  const { data: allBets } = useBets(leagueId);
  const { mutate: placeBet } = usePlaceBet();
  const { mutate: removeBet } = useRemoveBet();

  const [tab, setTab] = useState<Tab>('main');
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const event = eventId
    ? events?.find(e => e.id === eventId)
    : ctx?.currentEvent
    ? (events?.find(e => e.id === (ctx.currentEvent as any).id) ?? events?.[events.length - 1])
    : (events?.find(e => e.status !== 'FINISHED') ?? events?.[events.length - 1]);

  useEffect(() => {
    setTab('main');
    setCurrentIndex(0);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ left: 0, behavior: 'instant' });
    });
  }, [event?.id]);

  const currentUserId = user?.id ?? '';
  const myBets = allBets?.filter(b => b.userId === currentUserId) ?? [];
  const allFights = event?.fights ?? [];
  const mainCard = allFights.filter(f => f.isMainCard);
  const prelims = allFights.filter(f => !f.isMainCard);
  const fights = tab === 'main' ? mainCard : prelims;

  const scoring = { ...DEFAULT_SCORING, ...((league?.scoringSettings as object) ?? {}) };
  const atoutsState = ctx?.atoutsState;

  const switchTab = (next: Tab) => {
    setTab(next);
    setCurrentIndex(0);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ left: 0, behavior: 'instant' });
    });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCurrentIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({
      left: index * (scrollRef.current.clientWidth),
      behavior: 'smooth',
    });
  };

  const getPickForFight = (fight: Fight): FightCardPick | null => {
    const bet = myBets.find(b => b.fightId === fight.id);
    if (!bet) return null;
    return { winnerId: bet.winnerId, method: bet.method as FightCardPick['method'], round: bet.round };
  };

  const handlePickChange = (fight: Fight, pick: FightCardPick | null) => {
    const existing = myBets.find(b => b.fightId === fight.id);
    if (!pick) {
      if (existing) removeBet(existing.id);
      return;
    }
    const isComplete =
      pick.winnerId && pick.method && (pick.method === 'DECISION' || pick.round);
    if (!isComplete) return;
    placeBet({ leagueId, fightId: fight.id, winnerId: pick.winnerId, method: pick.method, round: pick.round });
  };

  const isLocked = (fight: Fight) =>
    fight.status === 'FINISHED' || event?.status === 'FINISHED';

  const getResultBreakdown = (fight: Fight): ResultBreakdown | undefined => {
    if (fight.status !== 'FINISHED' || !fight.winnerId) return undefined;
    const bet = myBets.find(b => b.fightId === fight.id);
    const winner =
      fight.winnerId === fight.fighterA.id ? fight.fighterA : fight.fighterB;
    const { points, stolenPoints, winnerCorrect, methodCorrect, roundCorrect } = calcFightPointsWithAtouts(
      fight,
      bet,
      atoutsState?.atouts ?? [],
      currentUserId,
      scoring,
      allBets ?? [],
    );
    return {
      userPick: bet
        ? {
            winnerId: bet.winnerId,
            winnerName: (
              bet.winnerId === fight.fighterA.id ? fight.fighterA : fight.fighterB
            ).name,
            method: bet.method,
            round: bet.round ?? undefined,
          }
        : { winnerId: '', winnerName: '' },
      result: {
        winnerId: fight.winnerId,
        winnerName: winner.name,
        method: fight.method ?? undefined,
        round: fight.round ?? undefined,
      },
      scoring: { winnerCorrect, methodCorrect, roundCorrect, points, stolenPoints },
    };
  };

  const pickedCount = fights.filter(f => !!getPickForFight(f)).length;

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Tabs + progress ───────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-3 px-3 py-2 border-b border-zinc-900/50">
        <div className="flex gap-1 flex-1 bg-zinc-900/60 rounded-xl p-1">
          {(['main', 'prelims'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all',
                tab === t ? 'bg-zinc-700 text-white' : 'text-zinc-600'
              )}
            >
              {t === 'main' ? 'Main Card' : 'Prelims'}
            </button>
          ))}
        </div>

        {/* Compact pick progress */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-black text-zinc-300">
            {pickedCount}
            <span className="text-zinc-700">/{fights.length}</span>
          </span>
        </div>
      </div>

      {/* ── Swipeable cards ────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory min-h-0"
        style={{ scrollbarWidth: 'none' } as React.CSSProperties}
      >
        {fights.map((fight, i) => (
          <div
            key={fight.id}
            className={cn(
              'w-full h-full shrink-0 snap-center transition-all duration-300',
              i !== currentIndex && 'opacity-50 scale-[0.97]'
            )}
          >
            <FightCardItem
              fight={fight}
              value={getPickForFight(fight)}
              onPickChange={pick => handlePickChange(fight, pick)}
              locked={isLocked(fight)}
              resultBreakdown={getResultBreakdown(fight)}
              atoutsOnFight={atoutsState?.forFight(fight.id) ?? []}
              currentUserId={currentUserId}
            />
          </div>
        ))}
        {fights.length === 0 && (
          <div className="w-full h-full shrink-0 snap-center flex items-center justify-center">
            <p className="text-zinc-700 text-sm font-black uppercase tracking-widest">No fights</p>
          </div>
        )}
      </div>

      {/* ── Navigation dots ────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-center gap-1.5 py-3">
        {fights.map((fight, i) => {
          const picked = !!getPickForFight(fight);
          const finished = fight.status === 'FINISHED';
          return (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                'rounded-full transition-all duration-300',
                i === currentIndex
                  ? 'w-6 h-2 bg-red-500'
                  : picked && finished
                  ? 'w-2 h-2 bg-emerald-600'
                  : picked
                  ? 'w-2 h-2 bg-zinc-500'
                  : 'w-2 h-2 bg-zinc-800'
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
