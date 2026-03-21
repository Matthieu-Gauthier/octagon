import { useState, useEffect } from 'react';
import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import { ProfileEditor } from '@/components/ProfileEditor';
import { Flame, Trophy, Compass, ChevronDown, ChevronLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/context/AuthContext';
import { useAtouts, ATOUT_DEFS, type AtoutType, type PlayedAtout } from '@/hooks/useAtouts';
import { useLeagueData } from '@/hooks/useLeagueData';
import type { Fight, Event } from '@/types/api';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function formatEventName(name: string): string {
  // "UFC Fight Night: Fiziev vs Gamrot" → "UFC Fiziev vs Gamrot"
  const fightNight = name.match(/ufc\s+fight\s+night\s*[:\-–]?\s*(.*)/i);
  if (fightNight) return `UFC ${fightNight[1].trim()}`;
  // Numbered event: keep full name
  return name;
}

/* ─── Event Picker Sheet ──────────────────────────────────────────────────── */

function EventPickerSheet({
  open,
  onClose,
  events,
  selectedId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  events: Event[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const upcoming = events.filter(e => e.status !== 'FINISHED');
  const finished = events.filter(e => e.status === 'FINISHED').reverse();
  const [tab, setTab] = useState<'upcoming' | 'finished'>('upcoming');

  const displayed = tab === 'upcoming' ? upcoming : finished;

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 bg-zinc-950 border-t border-zinc-800/60 rounded-t-3xl transition-transform duration-300 ease-out',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>
        <div className="px-5 pb-10">
          {/* Segmented control */}
          <div className="flex gap-1 p-1 bg-zinc-900 rounded-2xl mb-5">
            {(['upcoming', 'finished'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all',
                  tab === t
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-600 active:text-zinc-400'
                )}
              >
                {t === 'upcoming' ? 'Upcoming' : 'Finished'}
              </button>
            ))}
          </div>

          <div className="space-y-3 max-h-[55vh] overflow-y-auto overscroll-none">
            {displayed.map(event => {
              const isSelected = event.id === selectedId;
              const dateStr = new Date(event.date).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              });
              return (
                <button
                  key={event.id}
                  onClick={() => { onSelect(event.id); onClose(); }}
                  className={cn(
                    'w-full flex items-end gap-3 px-5 py-5 rounded-2xl border text-left transition-all overflow-hidden relative min-h-[100px]',
                    isSelected
                      ? 'border-zinc-500 bg-zinc-900'
                      : 'border-zinc-900 bg-zinc-950 active:bg-zinc-900'
                  )}
                >
                  {event.eventImg && (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-20"
                      style={{ backgroundImage: `url(${event.eventImg})` }}
                    />
                  )}
                  {/* gradient overlay so text stays readable */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="relative flex-1 min-w-0">
                    <p className={cn(
                      'text-[14px] font-black uppercase tracking-tight truncate leading-tight',
                      isSelected ? 'text-white' : 'text-zinc-200'
                    )}>
                      {event.name}
                    </p>
                    <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-wider">
                      {dateStr}
                    </p>
                  </div>
                  {isSelected && <Check className="relative w-4 h-4 text-red-500 shrink-0 mb-0.5" />}
                </button>
              );
            })}
            {displayed.length === 0 && (
              <p className="text-center text-zinc-700 text-[12px] font-bold py-8 uppercase tracking-wider">
                No events
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Atout Modal ─────────────────────────────────────────────────────────── */

type ModalStep = 'choose_type' | 'choose_fight' | 'choose_target' | 'confirm';

function AtoutModal({
  open,
  onClose,
  fights,
  standings,
  currentUserId,
  atoutsState,
  onPlay,
  currentUserName,
}: {
  open: boolean;
  onClose: () => void;
  fights: Fight[];
  standings: { userId: string; username?: string }[];
  currentUserId: string;
  atoutsState: ReturnType<typeof useAtouts>;
  onPlay: (a: Omit<PlayedAtout, 'id' | 'playedAt'>) => void;
  currentUserName: string;
}) {
  const [step, setStep] = useState<ModalStep>('choose_type');
  const [type, setType] = useState<AtoutType | null>(null);
  const [fightId, setFightId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string>('');

  const reset = () => {
    setStep('choose_type');
    setType(null);
    setFightId(null);
    setTargetId(null);
    setTargetName('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSelectType = (t: AtoutType) => {
    setType(t);
    const def = ATOUT_DEFS.find(d => d.type === t)!;
    if (!def.selfTarget) {
      setStep('choose_target');
    } else {
      setStep('choose_fight');
    }
  };

  const handleSelectTarget = (userId: string, name: string) => {
    setTargetId(userId);
    setTargetName(name);
    setStep('choose_fight');
  };

  const handleSelectFight = (fight: Fight) => {
    setFightId(fight.id);
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (!type || !fightId) return;
    onPlay({
      type,
      playedByUserId: currentUserId,
      playedByName: currentUserName,
      fightId,
      targetUserId: targetId ?? undefined,
      targetUserName: targetName || undefined,
    });
    handleClose();
  };

  const def = type ? ATOUT_DEFS.find(d => d.type === type) : null;
  const selectedFight = fights.find(f => f.id === fightId);
  const availableFights = fights.filter(f => f.isMainCard && f.status !== 'FINISHED');
  const availableTargets = standings.filter(s => {
    if (s.userId === currentUserId) return false;
    if (atoutsState.isTargeted(s.userId)) return false;
    return true;
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={handleClose}
      />

      {/* Bottom sheet */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 bg-zinc-950 border-t border-zinc-800/60 rounded-t-3xl transition-transform duration-300 ease-out',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        <div className="px-5 pb-10 min-h-[340px]">
          {/* Step: choose type */}
          {step === 'choose_type' && (
            <>
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-black mb-4 text-center">
                Choose a power up
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ATOUT_DEFS.map(d => (
                  <button
                    key={d.type}
                    onClick={() => handleSelectType(d.type)}
                    className={cn(
                      'flex flex-col items-start gap-2 p-4 rounded-2xl border transition-all active:scale-95',
                      d.bgColor, d.borderColor
                    )}
                  >
                    <span className="text-2xl">{d.icon}</span>
                    <div>
                      <p className={cn('text-[13px] font-black leading-tight', d.textColor)}>{d.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{d.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step: choose target player */}
          {step === 'choose_target' && def && (
            <>
              <button onClick={() => setStep('choose_type')} className="text-zinc-500 text-[11px] font-bold mb-3">
                ← Back
              </button>
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-black mb-4 text-center">
                <span className={def.textColor}>{def.icon} {def.name}</span> — Choose an opponent
              </p>
              <div className="space-y-2">
                {availableTargets.length === 0 && (
                  <p className="text-center text-zinc-600 text-sm py-8">
                    All opponents have already been targeted
                  </p>
                )}
                {availableTargets.map(s => {
                  const displayName = s.username ?? s.userId.slice(0, 8);
                  return (
                    <button
                      key={s.userId}
                      onClick={() => handleSelectTarget(s.userId, displayName)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-zinc-800 bg-zinc-900 active:bg-zinc-800 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[11px] font-black text-zinc-400 uppercase">
                        {displayName.slice(0, 2)}
                      </div>
                      <p className="font-black text-[13px] text-white uppercase tracking-tight">
                        {displayName}
                      </p>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Step: choose fight */}
          {step === 'choose_fight' && def && (
            <>
              <button onClick={() => setStep(def.selfTarget ? 'choose_type' : 'choose_target')} className="text-zinc-500 text-[11px] font-bold mb-3">
                ← Back
              </button>
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-black mb-4 text-center">
                <span className={def.textColor}>{def.icon} {def.name}</span> — Choose a fight
              </p>
              <div className="space-y-2">
                {availableFights.map(f => (
                  <button
                    key={f.id}
                    onClick={() => handleSelectFight(f)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-zinc-800 bg-zinc-900 active:bg-zinc-800 transition-colors text-left"
                  >
                    {f.isMainEvent && (
                      <span className="text-[8px] font-black text-red-500 bg-red-950/60 px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">Main</span>
                    )}
                    <div>
                      <p className="text-[12px] font-black text-white uppercase tracking-tight leading-tight">
                        {f.fighterA.name.split(' ').pop()} vs {f.fighterB.name.split(' ').pop()}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-bold">{f.division}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step: confirm */}
          {step === 'confirm' && def && (
            <>
              <div className="flex flex-col items-center gap-5 py-4">
                <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center text-4xl', def.bgColor, 'border', def.borderColor)}>
                  {def.icon}
                </div>
                <div className="text-center">
                  <p className={cn('text-xl font-black', def.textColor)}>{def.name}</p>
                  {selectedFight && (
                    <p className="text-zinc-400 text-sm mt-1">
                      {def.selfTarget ? 'On ' : `${targetName} · `}
                      <span className="font-bold text-white">
                        {selectedFight.fighterA.name.split(' ').pop()} vs {selectedFight.fighterB.name.split(' ').pop()}
                      </span>
                    </p>
                  )}
                </div>
                <button
                  onClick={handleConfirm}
                  className={cn(
                    'w-full py-4 rounded-2xl font-black text-[14px] uppercase tracking-wider transition-all active:scale-95',
                    def.bgColor, def.textColor, 'border', def.borderColor
                  )}
                >
                  Play power up ✓
                </button>
                <button onClick={() => setStep('choose_type')} className="text-zinc-600 text-[11px] font-bold">
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Layout ──────────────────────────────────────────────────────────────── */

export function MobileLayout() {
  const { leagueId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: events } = useEvents();
  const [atoutOpen, setAtoutOpen] = useState(false);
  const [eventPickerOpen, setEventPickerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);

  // Default to live/scheduled event once events load
  useEffect(() => {
    if (!events || selectedEventId) return;
    const def =
      events.find(e => e.status === 'LIVE') ??
      events.find(e => e.status === 'SCHEDULED') ??
      events[events.length - 1];
    if (def) setSelectedEventId(def.id);
  }, [events, selectedEventId]);

  const currentEvent = selectedEventId
    ? events?.find(e => e.id === selectedEventId)
    : (events?.find(e => e.status === 'LIVE') ??
       events?.find(e => e.status === 'SCHEDULED') ??
       events?.[events.length - 1]);

  const { standings, fights, getUserName } = useLeagueData(leagueId, currentEvent?.id);
  const currentUserId = user?.id ?? '';
  const currentUserName = getUserName(currentUserId);

  const atoutsState = useAtouts(leagueId, currentEvent?.id);
  const myAtout = atoutsState.playedBy(currentUserId);
  const hasAtout = !myAtout;
  const myAtoutFightFinished = myAtout
    ? (currentEvent?.fights ?? fights).find(f => f.id === myAtout.fightId)?.status === 'FINISHED'
    : false;
  const canChangeAtout = !!myAtout && !myAtoutFightFinished;

  const allFights = currentEvent?.fights ?? fights;
  // Generic "you're targeted" indicator — no type or fight revealed
  const isTargeted = atoutsState.atouts.some(
    a => a.targetUserId === currentUserId &&
    (allFights.find(f => f.id === a.fightId)?.status !== 'FINISHED')
  );

  const initials = currentUserName.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || '?';
  const eventLabel = currentEvent ? formatEventName(currentEvent.name) : '—';

  const NAV = [
    { to: `/mobile/${leagueId}/picks`, icon: Flame, label: 'Picks' },
    { to: `/mobile/${leagueId}/standings`, icon: Trophy, label: 'Standings' },
    { to: `/mobile/${leagueId}/explore`, icon: Compass, label: 'Explore' },
  ] as const;

  const myAtoutDef = myAtout ? ATOUT_DEFS.find(d => d.type === myAtout.type) : null;

  return (
    <div className="h-dvh bg-black text-white flex flex-col overflow-hidden relative">

      {/* ── Minimal Header ──────────────────────────────────────────────── */}
      <header className="shrink-0 h-12 flex items-center gap-2 px-4 z-10">
        <button
          onClick={() => navigate('/leagues')}
          className="shrink-0 text-zinc-500 active:text-zinc-300 transition-colors"
          aria-label="Back to leagues"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setEventPickerOpen(true)}
          className="flex items-center gap-1 group min-w-0 shrink truncate"
        >
          <span className="text-sm font-black uppercase tracking-tight text-white group-active:text-zinc-400 transition-colors truncate">
            {eventLabel}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-active:text-zinc-400 transition-colors shrink-0" />
        </button>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Targeted indicator — generic, no type or fight revealed */}
          {isTargeted && (
            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-black bg-red-950/50 border border-red-800/50 text-red-400 animate-pulse">
              🎯 Targeted
            </span>
          )}
          {/* Atout pill */}
          <button
            onClick={() => {
              if (hasAtout) { setAtoutOpen(true); return; }
              if (canChangeAtout) { atoutsState.remove(myAtout!.id); setAtoutOpen(true); }
            }}
            disabled={!!myAtout && !canChangeAtout}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all',
              hasAtout
                ? 'bg-amber-500/10 border border-amber-500/40 text-amber-400 active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : canChangeAtout
                ? `border active:scale-95 ${myAtoutDef?.bgColor ?? ''} ${myAtoutDef?.borderColor ?? ''} ${myAtoutDef?.textColor ?? ''}`
                : 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-default opacity-50',
            )}
          >
            {hasAtout ? (
              <>
                <span className="text-base leading-none">🎴</span>
                <span>Power Up</span>
              </>
            ) : myAtoutDef ? (
              <>
                <span className="text-sm leading-none">{myAtoutDef.icon}</span>
                <span>{myAtoutDef.name}</span>
                {canChangeAtout && <span className="opacity-50">✎</span>}
              </>
            ) : null}
          </button>

          {/* Avatar */}
          <button
            onClick={() => setProfileOpen(true)}
            className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-black text-zinc-400 uppercase active:opacity-70 transition-opacity"
          >
            {initials}
          </button>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 overflow-hidden pb-20">
        <Outlet context={{ currentEvent, selectedEventId, atoutsState, currentUserId, currentUserName, standings }} />
      </main>

      {/* ── Floating pill nav ─────────────────────────────────────────── */}
      <div className="absolute bottom-5 left-0 right-0 flex justify-center z-30 pointer-events-none">
        <nav className="pointer-events-auto bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/50 rounded-full p-1.5 flex gap-1 shadow-2xl shadow-black/60">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 select-none',
                  isActive
                    ? 'bg-zinc-700/80 text-white'
                    : 'text-zinc-600 active:text-zinc-300'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('w-4 h-4 transition-all', isActive && 'text-red-400')} />
                  {isActive && (
                    <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                      {label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── Event Picker Sheet ───────────────────────────────────────────── */}
      <EventPickerSheet
        open={eventPickerOpen}
        onClose={() => setEventPickerOpen(false)}
        events={events ?? []}
        selectedId={selectedEventId ?? ''}
        onSelect={setSelectedEventId}
      />

      {/* ── Profile Editor ───────────────────────────────────────────────── */}
      {profileOpen && <ProfileEditor onClose={() => setProfileOpen(false)} />}

      {/* ── Atout Modal ──────────────────────────────────────────────────── */}
      <AtoutModal
        open={atoutOpen}
        onClose={() => setAtoutOpen(false)}
        fights={allFights}
        standings={standings as { userId: string; username?: string }[]}
        currentUserId={currentUserId}
        atoutsState={atoutsState}
        onPlay={atoutsState.play}
        currentUserName={currentUserName}
      />
    </div>
  );
}
