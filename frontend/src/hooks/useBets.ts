import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Bet, BetDTO } from '../types/api';
import { toast } from 'sonner';

export function useBets(leagueId: string) {
    return useQuery({
        queryKey: ['bets', leagueId],
        queryFn: async () => {
            const { data } = await api.get<Bet[]>(`/leagues/${leagueId}/bets`);
            return data;
        },
        enabled: !!leagueId,
    });
}

export function useMyBets(leagueId: string) {
    return useQuery({
        queryKey: ['bets', leagueId, 'me'],
        queryFn: async () => {
            // Assuming endpoint exists for current user's bets in a league
            // If not, we might need to filter client side or use a specific endpoint
            const { data } = await api.get<Bet[]>(`/leagues/${leagueId}/bets`);
            return data;
        },
        enabled: !!leagueId,
    });
}

export function usePlaceBet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (betData: BetDTO) => {
            const { data } = await api.post<Bet>('/bets', betData);
            return data;
        },
        onSuccess: (newBet) => {
            toast.success('Bet placed successfully!');
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['bets', newBet.leagueId] });
            queryClient.invalidateQueries({ queryKey: ['bets', newBet.leagueId, 'me'] });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to place bet');
        },
    });
}

export function useRemoveBet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (betId: string) => {
            await api.delete(`/bets/${betId}`);
            return betId;
        },
        onSuccess: () => {
            toast.success('Bet removed!');
            // We need to know leagueId to invalidate widely, but we might not have it here easily
            // unless we pass it. For now, invalidate all 'bets' queries
            queryClient.invalidateQueries({ queryKey: ['bets'] });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to remove bet');
        },
    });
}
