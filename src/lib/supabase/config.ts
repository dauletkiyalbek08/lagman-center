export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Supabase подключается через .env.local (см. README-SETUP.md).
 * Пока ключей нет, сайт работает в демо-режиме: меню берётся из сида,
 * заказы/брони живут в localStorage и синхронизируются между вкладками
 * через BroadcastChannel — панели персонала можно демонстрировать без бэкенда.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
