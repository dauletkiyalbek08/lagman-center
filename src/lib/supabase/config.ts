const RAW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const RAW_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Секретный ключ (`sb_secret_…` / `service_role`) в NEXT_PUBLIC_-переменной —
 * это утечка: всё с префиксом NEXT_PUBLIC_ попадает в JS, который скачивает
 * любой посетитель, а такой ключ обходит RLS и открывает всю базу на запись.
 * Supabase сам отклоняет его из браузера, поэтому сайт молча уходил бы в
 * демо-режим — лучше сказать об этом громко и не использовать ключ вовсе.
 */
const isSecretKey =
  RAW_KEY.startsWith("sb_secret_") || RAW_KEY.includes("service_role");

if (isSecretKey && typeof console !== "undefined") {
  console.error(
    "[Lagman Center] В NEXT_PUBLIC_SUPABASE_ANON_KEY лежит СЕКРЕТНЫЙ ключ. " +
      "Немедленно отзовите его в Supabase (Project Settings → API Keys) и " +
      "подставьте публикуемый ключ (anon / sb_publishable_…). " +
      "Сейчас сайт работает в демо-режиме, база не подключена.",
  );
}

export const SUPABASE_URL = RAW_URL;
export const SUPABASE_ANON_KEY = isSecretKey ? "" : RAW_KEY;

/**
 * Supabase подключается через .env.local (см. README-SETUP.md).
 * Пока ключей нет, сайт работает в демо-режиме: меню берётся из сида,
 * заказы/брони живут в localStorage и синхронизируются между вкладками
 * через BroadcastChannel — панели персонала можно демонстрировать без бэкенда.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
