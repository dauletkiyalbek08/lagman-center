"use client";

import { clearTableSession, useTableSession } from "@/lib/table-session";
import { useMounted } from "@/lib/use-mounted";
import { UtensilsCrossed, X } from "lucide-react";

/**
 * Плашка «вы за столом №N» — видна на всех страницах, пока гость
 * в режиме зала (после сканирования QR). Так человек всегда понимает,
 * куда уедет заказ: на кухню к его столу, а не курьеру.
 */
export function TableBanner() {
  const table = useTableSession();
  const mounted = useMounted();

  if (!mounted || !table) return null;

  return (
    <div className="border-b border-primary/30 bg-primary/10">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 text-sm sm:px-6">
        <UtensilsCrossed className="size-4 shrink-0 text-primary" aria-hidden />
        <p className="min-w-0 flex-1">
          <span className="font-semibold">Стол №{table.number}</span>
          <span className="text-muted"> · заказ подадут прямо к столу</span>
        </p>
        <button
          type="button"
          onClick={clearTableSession}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-btn px-2 py-1 text-xs text-muted transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="size-3.5" aria-hidden />
          Выйти из режима стола
        </button>
      </div>
    </div>
  );
}
