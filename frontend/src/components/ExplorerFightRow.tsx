import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calcFightPointsWithAtouts } from '@/hooks/useLeagueData';
import { ATOUT_DEFS, type PlayedAtout } from '@/hooks/useAtouts';
import type { Fight, Bet, ScoringSettings } from '@/types/api';

const methodLabel = (m?: string | null) => {
  if (!m) return null;
  if (m === 'DECISION') return 'DEC';
  if (m === 'SUBMISSION') return 'SUB';
  if (m === 'KO/TKO') return 'KO';
  return m;
};

interface ExplorerFightRowProps {
  fight: Fight;
  bet: Bet | undefined;
  atouts: PlayedAtout[];
  userId: string;
  scoring: ScoringSettings;
  allBets: Bet[];
  /** Resolves a userId to a display name. Used to show accurate attacker/target names. */
  getUserName?: (userId: string) => string;
  /** When false, shows a lock placeholder instead of the pick (mobile pre-lock). Defaults to true. */
  pickVisible?: boolean;
}

export function ExplorerFightRow({
  fight,
  bet,
  atouts,
  userId,
  scoring,
  allBets,
  getUserName,
  pickVisible = true,
}: ExplorerFightRowProps) {
  const resolveName = (storedName: string, resolvedUserId: string) =>
    getUserName ? getUserName(resolvedUserId) : storedName;
  const isFinished = fight.status === 'FINISHED' && !!fight.winnerId;

  const { points, stolenPoints, winnerCorrect, methodCorrect, roundCorrect, atoutApplied } =
    calcFightPointsWithAtouts(fight, bet, atouts, userId, scoring, allBets);

  const isVictim = stolenPoints < 0;
  const isDecision = bet?.method === 'DECISION' || bet?.method === 'DRAW';
  const isPerfect = !isVictim && winnerCorrect && methodCorrect && (isDecision || roundCorrect);

  const pickedFighter = bet
    ? bet.winnerId === fight.fighterA.id ? fight.fighterA : fight.fighterB
    : null;
  const resultFighter = isFinished && fight.winnerId
    ? fight.winnerId === fight.fighterA.id ? fight.fighterA : fight.fighterB
    : null;

  const atoutDef = atoutApplied ? ATOUT_DEFS.find(d => d.type === atoutApplied.type) : null;
  const atoutDetail = (() => {
    if (!atoutApplied || !atoutDef || !isFinished) return null;
    if (atoutApplied.type === 'DETTE' && atoutApplied.playedByUserId === userId) {
      const targetName = atoutApplied.targetUserId
        ? resolveName(atoutApplied.targetUserName ?? '?', atoutApplied.targetUserId)
        : (atoutApplied.targetUserName ?? '?');
      return stolenPoints > 0
        ? `${atoutDef.icon} +${stolenPoints} from ${targetName}`
        : `${atoutDef.icon} 0 (target had no points)`;
    }
    if (atoutApplied.type === 'DETTE' && atoutApplied.targetUserId === userId) {
      const attackerName = resolveName(atoutApplied.playedByName, atoutApplied.playedByUserId);
      return `${atoutDef.icon} -${Math.abs(stolenPoints)} by ${attackerName}`;
    }
    if (atoutApplied.type === 'DOUBLE') return `${atoutDef.icon} ×2`;
    if (atoutApplied.type === 'INVERSION') {
      const who = atoutApplied.playedByUserId === userId
        ? `→ ${atoutApplied.targetUserId ? resolveName(atoutApplied.targetUserName ?? '?', atoutApplied.targetUserId) : (atoutApplied.targetUserName ?? '?')}`
        : `by ${resolveName(atoutApplied.playedByName, atoutApplied.playedByUserId)}`;
      return `${atoutDef.icon} ${who}`;
    }
    return null;
  })();

  return (
    <div className={cn(
      'rounded-2xl border px-4 py-3 flex items-center gap-3 transition-all',
      isPerfect && isFinished ? 'border-emerald-800/50 bg-emerald-950/20' :
      isVictim && isFinished ? 'border-rose-900/30 bg-rose-950/10' :
      !isPerfect && points > 0 && isFinished ? 'border-amber-800/30 bg-amber-950/10' :
      isFinished && bet && points === 0 ? 'border-red-900/30 bg-zinc-950' :
      isFinished && !bet ? 'border-zinc-800/30 bg-zinc-950 opacity-40' :
      'border-zinc-800/50 bg-zinc-950'
    )}>
      {/* Status dot */}
      <div className={cn(
        'w-2 h-2 rounded-full shrink-0 mt-0.5',
        !pickVisible ? 'bg-zinc-800' :
        isPerfect && isFinished ? 'bg-emerald-500' :
        isVictim && isFinished ? 'bg-rose-500/60' :
        points > 0 && isFinished ? 'bg-amber-500' :
        isFinished && bet && points === 0 ? 'bg-red-500/40' :
        bet && !isFinished ? 'bg-zinc-500' :
        'bg-zinc-800'
      )} />

      <div className="flex-1 min-w-0">
        {/* Matchup */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide truncate">
            {fight.fighterA.name.split(' ').pop()} vs {fight.fighterB.name.split(' ').pop()}
          </p>
          {fight.isMainEvent && (
            <span className="text-[8px] font-black text-red-500 bg-red-950/50 px-1 rounded">MAIN</span>
          )}
        </div>

        {/* Pick */}
        {!pickVisible ? (
          <div className="flex items-center gap-1 mt-0.5">
            <Lock className="w-2.5 h-2.5 text-zinc-700" />
            <p className="text-[10px] font-bold text-zinc-700">Hidden until lock</p>
          </div>
        ) : pickedFighter ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className={cn(
              'text-[13px] font-black uppercase tracking-tight',
              isPerfect && isFinished ? 'text-emerald-400' :
              isVictim && isFinished ? 'text-rose-400/70' :
              points > 0 && isFinished ? 'text-amber-400' :
              isFinished && points === 0 ? 'text-red-400/60' :
              'text-white'
            )}>
              {pickedFighter.name.split(' ').pop()}
            </p>
            {bet?.method && (
              <span className="text-[9px] font-bold text-zinc-600">
                · {methodLabel(bet.method)}{bet.round ? ` R${bet.round}` : ''}
              </span>
            )}
          </div>
        ) : (
          <p className="text-[11px] font-bold text-zinc-600 mt-0.5">No pick</p>
        )}

        {/* Atout detail */}
        {atoutDetail && (
          <p className={cn('text-[9px] font-black mt-0.5', atoutDef?.textColor ?? 'text-zinc-500')}>
            {atoutDetail}
          </p>
        )}
      </div>

      {/* Right: points + result */}
      <div className="text-right shrink-0">
        {isFinished && pickVisible && (
          <p className={cn(
            'text-[14px] font-black leading-none',
            isPerfect ? 'text-emerald-400' :
            isVictim ? 'text-zinc-600' :
            points > 0 ? 'text-amber-400' :
            'text-zinc-700'
          )}>
            +{points}
          </p>
        )}
        {resultFighter && !winnerCorrect && (
          <p className="text-[9px] font-bold text-zinc-600 mt-0.5">
            → {resultFighter.name.split(' ').pop()}
            {fight.method && ` · ${methodLabel(fight.method)}`}
            {fight.round && fight.method !== 'DECISION' && ` R${fight.round}`}
          </p>
        )}
      </div>
    </div>
  );
}
