// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, authApi, type PublicUser } from './api';
import { clearTokens, getAccessToken, setTokens, subscribe } from './token-store';

export const AUTH_ME_KEY = ['auth', 'me'] as const;

export function useAuth() {
  const queryClient = useQueryClient();

  const query = useQuery<PublicUser | null>({
    queryKey: AUTH_ME_KEY,
    queryFn: async () => {
      if (!getAccessToken()) return null;
      try {
        return (await authApi.me()).user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          return null;
        }
        throw err;
      }
    },
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => subscribe(() => { void queryClient.invalidateQueries({ queryKey: AUTH_ME_KEY }); }), [queryClient]);

  async function login(email: string, password: string): Promise<PublicUser> {
    const r = await authApi.login({ email, password });
    setTokens(r);
    queryClient.setQueryData(AUTH_ME_KEY, r.user);
    return r.user;
  }

  async function register(input: { email: string; password: string; name?: string }): Promise<PublicUser> {
    const r = await authApi.register(input);
    setTokens(r);
    queryClient.setQueryData(AUTH_ME_KEY, r.user);
    return r.user;
  }

  function logout(): void {
    clearTokens();
    queryClient.setQueryData(AUTH_ME_KEY, null);
  }

  async function logoutEverywhere(): Promise<void> {
    try { await authApi.logoutAll(); } finally { logout(); }
  }

  return {
    user: query.data ?? null,
    isLoading: query.isPending,
    isAuthenticated: Boolean(query.data),
    login,
    register,
    logout,
    logoutEverywhere,
    refetch: query.refetch,
  };
}
// ─── @octiq-extend ─── your code below this line ───
