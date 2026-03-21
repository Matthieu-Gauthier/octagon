import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export type AtoutType = 'DOUBLE' | 'INVERSION' | 'DETTE';

export interface PlayedAtout {
  id: string;
  type: AtoutType;
  playedByUserId: string;
  playedByName: string;
  fightId: string;
  targetUserId?: string;
  targetUserName?: string;
  playedAt: string;
}

export interface AtoutDef {
  type: AtoutType;
  icon: string;
  name: string;
  description: string;
  selfTarget: boolean;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

export const ATOUT_DEFS: AtoutDef[] = [
  {
    type: 'DOUBLE',
    icon: '⚡',
    name: 'x2',
    description: 'Double your points on a fight',
    selfTarget: true,
    color: 'amber',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-950/50',
    borderColor: 'border-amber-800/60',
  },
  {
    type: 'INVERSION',
    icon: '🔄',
    name: 'Inversion',
    description: "Reverses an opponent's pick",
    selfTarget: false,
    color: 'violet',
    textColor: 'text-violet-400',
    bgColor: 'bg-violet-950/50',
    borderColor: 'border-violet-800/60',
  },
  {
    type: 'DETTE',
    icon: '💀',
    name: 'Dette',
    description: "Steal all of an opponent's points on a fight",
    selfTarget: false,
    color: 'rose',
    textColor: 'text-rose-400',
    bgColor: 'bg-rose-950/50',
    borderColor: 'border-rose-800/60',
  },
];

export function useAtouts(leagueId: string, eventId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['atouts', leagueId, eventId];

  const { data: atouts = [] } = useQuery<PlayedAtout[]>({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get<PlayedAtout[]>('/atouts', {
        params: { leagueId, eventId },
      });
      return data;
    },
    enabled: !!leagueId && !!eventId,
  });

  const playMutation = useMutation({
    mutationFn: async (atout: Omit<PlayedAtout, 'id' | 'playedAt'> & { eventId: string; leagueId: string }) => {
      const { data } = await api.post<PlayedAtout>('/atouts', atout);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const removeMutation = useMutation({
    mutationFn: async (atoutId: string) => {
      await api.delete(`/atouts/${atoutId}`);
      return atoutId;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const play = (atout: Omit<PlayedAtout, 'id' | 'playedAt'>) => {
    if (!eventId) return;
    playMutation.mutate({ ...atout, eventId, leagueId });
  };

  const remove = (atoutId: string) => removeMutation.mutate(atoutId);

  const forFight = (fightId: string) => atouts.filter(a => a.fightId === fightId);
  const playedBy = (userId: string) => atouts.find(a => a.playedByUserId === userId);
  const targetedBy = (userId: string) => atouts.filter(a => a.targetUserId === userId);
  const isTargeted = (userId: string) => atouts.some(a => a.targetUserId === userId);

  return { atouts, play, remove, forFight, playedBy, targetedBy, isTargeted };
}
