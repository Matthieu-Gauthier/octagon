import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Fighter } from '../types/api';

export function useFighters() {
    return useQuery({
        queryKey: ['fighters'],
        queryFn: async () => {
            const { data } = await api.get<Fighter[]>('/fighters');
            return data;
        },
    });
}

export function useFighter(id: string) {
    return useQuery({
        queryKey: ['fighters', id],
        queryFn: async () => {
            const { data } = await api.get<Fighter>(`/fighters/${id}`);
            return data;
        },
        enabled: !!id,
    });
}
