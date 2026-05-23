const API_BASE_URL = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const api = {
    auth: {
        login: `${API_BASE_URL}/api/auth/login`,
        register: `${API_BASE_URL}/api/auth/register`,
        checkEmail: (email: string) => `${API_BASE_URL}/api/auth/check-email?email=${encodeURIComponent(email)}`,
        refresh: `${API_BASE_URL}/api/auth/refresh`,
    },
    user: `${API_BASE_URL}/api/user`,
    activity: {
        logs: `${API_BASE_URL}/api/activity/logs`,
        dismissAlert: `${API_BASE_URL}/api/activity/dismiss-alert`,
    },
};