"use client";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Info } from "lucide-react";

/**
 * Показывается, пока Supabase не подключён: сайт работает на локальных
 * демо-данных (localStorage + синхронизация вкладок через BroadcastChannel).
 */
export function DemoBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-card border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        <span className="font-semibold">Демо-режим.</span> Supabase не
        подключён: заказы и брони сохраняются локально в этом браузере, а
        «реальное время» работает между вкладками. Откройте панель и сайт в
        соседних вкладках, чтобы увидеть живое обновление. Подключение
        описано в{" "}
        <code className="rounded bg-black/30 px-1 py-0.5 text-xs">
          README-SETUP.md
        </code>
        .
      </p>
    </div>
  );
}
