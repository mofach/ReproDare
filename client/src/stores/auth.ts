// client/src/stores/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type User = {
  id: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'teacher' | 'student' | string;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setTokens: (accessToken: string | null, refreshToken: string | null, user: User | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (accessToken, refreshToken, user) => set({ accessToken, refreshToken, user }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'reprodare-auth',
      partialize: (state) => ({ accessToken: state.accessToken, refreshToken: state.refreshToken, user: state.user }),
    }
  )
);

// helpers for non-hook modules (api.ts)
export function getAuthState() {
  const s = useAuthStore.getState();
  return { accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user };
}

export function setAuthState(payload: Partial<{ accessToken: string | null; refreshToken: string | null; user: User | null }>) {
  const s = useAuthStore.getState();
  s.setTokens(payload.accessToken ?? null, payload.refreshToken ?? null, payload.user ?? null);
}
