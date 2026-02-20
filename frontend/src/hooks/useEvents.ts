import { useQuery } from '@tanstack/react-query';
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
