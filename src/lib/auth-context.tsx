"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSupabaseBrowser } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/config";
import type { Profile } from "./types";

interface AuthContextValue {
  /** true, пока Supabase не подключён — панели открыты в демо-режиме */
  demo: boolean;
  loading: boolean;
  user: User | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    phone: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  /** id пользователя, для которого профиль (а значит и роль) уже загружен */
  const [resolvedFor, setResolvedFor] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    // счётчик защищает от гонки: ответ по старому пользователю не должен
    // перезаписать профиль нового (быстрый вход-выход-вход)
    let seq = 0;

    const loadProfile = async (u: User | null) => {
      const mySeq = ++seq;
      if (!u) {
        setProfile(null);
        setResolvedFor(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, role, name, phone")
        .eq("id", u.id)
        .maybeSingle();
      if (mySeq !== seq) return;
      setProfile((data as Profile) ?? null);
      setResolvedFor(u.id);
    };

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      loadProfile(data.user).finally(() => setAuthLoading(false));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      loadProfile(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Пока роль неизвестна, считаем, что грузимся: иначе StaffGuard успевает
  // показать сотруднику «Нет доступа» до того, как подтянется профиль.
  const loading = authLoading || Boolean(user && resolvedFor !== user.id);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) throw new Error("Supabase не подключён (демо-режим)");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(translateAuthError(error.message));
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string, phone: string) => {
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error("Supabase не подключён (демо-режим)");
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, phone } },
      });
      if (error) throw new Error(translateAuthError(error.message));
    },
    [],
  );

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      demo: !isSupabaseConfigured,
      loading,
      user,
      profile,
      signIn,
      signUp,
      signOut,
    }),
    [loading, user, profile, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function translateAuthError(message: string): string {
  const map: Array<[RegExp, string]> = [
    [/invalid login credentials/i, "Неверный email или пароль"],
    [/user already registered/i, "Пользователь с таким email уже зарегистрирован"],
    [/password should be at least/i, "Пароль должен быть не короче 6 символов"],
    [/email not confirmed/i, "Подтвердите email по ссылке из письма"],
    [/unable to validate email/i, "Некорректный email"],
  ];
  for (const [re, ru] of map) {
    if (re.test(message)) return ru;
  }
  return message;
}
