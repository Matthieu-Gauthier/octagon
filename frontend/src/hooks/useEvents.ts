import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Event } from '../types/api';

export function useEvents() {
    return useQuery({
        queryKey: ['events'],
        queryFn: async () => {
            const { data } = await api.get<Event[]>('/events');
            return data;
        },
    });
}

export function useEvent(id: string) {
    return useQuery({
        queryKey: ['events', id],
        queryFn: async () => {
            const { data } = await api.get<Event>(`/events/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useFetchNextEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { data } = await api.post('/events/admin/fetch');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });
}

export function useRemoveEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/events/admin/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });
}
