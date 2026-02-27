import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserProfile = {
    id: string;
    email?: string;
    name?: string;
    picture?: string;
    authProvider: 'google' | 'supabase' | null;
};

interface AuthState {
    user: UserProfile | null;
    isAuthenticated: boolean;
    login: (user: UserProfile) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            login: (user) => set({ user, isAuthenticated: true }),
            logout: () => set({ user: null, isAuthenticated: false }),
        }),
        {
            name: 'aagam-auth-storage', // unique name for localStorage key
        }
    )
);
