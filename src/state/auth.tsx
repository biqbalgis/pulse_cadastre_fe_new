import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { fetchCurrentUser, login as apiLogin, logout as apiLogout } from "@/api/auth";
import { AUTH_EXPIRED_EVENT, tokenStore } from "@/api/client";
import type { UserInfo } from "@/api/types";
import { PORTALS, type PortalKey } from "@/portals";

type AuthState = {
  user: UserInfo | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<UserInfo>;
  logout: () => void;
  canAccess: (portal: PortalKey) => boolean;
};

const AuthContext = createContext<AuthState | null>(null);

const ROLE_ALIASES: Record<string, string> = {
  request_initiator: "district_manager",
  manager: "vendor_manager",
  editor: "data_editor",
  reviewer: "data_reviewer",
};

export function canonicalRoles(user: UserInfo | null): Set<string> {
  return new Set((user?.roles ?? []).map((r) => ROLE_ALIASES[r.trim().toLowerCase()] ?? r.trim().toLowerCase()));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (tokenStore.getAccess() || tokenStore.getRefresh()) {
        try {
          const me = await fetchCurrentUser();
          if (!cancelled) setUser(me);
        } catch {
          tokenStore.clear();
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const info = await apiLogin(username, password);
    // user_info carries the full profile (AOI, vendor); fall back to the login payload.
    const me = await fetchCurrentUser().catch(() => info);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  const canAccess = useCallback(
    (portal: PortalKey) => {
      if (!user) return false;
      if (user.is_superuser) return true;
      const roles = canonicalRoles(user);
      return PORTALS[portal].roles.some((r) => roles.has(r));
    },
    [user],
  );

  const value = useMemo(() => ({ user, ready, login, logout, canAccess }), [user, ready, login, logout, canAccess]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
