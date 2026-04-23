'use client';

import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import type { KindeUser } from '@kinde-oss/kinde-auth-nextjs/types';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { OpenAPI } from '@/src/api/generated/core/OpenAPI';

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:3000';

// Mutable cell holding the latest Kinde access token. The OpenAPI client's
// resolver reads this cell every time it builds a request. Writes happen
// during AuthProvider's render — see comment on AuthProvider for why.
let currentAccessToken: string | null = null;

// Configure the generated OpenAPI client once on module load. Base URL is safe
// to set here because it only depends on a build-time env var.
OpenAPI.BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? DEFAULT_API_BASE_URL;
OpenAPI.WITH_CREDENTIALS = false;
OpenAPI.TOKEN = async () => currentAccessToken ?? '';

type AuthState = {
  user: KindeUser<Record<string, string>> | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
};

const DEFAULT_AUTH_STATE: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  token: null,
};

// Single source of truth for Kinde session state. We MUST NOT let multiple
// `useKindeBrowserClient()` calls sprinkle around the tree: in providerless
// mode each call owns its own state + its own `/api/auth/setup` fetch, so the
// dashboard's hook can resolve its token before AuthProvider's does, fire a
// request, and race us into sending an empty Authorization header. Putting
// the one hook behind context eliminates the race.
const AuthContext = createContext<AuthState>(DEFAULT_AUTH_STATE);

/**
 * Read the Kinde session. Must be called under <AuthProvider/>. Any component
 * that renders inside AuthProvider will observe the same token the provider
 * saw at the same render, so no per-component session race.
 */
export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/**
 * Owns the single Kinde hook, publishes via context, and keeps the generated
 * OpenAPI client's bearer token in sync. Mount once near the top of the tree.
 *
 * IMPORTANT: we write `currentAccessToken` during *render*, not in useEffect.
 * React renders top-down but runs passive effects child-first, so effect
 * writes would let a descendant's effect fire its fetch — and the OpenAPI
 * resolver read the stale token — before our effect ever ran. The render-time
 * write is an idempotent assignment of a value derived purely from hook state,
 * which is safe under React's render semantics.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user,
    isAuthenticated,
    isLoading,
    accessTokenRaw,
  } = useKindeBrowserClient();

  const token = accessTokenRaw ?? null;
  currentAccessToken = token;

  const value = useMemo<AuthState>(
    () => ({
      user: user ?? null,
      isAuthenticated: Boolean(isAuthenticated),
      isLoading: Boolean(isLoading),
      token,
    }),
    [user, isAuthenticated, isLoading, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
