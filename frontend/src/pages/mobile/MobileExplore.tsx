import { useState, useEffect, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLeagueData } from '@/hooks/useLeagueData';
import { ATOUT_DEFS } from '@/hooks/useAtouts';
import type { useAtouts } from '@/hooks/useAtouts';
import type { Fight } from '@/types/api';
import { useBets } from '@/hooks/useBets';
import { ExplorerFightRow } from '@/components/ExplorerFightRow';

interface OutletCtx {
  currentEvent: { id: string } | undefined;
  atoutsState: ReturnType<typeof useAtouts>;
  currentUserId: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.[0]?.toUpperCase() ?? '?';
}

export function MobileExplore() {
  const { leagueId = '' } = useParams();
  const ctx = useOutletContext<OutletCtx>();

  const atoutsState = ctx?.atoutsState;

  const { standings, fights, scoring, currentUserId, getUserName, getBetsForUser, currentEvent } =
    useLeagueData(leagueId, ctx?.currentEvent?.id);
  const { data: allBets = [] } = useBets(leagueId);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const chipScrollRef = useRef<HTMLDivElement>(null);

  const selected = standings[selectedIdx];
  const selectedUserId = selected?.userId ?? '';
  const selectedIsMe = selectedUserId === currentUserId;
  const userBets = getBetsForUser(selectedUserId);

  const isFightLocked = (fight: Fight) => {
    if (fight.status === 'FINISHED') return true;
    const lockAt = fight.isPrelim ? currentEvent?.prelimsStartAt : currentEvent?.mainCardStartAt;
    return lockAt ? new Date() >= new Date(lockAt) : false;
  };

  // Scroll selected chip into view
  useEffect(() => {
    const chip = chipScrollRef.current?.children[selectedIdx] as HTMLElement | undefined;
    chip?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedIdx]);

  const totalPoints = selected?.points ?? 0;
  const correctPicks = selected?.correct ?? 0;
  const perfectPicks = selected?.perfect ?? 0;
  const myAtout = atoutsState?.playedBy(selectedUserId);
  const myAtoutDef = myAtout ? ATOUT_DEFS.find(d => d.type === myAtout.type) : null;
  const rawIncomingAtouts = atoutsState?.targetedBy(selectedUserId) ?? [];
  // Only reveal atout type/fight to the target after the fight is finished
  const incomingAtouts = selectedIsMe
    ? rawIncomingAtouts.filter(a => fights.find(f => f.id === a.fightId)?.status === 'FINISHED')
    : rawIncomingAtouts;
  const isBeingTargetedHidden = selectedIsMe && rawIncomingAtouts.length > incomingAtouts.length;

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Horizontal player chips ───────────────────────────────────── */}
      <div className="shrink-0 border-b border-zinc-900/50 py-3">
        <div
          ref={chipScrollRef}
          className="flex gap-2 px-4 overflow-x-auto"
          style={{ scrollbarWidth: 'none' } as React.CSSProperties}
        >
          {standings.map((s, i) => {
            const name = getUserName(s.userId);
            const isMe = s.userId === currentUserId;
            const isSelected = i === selectedIdx;
            const sAtout = atoutsState?.playedBy(s.userId);
            const sAtoutDef = sAtout ? ATOUT_DEFS.find(d => d.type === sAtout.type) : null;

            return (
              <button
                key={s.userId}
                onClick={() => setSelectedIdx(i)}
                className={cn(
                  'shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full border text-[11px] font-black uppercase tracking-tight transition-all',
                  isSelected
                    ? isMe
                      ? 'bg-red-950/50 border-red-700/60 text-red-300'
                      : 'bg-zinc-700 border-zinc-600 text-white'
                    : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-500'
                )}
              >
                {/* Rank */}
                <span className={cn('text-[9px] font-bold', isSelected ? 'text-zinc-400' : 'text-zinc-700')}>
                  #{i + 1}
                </span>
                <span>{name.split(' ')[0]}</span>
                {sAtoutDef && <span className="text-base leading-none">{sAtoutDef.icon}</span>}
                {isMe && <span className="text-[8px] text-zinc-600">·you</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Player summary header ─────────────────────────────────────── */}
      {selected && (
        <div className="shrink-0 px-4 py-3 border-b border-zinc-900/50">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className={cn(
              'w-10 h-10 rounded-full border-2 flex items-center justify-center text-[12px] font-black uppercase',
              selectedIsMe ? 'border-red-500 bg-red-950/30 text-red-300' : 'border-zinc-700 bg-zinc-800 text-zinc-300'
            )}>
              {getInitials(getUserName(selectedUserId))}
            </div>

            {/* Name + stats */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className={cn('text-[14px] font-black uppercase tracking-tight', selectedIsMe ? 'text-white' : 'text-zinc-200')}>
                  {getUserName(selectedUserId)}
                </p>
                {selectedIsMe && <span className="text-[8px] font-bold text-zinc-600">you</span>}
                {/* Atout played */}
                {myAtoutDef && (
                  <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-full border', myAtoutDef.bgColor, myAtoutDef.borderColor, myAtoutDef.textColor)}>
                    {myAtoutDef.icon} {myAtoutDef.name}
                  </span>
                )}
                {/* Incoming atouts */}
                {incomingAtouts.map((a, i) => {
                  const d = ATOUT_DEFS.find(x => x.type === a.type);
                  if (!d) return null;
                  return (
                    <span key={i} className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-full border opacity-60', d.bgColor, d.borderColor, d.textColor)}>
                      {d.icon} {d.name}
                    </span>
                  );
                })}
                {isBeingTargetedHidden && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full border border-red-800/50 bg-red-950/40 text-red-400">
                    🎯 Targeted
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[20px] font-black text-white leading-none">{totalPoints}</span>
                  <span className="text-[9px] font-bold text-zinc-600 uppercase">pts</span>
                </div>
                <div className="w-px h-3 bg-zinc-800" />
                <span className="text-[11px] font-bold text-zinc-500">{correctPicks} correct</span>
                {perfectPicks > 0 && (
                  <>
                    <div className="w-px h-3 bg-zinc-800" />
                    <span className="text-[11px] font-bold text-emerald-600">✦{perfectPicks} perfect{perfectPicks > 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Picks list ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-none px-4 py-3 space-y-2">
        {fights.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-4xl">👀</span>
            <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">No fights</p>
          </div>
        )}

        {(() => {
          const mainCard = fights.filter((f: Fight) => f.isMainCard);
          const prelims = fights.filter((f: Fight) => !f.isMainCard);
          const renderRow = (fight: Fight) => {
            const locked = isFightLocked(fight);
            const pickVisible = selectedIsMe || locked;
            const bet = pickVisible ? userBets.find(b => b.fightId === fight.id) : undefined;
            return (
              <ExplorerFightRow
                key={fight.id}
                fight={fight}
                bet={bet}
                atouts={atoutsState?.atouts ?? []}
                userId={selectedUserId}
                scoring={scoring}
                allBets={allBets}
                getUserName={getUserName}
                pickVisible={pickVisible}
              />
            );
          };
          return (
            <>
              {mainCard.length > 0 && (
                <>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 pt-1">Main Card</p>
                  {mainCard.map(renderRow)}
                </>
              )}
              {prelims.length > 0 && (
                <>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 pt-3">Prelims</p>
                  {prelims.map(renderRow)}
                </>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
