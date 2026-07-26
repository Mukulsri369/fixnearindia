import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { ensureProfile, getRole } from "../services/profiles.js";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. listener first, so no auth event is missed
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession?.user) setRole(null);
    });

    // 2. then read the persisted session
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // make sure a profile + role row exists, then cache the role
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        await ensureProfile(user);
        const nextRole = await getRole(user.id);
        if (mounted) setRole(nextRole);
      } catch (error) {
        console.error("Auth bootstrap failed:", error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  const value = useMemo(
    () => ({
      session,
      user,
      role,
      isLoading,
      isAuthenticated: !!user,
      isTechnician: role === "technician",
      isAdmin: role === "admin",
      refreshRole: async () => {
        if (user) setRole(await getRole(user.id));
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setRole(null);
      },
    }),
    [session, user, role, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
