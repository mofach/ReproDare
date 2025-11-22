// client/src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import api from '../lib/api';
import { useAuthStore } from '../stores/auth';

type LocationState = { from?: { pathname?: string } };

export default function LoginPage(): React.ReactElement {
  const [email, setEmail] = useState(''); // remove hardcoded creds
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const setTokens = useAuthStore((s) => s.setTokens);
  const navigate = useNavigate();
  const loc = useLocation();
  const state = (loc.state || {}) as LocationState;
  const from = state.from?.pathname ?? '/';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const data = res.data;
      if (data?.accessToken) {
        setTokens(data.accessToken, data.refreshToken ?? null, data.user ?? null);
        const role = (data.user?.role ?? '').toLowerCase();
        if (role === 'teacher' || role === 'admin') navigate('/teacher', { replace: true });
        else if (role === 'student') navigate('/student', { replace: true });
        else navigate(from, { replace: true });
      } else {
        setErr('Unexpected response from server');
      }
    } catch (error: unknown) {
      // prefer axios friendly handling without 'any'
      let msg = 'Login failed';
      if (axios.isAxiosError(error)) {
        msg = (error.response?.data?.error as string) ?? error.message ?? msg;
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white shadow-md rounded p-6">
        <h2 className="text-2xl font-semibold mb-4">Sign in</h2>
        {err && <div className="text-sm text-red-600 mb-3">{err}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 text-white py-2 rounded hover:bg-sky-700 disabled:opacity-60"
          >
            {loading ? 'Signing...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
