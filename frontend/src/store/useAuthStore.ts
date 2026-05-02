import { create } from 'zustand';

interface User {
    id: string;
    username: string;
    email: string;
    avatar: string | null;
    bio: string | null;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    setAccessToken: (token: string | null) => void;
    logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    setAccessToken: (token) => set({ accessToken: token }),
    logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
}));

export default useAuthStore;
