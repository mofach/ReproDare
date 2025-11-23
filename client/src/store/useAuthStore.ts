import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tipe user sesuai respons backend (biasanya dari decode token/login response)
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: (user, token) => {
        localStorage.setItem('token', token); // Simpan token terpisah untuk axios
        set({ user, token });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },

      isAuthenticated: () => {
        return !!get().token;
      },
    }),
    {
      name: 'user-storage', // Data user tetap ada walau di-refresh
    }
  )
);