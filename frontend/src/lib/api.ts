import axios from 'axios';
import { supabase } from './supabase';
import { toast } from 'sonner';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Inject Supabase Token
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    } else {
        // console.warn("Request Interceptor: No session found for", config.url);
    }
    return config;
});

// Response Interceptor: Handle 401 (Auto-refresh)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Check if error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError || !session) {
                // Refresh failed
                return Promise.reject(error);
            }

            // Retry with new token
            originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
            return api(originalRequest);
        }

        // Global Error Handling
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message || "An unexpected error occurred";

        if (!status) {
            // Network Error
            toast.error("Network Error: Please check your connection.");
        } else if (status >= 500) {
            // Server Error
            toast.error(`Server Error: ${message}`);
        }
        // 4xx errors are typically handled by the calling component (e.g. form validation)

        return Promise.reject(error);
    }
);
