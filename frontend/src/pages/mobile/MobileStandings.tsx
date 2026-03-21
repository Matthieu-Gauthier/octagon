import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLeagueData } from '@/hooks/useLeagueData';
import { ATOUT_DEFS } from '@/hooks/useAtouts';
import type { useAtouts } from '@/hooks/useAtouts';

interface OutletCtx {
  currentEvent: { id: string } | undefined;
  atoutsState: ReturnType<typeof useAtouts>;
  currentUserId: string;
}

const MEDAL_BG = ['bg-yellow-500/10 border-yellow-600/30', 'bg-zinc-400/10 border-zinc-600/30', 'bg-orange-900/20 border-orange-800/30'];
const MEDAL_TEXT = ['text-yellow-400', 'text-zinc-400', 'text-orange-600'];
const MEDAL_ICON = ['🥇', '🥈', '🥉'];

export function MobileStandings() {
  const { leagueId = '' } = useParams();
  const ctx = useOutletContext<OutletCtx>();
  const navigate = useNavigate();

  const atoutsState = ctx?.atoutsState;
  const { standings, scoring, currentUserId, getUserName, fights } = useLeagueData(
    leagueId,
    ctx?.currentEvent?.id
  );
  const isAtoutActiveOnFight = (fightId: string) =>
    fights.find(f => f.id === fightId)?.status !== 'FINISHED';
  const maxPoints = standings[0]?.points ?? 1;

  const podium = standings.slice(0, 3);
  const rest = standings.slice(3);

  return (
    <div className="h-full overflow-y-auto overscroll-none">
      <div className="px-4 py-4 space-y-5 pb-8">

        {/* ── Scoring key ─────────────────────────────────────────────── */}
        <div className="flex gap-px overflow-hidden rounded-2xl border border-zinc-800/50">
          {[
            { label: 'Winner', pts: `${scoring.winner}`, icon: '🏆' },
            { label: 'Method', pts: `+${scoring.method}`, icon: '🥊' },
            { label: 'Round', pts: `+${scoring.round}`, icon: '⏱' },
            { label: 'Perfect', pts: '+20', icon: '🎯' },
          ].map(({ label, pts, icon }, i) => (
            <div
              key={label}
              className={cn(
                'flex-1 flex flex-col items-center py-2.5 bg-zinc-950',
                i > 0 && 'border-l border-zinc-800/50'
              )}
            >
              <span className="text-base leading-none mb-0.5">{icon}</span>
              <p className="text-[12px] font-black text-white">
                {pts}
                <span className="text-zinc-600 text-[8px] font-bold ml-0.5">pts</span>
              </p>
              <p className="text-[7px] uppercase tracking-widest text-zinc-600 font-bold mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Podium top 3 ────────────────────────────────────────────── */}
        {podium.length > 0 && (
          <div className="flex items-end justify-center gap-3">
            {[podium[1], podium[0], podium[2]].map((entry, visualIdx) => {
              if (!entry) return <div key={visualIdx} className="flex-1" />;
              const rank = standings.indexOf(entry);
              const isMe = entry.userId === currentUserId;
              const name = getUserName(entry.userId);
              const initials = name.slice(0, 2).toUpperCase();
              const myAtout = atoutsState?.playedBy(entry.userId);
              const myAtoutDef = myAtout ? ATOUT_DEFS.find(d => d.type === myAtout.type) : null;
              const targetedAtout = atoutsState?.targetedBy(entry.userId)[0];
              const targetIsMe = entry.userId === currentUserId;
              const targetHidden = targetIsMe && targetedAtout && isAtoutActiveOnFight(targetedAtout.fightId);
              const targetedDef = (!targetHidden && targetedAtout) ? ATOUT_DEFS.find(d => d.type === targetedAtout.type) : null;

              const podiumHeights = ['h-24', 'h-32', 'h-20']; // 2nd, 1st, 3rd
              const avatarSizes = ['w-12 h-12 text-[13px]', 'w-14 h-14 text-[15px]', 'w-10 h-10 text-[11px]'];

              return (
                <button
                  key={entry.userId}
                  onClick={() => navigate(`/mobile/${leagueId}/explore`)}
                  className="flex-1 flex flex-col items-center gap-2 active:opacity-80 transition-opacity"
                >
                  {/* Atout indicator */}
                  {(myAtoutDef || targetedDef || targetHidden) && (
                    <div className="flex gap-1">
                      {myAtoutDef && (
                        <span className="text-base">{myAtoutDef.icon}</span>
                      )}
                      {targetedDef && (
                        <span className="text-base opacity-60">{targetedDef.icon}</span>
                      )}
                      {targetHidden && (
                        <span className="text-base opacity-60">🎯</span>
                      )}
                    </div>
                  )}

                  {/* Avatar */}
                  <div
                    className={cn(
                      'rounded-full border-2 flex items-center justify-center font-black uppercase',
                      avatarSizes[visualIdx],
                      isMe ? 'border-red-500 bg-red-950/30 text-red-300' : 'border-zinc-700 bg-zinc-800 text-zinc-300',
                      rank === 0 && 'border-yellow-500 bg-yellow-950/30 text-yellow-300'
                    )}
                  >
                    {initials}
                  </div>

                  {/* Medal */}
                  <span className="text-xl">{MEDAL_ICON[rank]}</span>

                  {/* Podium block */}
                  <div
                    className={cn(
                      'w-full rounded-t-xl flex flex-col items-center justify-end pb-3 border-t',
                      podiumHeights[visualIdx],
                      MEDAL_BG[rank]
                    )}
                  >
                    <p className={cn('text-[11px] font-black truncate w-full text-center px-1', MEDAL_TEXT[rank])}>
                      {name.split(' ')[0]}
                    </p>
                    <p className={cn('text-[18px] font-black leading-none', rank === 0 ? 'text-yellow-400' : isMe ? 'text-white' : 'text-zinc-300')}>
                      {entry.points}
                    </p>
                    <p className="text-[7px] uppercase tracking-widest text-zinc-600 font-bold">pts</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Rest of leaderboard ─────────────────────────────────────── */}
        {rest.length > 0 && (
          <div className="space-y-2">
            {rest.map((entry, i) => {
              const rank = i + 3;
              const isMe = entry.userId === currentUserId;
              const name = getUserName(entry.userId);
              const myAtout = atoutsState?.playedBy(entry.userId);
              const myAtoutDef = myAtout ? ATOUT_DEFS.find(d => d.type === myAtout.type) : null;
              const rawTargetedAtouts = atoutsState?.targetedBy(entry.userId) ?? [];
              const targetedAtouts = isMe
                ? rawTargetedAtouts.filter(a => !isAtoutActiveOnFight(a.fightId))
                : rawTargetedAtouts;
              const isBeingTargetedHidden = isMe && rawTargetedAtouts.some(a => isAtoutActiveOnFight(a.fightId));

              return (
                <button
                  key={entry.userId}
                  onClick={() => navigate(`/mobile/${leagueId}/explore`)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all active:scale-[0.98]',
                    isMe ? 'border-zinc-600 bg-zinc-900' : 'border-zinc-800/60 bg-zinc-950'
                  )}
                >
                  {/* Rank */}
                  <span className="text-[11px] font-black text-zinc-600 w-6 text-center shrink-0">
                    #{rank + 1}
                  </span>

                  {/* Avatar */}
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-black uppercase shrink-0',
                      isMe ? 'border-zinc-600 bg-zinc-700 text-white' : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                    )}
                  >
                    {name.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={cn('text-[12px] font-black uppercase tracking-tight truncate', isMe ? 'text-white' : 'text-zinc-300')}>
                        {name}
                      </p>
                      {isMe && <span className="text-[8px] font-bold text-zinc-600 uppercase shrink-0">you</span>}
                      {/* Atout badges */}
                      {myAtoutDef && (
                        <span className="text-sm leading-none shrink-0">{myAtoutDef.icon}</span>
                      )}
                      {targetedAtouts.map((a, j) => {
                        const d = ATOUT_DEFS.find(x => x.type === a.type);
                        return d ? <span key={j} className="text-sm leading-none opacity-50 shrink-0">{d.icon}</span> : null;
                      })}
                      {isBeingTargetedHidden && (
                        <span className="text-sm leading-none opacity-70 shrink-0">🎯</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', isMe ? 'bg-red-600/60' : 'bg-zinc-600')}
                          style={{ width: `${(entry.points / maxPoints) * 100}%` }}
                        />
                      </div>
                      <span className="text-[8px] font-bold text-zinc-600 shrink-0">
                        {entry.correct}/{entry.total}
                      </span>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right shrink-0">
                    <p className={cn('text-lg font-black leading-none', isMe ? 'text-white' : 'text-zinc-300')}>
                      {entry.points}
                    </p>
                    <p className="text-[8px] text-zinc-700 uppercase tracking-wider font-bold">pts</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {standings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-4xl">🥊</span>
            <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">No picks yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
