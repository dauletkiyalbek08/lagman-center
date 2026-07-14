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
import { formatPhone, loginToEmail, phoneToEmail } from "./phone";
import { getSupabaseBrowser } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/config";
import type { Profile } from "./types";

export interface SignUpInput {
  /** Номер в нормализованном виде: 77071234567 */
  phone: string;
  password: string;
  name: string;
  address: string;
}

interface AuthContextValue {
  /** true, пока Supabase не подключён — панели открыты в демо-режиме */
  demo: boolean;
  loading: boolean;
  user: User | null;
  profile: Profile | null;
  /** login — номер телефона клиента или email сотрудника */
  signIn: (login: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
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
        .select("id, role, name, phone, address")
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

  const signIn = useCallback(async (login: string, password: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) throw new Error("Supabase не подключён (демо-режим)");
    const email = loginToEmail(login);
    if (!email) throw new Error("Проверьте номер телефона");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(translateAuthError(error.message));
  }, []);

  /**
   * Регистрация клиента идёт через RPC, а не supabase.auth.signUp():
   * GoTrue считает логин почтой и пытается отправить письмо подтверждения
   * на несуществующий адрес 7707…@phone.lagmancenter.kz. Письмо не доходит,
   * сессию он не выдаёт, а почтовый лимит проекта выгорает впустую.
   * Функция register_customer заводит учётку прямо в базе (почта сразу
   * подтверждена), а сессию мы получаем обычным входом по паролю.
   */
  const signUp = useCallback(async (input: SignUpInput) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) throw new Error("Supabase не подключён (демо-режим)");

    // Номер отдаём в человеческом виде: функция сама вытащит из него цифры
    // для логина, а в профиль запишет как есть — курьеру звонить по нему
    const { error } = await supabase.rpc("register_customer", {
      p_phone: formatPhone(input.phone),
      p_password: input.password,
      p_name: input.name,
      p_address: input.address,
    });
    if (error) throw new Error(translateAuthError(error.message));

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(input.phone),
      password: input.password,
    });
    if (signInError) throw new Error(translateAuthError(signInError.message));
  }, []);

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
    [/invalid login credentials/i, "Неверный логин или пароль"],
    [/user already registered/i, "Этот номер уже зарегистрирован — войдите"],
    [/password should be at least/i, "Пароль должен быть не короче 6 символов"],
    [/email not confirmed/i, "Подтвердите email по ссылке из письма"],
    [/unable to validate email/i, "Некорректный логин"],
    [/email address .* is invalid/i, "Некорректный логин"],
  ];
  for (const [re, ru] of map) {
    if (re.test(message)) return ru;
  }
  return message;
}
