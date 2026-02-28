import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface UpdateFightResultDTO {
    winnerId?: string | null;
    method?: string | null;
    round?: number | null;
}

export function useUpdateFightResult() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ fightId, data }: { fightId: string; data: UpdateFightResultDTO }) => {
            const response = await api.patch(`/fights/${fightId}/result`, data);
            return response.data;
        },
        onSuccess: () => {
            toast.success("Fight result saved");
            // Invalidate queries to refresh UI
            queryClient.invalidateQueries({ queryKey: ["events"] });
            queryClient.invalidateQueries({ queryKey: ["leagues"] }); // To refresh standings
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            toast.error("Failed to update result: " + (error.response?.data?.message || error.message));
        },
    });
}
