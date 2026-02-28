import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { League } from "@/types/api";
import { toast } from "sonner";
import { useRealtimeStore } from "@/stores/realtimeStore";

export function useLeagues() {
    return useQuery({
        queryKey: ["leagues"],
        queryFn: async () => {
            const { data } = await api.get<League[]>("/leagues");
            return data;
        },
    });
}

export function useLeague(id: string) {
    const isConnected = useRealtimeStore(s => s.isConnected);
    return useQuery({
        queryKey: ["leagues", id],
        queryFn: async () => {
            const { data } = await api.get<League>(`/leagues/${id}`);
            return data;
        },
        enabled: !!id,
        refetchInterval: isConnected ? 0 : 5000,
    });
}

export function useCreateLeague() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { name: string; survivorEnabled: boolean }) => {
            const { data } = await api.post<League>("/leagues", payload);
            return data;
        },
        onSuccess: (_data) => {
            toast.success("League created successfully!");
            queryClient.invalidateQueries({ queryKey: ["leagues"] });
            // Optionally update cache directly if needed
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create league");
        }
    });
}

export function useJoinLeague() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (code: string) => {
            const { data } = await api.post<League>("/leagues/join", { code });
            return data;
        },
        onSuccess: () => {
            toast.success("Joined league!");
            queryClient.invalidateQueries({ queryKey: ["leagues"] });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to join league");
        }
    });
}

export function useLeagueStandings(id: string) {
    const isConnected = useRealtimeStore(s => s.isConnected);
    return useQuery({
        queryKey: ["leagues", id, "standings"],
        queryFn: async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data } = await api.get<any[]>(`/leagues/${id}/standings`);
            return data;
        },
        enabled: !!id,
        refetchInterval: isConnected ? 0 : 5000,
    });
}
