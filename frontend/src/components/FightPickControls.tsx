import { cn } from '@/lib/utils';
import { Lock, RefreshCw } from 'lucide-react';
import { useFightPick } from '@/hooks/useFightPick';
import type { FightCardPick, ResultBreakdown } from './FightCard';
import type { Fight } from '@/types/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function methodColor(m: string): string {
  if (m === 'KO/TKO') return 'text-red-400';
  if (m === 'SUBMISSION') return 'text-orange-400';
  return 'text-zinc-400';
}

function methodShort(m: string): string {
  if (m === 'KO/TKO') return 'KO';
  if (m === 'SUBMISSION') return 'SUB';
  if (m === 'DECISION') return 'DEC';
  return m;
}

// ─── Pill button ──────────────────────────────────────────────────────────────
function Pill({
  label,
  active,
  onClick,
  color = 'default',
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: 'default' | 'blue' | 'red';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 border',
        active
          ? color === 'blue'
            ? 'bg-blue-600 border-blue-500 text-white'
            : color === 'red'
            ? 'bg-red-600 border-red-500 text-white'
            : 'bg-zinc-600 border-zinc-500 text-white'
          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
      )}
    >
      {label}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface FightPickControlsProps {
  fight: Fight;
  value: FightCardPick | null;
  onPickChange: (pick: FightCardPick | null) => void;
  locked: boolean;
  resultBreakdown?: ResultBreakdown;
}

/**
 * Exact v2 mobile pick controls — fixed h-[76px] so the card never resizes.
 * Shared between mobile v2 and desktop.
 */
export function FightPickControls({
  fight,
  value,
  onPickChange,
  locked,
  resultBreakdown,
}: FightPickControlsProps) {
  const { winner, method, round, selectWinner, selectMethod, selectRound, reset } =
    useFightPick({ mode: 'full', value, onPickChange, locked });

  const hasWinner = !!winner;
  const hasMethod = !!method;
  const needsRound = method === 'KO/TKO' || method === 'SUBMISSION';

  return (
    <div className="shrink-0 border-t border-zinc-900/60 h-[76px] flex flex-col justify-center overflow-hidden">

      {/* Locked with result */}
      {locked && resultBreakdown && (
        <div className="px-3 flex items-center justify-between">
          <div>
            <p className="text-[9px] text-zinc-600 font-bold mb-0.5">Your pick</p>
            <p className="text-[13px] font-black text-white leading-tight">
              {resultBreakdown.userPick.winnerName?.split(' ').pop() ?? '—'}
              {resultBreakdown.userPick.method && (
                <span className={cn('ml-1.5 text-[10px] font-bold', methodColor(resultBreakdown.userPick.method))}>
                  {methodShort(resultBreakdown.userPick.method)}
                  {resultBreakdown.userPick.round && ` R${resultBreakdown.userPick.round}`}
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-zinc-600 font-bold mb-0.5">Result</p>
            <p className="text-[13px] font-black text-zinc-300 leading-tight">
              {resultBreakdown.result.winnerName?.split(' ').pop() ?? '?'}
              {resultBreakdown.result.method && (
                <span className="ml-1.5 text-[10px] font-bold text-zinc-500">
                  {methodShort(resultBreakdown.result.method)}
                  {resultBreakdown.result.round && ` R${resultBreakdown.result.round}`}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Locked without result */}
      {locked && !resultBreakdown && (
        <div className="px-3 flex items-center justify-center gap-2 text-zinc-600">
          <Lock className="w-3.5 h-3.5" />
          <p className="text-[11px] font-black uppercase tracking-wider">
            {winner
              ? `${(winner === fight.fighterA.id ? fight.fighterA : fight.fighterB).name.split(' ').pop()} · ${method ? methodShort(method) : '...'}${round ? ` R${round}` : ''}`
              : 'No pick'}
          </p>
        </div>
      )}

      {/* Step 1: Choose winner */}
      {!locked && !hasWinner && (
        <div className="flex gap-2 px-3">
          <button
            onClick={() => selectWinner(fight.fighterA.id)}
            className="flex-1 py-3 rounded-2xl bg-blue-950/40 border border-blue-800/40 text-blue-300 font-black text-[12px] uppercase tracking-tight active:scale-95 active:bg-blue-950/70 transition-all"
          >
            {fight.fighterA.name.split(' ').pop()}
          </button>
          <button
            onClick={() => selectWinner(fight.fighterB.id)}
            className="flex-1 py-3 rounded-2xl bg-red-950/40 border border-red-800/40 text-red-300 font-black text-[12px] uppercase tracking-tight active:scale-95 active:bg-red-950/70 transition-all"
          >
            {fight.fighterB.name.split(' ').pop()}
          </button>
        </div>
      )}

      {/* Step 2: Method */}
      {!locked && hasWinner && !hasMethod && (
        <div className="px-3 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black">Method</p>
            <button
              onClick={reset}
              className="text-[9px] text-zinc-700 font-bold flex items-center gap-0.5"
            >
              <RefreshCw className="w-2.5 h-2.5" /> Change
            </button>
          </div>
          <div className="flex gap-2">
            <Pill label="KO/TKO" active={method === 'KO/TKO'} onClick={() => selectMethod('KO/TKO')} color="red" />
            <Pill label="SUB" active={method === 'SUBMISSION'} onClick={() => selectMethod('SUBMISSION')} color="default" />
            <Pill label="DEC" active={method === 'DECISION'} onClick={() => selectMethod('DECISION')} color="default" />
          </div>
        </div>
      )}

      {/* Step 3: Round */}
      {!locked && hasMethod && needsRound && !round && (
        <div className="px-3 animate-in slide-in-from-bottom-2 duration-200">
          <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black mb-1.5">Round</p>
          <div className="flex gap-1.5">
            {Array.from({ length: fight.rounds }, (_, i) => (
              <Pill
                key={i + 1}
                label={`R${i + 1}`}
                active={round === i + 1}
                onClick={() => selectRound(i + 1)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Complete pick summary */}
      {!locked && hasWinner && hasMethod && (!needsRound || round) && (
        <div className="px-3 flex items-center justify-center relative animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <p className="text-[11px] font-black text-white uppercase tracking-wider">
              {(winner === fight.fighterA.id ? fight.fighterA : fight.fighterB).name.split(' ').pop()}
              <span className="text-zinc-500 font-bold ml-1.5">
                · {methodShort(method!)}
                {round && ` R${round}`}
              </span>
            </p>
          </div>
          <button
            onClick={reset}
            className="absolute right-3 text-[9px] text-zinc-700 font-bold flex items-center gap-0.5"
          >
            <RefreshCw className="w-2.5 h-2.5" /> Reset
          </button>
        </div>
      )}
    </div>
  );
}
