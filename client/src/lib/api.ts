// client/src/lib/api.ts
import axios, { type AxiosInstance, type AxiosError, type AxiosRequestConfig } from 'axios';
import { getAuthState, setAuthState, type User } from '../stores/auth';

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

type OriginalRequest = AxiosRequestConfig & { _retry?: boolean };

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

function createApi(): AxiosInstance {
  const instance = axios.create({
    baseURL: BASE,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false,
  });

  instance.interceptors.request.use((config) => {
    const { accessToken } = getAuthState();
    if (accessToken && config.headers) {
      (config.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    async (err) => {
      // Narrow to AxiosError
      if (!axios.isAxiosError(err)) {
        return Promise.reject(err);
      }

      const error = err as AxiosError<unknown, unknown>;
      const original = (error.config as OriginalRequest | undefined) ?? undefined;
      if (!original) return Promise.reject(error);

      const status = error.response?.status;
      if (status === 401 && !original._retry) {
        original._retry = true;

        const { refreshToken } = getAuthState();
        if (!refreshToken) {
          setAuthState({ accessToken: null, refreshToken: null, user: null });
          return Promise.reject(error);
        }

        try {
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = fetchRefreshToken(refreshToken);
          }
          const newToken = await refreshPromise;
          isRefreshing = false;
          refreshPromise = null;

          if (newToken) {
            if (!original.headers) original.headers = {};
            (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
            return instance(original);
          } else {
            setAuthState({ accessToken: null, refreshToken: null, user: null });
            return Promise.reject(error);
          }
        } catch (e) {
          isRefreshing = false;
          refreshPromise = null;
          setAuthState({ accessToken: null, refreshToken: null, user: null });
          return Promise.reject(e);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

/**
 * Safely parse backend response for tokens and user.
 * Validate minimal user shape before assigning to store.
 */
async function fetchRefreshToken(refreshToken: string): Promise<string | null> {
  try {
    const r = await axios.post(`${BASE}/auth/refresh`, { refreshToken });
    const data = r.data as Record<string, unknown> | undefined;

    const accessToken = typeof data?.accessToken === 'string' ? data.accessToken : undefined;
    const newRefresh = typeof data?.refreshToken === 'string' ? data.refreshToken : refreshToken;

    let user: User | null = null;
    if (data?.user && typeof data.user === 'object' && data.user !== null) {
      const u = data.user as Record<string, unknown>;
      // minimal validation: must have id
      if (u.id !== undefined && u.id !== null) {
        user = {
          id: String(u.id),
          name: typeof u.name === 'string' ? u.name : undefined,
          email: typeof u.email === 'string' ? u.email : undefined,
          role: typeof u.role === 'string' ? (u.role as User['role']) : undefined,
        };
      }
    }

    if (accessToken) {
      setAuthState({
        accessToken,
        refreshToken: newRefresh,
        user,
      });
      return accessToken;
    }

    return null;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error('refresh token failed', err.response?.data ?? err.message);
    } else {
      console.error('refresh token failed', err);
    }
    return null;
  }
}

export const api = createApi();
export default api;
