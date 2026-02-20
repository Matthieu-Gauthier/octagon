import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useGameRealtime(leagueId?: string) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!leagueId) {
            return;
        }

        let pollingInterval: NodeJS.Timeout;

        const startPolling = () => {
            if (pollingInterval) return;
            // console.log('[Realtime] Falling back to polling due to connection failure');


            // Initial fetch immediately
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['leagues', leagueId, 'standings'] });
            queryClient.invalidateQueries({ queryKey: ['bets', leagueId] });

            pollingInterval = setInterval(() => {
                // console.log('[Realtime] Polling for updates...');

                queryClient.invalidateQueries({ queryKey: ['events'] });
                queryClient.invalidateQueries({ queryKey: ['leagues', leagueId, 'standings'] });
                queryClient.invalidateQueries({ queryKey: ['bets', leagueId] });
            }, 5000); // Poll every 5 seconds
        };

        const channel = supabase
            .channel('game-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'fights' },
                (_payload) => {

                    // Update events/fights cache
                    queryClient.invalidateQueries({ queryKey: ['events'] });
                    // Also update standings if leagueId is present
                    queryClient.invalidateQueries({ queryKey: ['leagues', leagueId, 'standings'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'bets', filter: `leagueId=eq.${leagueId}` },
                (_payload) => {

                    // Update bets cache
                    queryClient.invalidateQueries({ queryKey: ['bets', leagueId] });
                }
            )
            .subscribe((status, _err) => {
                // console.log(`[Realtime] Subscription status: ${status}`, err ? err : '');


                if (status === 'SUBSCRIBED') {
                    // console.log('[Realtime] Connected to Game Realtime');

                    if (pollingInterval) {
                        clearInterval(pollingInterval);
                        // @ts-ignore
                        pollingInterval = undefined; // Clear the reference
                    }
                }
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    startPolling();
                }
            });

        return () => {
            // console.log('[Realtime] Unsubscribing');

            supabase.removeChannel(channel);
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [leagueId, queryClient]);
}
