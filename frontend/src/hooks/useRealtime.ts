import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

type RealtimeOptions = {
    table: string;
    schema?: string;
    event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
    filter?: string;
    queryKey?: string[]; // queryKey to invalidate
};

export function useRealtime({
    table,
    schema = 'public',
    event = '*',
    filter,
    queryKey,
}: RealtimeOptions) {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel(`realtime:${schema}:${table}:${filter || 'all'}`)
            .on(
                'postgres_changes',
                {
                    event,
                    schema,
                    table,
                    filter,
                },
                (payload) => {
                    // Invalidate react-query cache if queryKey provided
                    if (queryKey) {
                        queryClient.invalidateQueries({ queryKey });
                    }

                    // Optional: Validation toast for verifying live updates (can be removed later)
                    console.log('Realtime update received:', payload);
                    // toast.info(`Update received on ${table}`); 
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Subscribed to realtime channel for ${table}`);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, schema, event, filter, queryKey, queryClient]);
}
