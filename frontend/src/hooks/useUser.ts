import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface AppUser {
    id: string;
    email: string;
    username: string;
}

export function useMe() {
    return useQuery({
        queryKey: ["users", "me"],
        queryFn: async () => {
            const { data } = await api.get<AppUser>("/users/me");
            return data;
        },
    });
}

export function useUpdateDisplayName() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (username: string) => {
            const { data } = await api.patch<AppUser>("/users/me", { username });
            return data;
        },
        onSuccess: () => {
            toast.success("Display name updated!");
            // Invalidate user + all league data (standings show the name)
            queryClient.invalidateQueries({ queryKey: ["users", "me"] });
            queryClient.invalidateQueries({ queryKey: ["leagues"] });
        },
        onError: () => {
            toast.error("Failed to update display name");
        },
    });
}
