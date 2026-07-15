"use client";

import { cn } from "@/lib/cn";
import { fetchPromoBanner, subscribePromoBanner } from "@/lib/data";
import type { PromoAccent, PromoBanner as Promo } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

/** Стили под повод: рамка, фон-подсветка, плитка с эмодзи и кнопка. */
const ACCENT: Record<
  PromoAccent,
  { card: string; tile: string; btn: string }
> = {
  red: {
    card: "border-primary/40 from-primary/15",
    tile: "bg-primary/15 text-primary",
    btn: "bg-primary text-white hover:bg-primary/90",
  },
  amber: {
    card: "border-amber-500/40 from-amber-500/15",
    tile: "bg-amber-500/15 text-amber-400",
    btn: "bg-amber-500 text-black hover:bg-amber-400",
  },
  emerald: {
    card: "border-emerald-500/40 from-emerald-500/15",
    tile: "bg-emerald-500/15 text-emerald-400",
    btn: "bg-emerald-500 text-black hover:bg-emerald-400",
  },
};

/**
 * Внешний вид баннера по данным (без загрузки). Используется и на главной,
 * и как живое превью в админ-панели. `preview` отключает ссылку кнопки.
 */
export function PromoBannerView({
  promo,
  preview = false,
}: {
  promo: Promo;
  preview?: boolean;
}) {
  const a = ACCENT[promo.accent] ?? ACCENT.red;
  const hasCta = promo.cta_label.trim() && promo.cta_href.trim();
  const external = /^https?:\/\//i.test(promo.cta_href);
  const btnClass = cn(
    "inline-flex shrink-0 items-center justify-center rounded-btn px-5 py-2.5 text-sm font-bold transition-colors",
    a.btn,
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-card border bg-gradient-to-r to-transparent p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6",
        a.card,
      )}
    >
      {promo.emoji.trim() && (
        <div
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-card text-3xl",
            a.tile,
          )}
          aria-hidden
        >
          {promo.emoji}
        </div>
      )}

      <div className="min-w-0 flex-1">
        {promo.title.trim() && (
          <p className="font-heading text-xl font-extrabold uppercase leading-tight tracking-tight sm:text-2xl">
            {promo.title}
          </p>
        )}
        {promo.body.trim() && (
          <p className="mt-1.5 text-sm text-muted sm:text-base">{promo.body}</p>
        )}
      </div>

      {hasCta &&
        (preview ? (
          <span className={btnClass}>{promo.cta_label}</span>
        ) : external ? (
          <a
            href={promo.cta_href}
            target="_blank"
            rel="noopener noreferrer"
            className={btnClass}
          >
            {promo.cta_label}
          </a>
        ) : (
          <Link href={promo.cta_href} className={btnClass}>
            {promo.cta_label}
          </Link>
        ))}
    </div>
  );
}

/**
 * Рекламный баннер на главной (акция / праздник / комбо). Его включает и
 * редактирует админ в панели; клиент видит только когда баннер активен.
 */
export function PromoBanner() {
  const [promo, setPromo] = useState<Promo | null>(null);

  useEffect(() => {
    const load = () => {
      fetchPromoBanner()
        .then(setPromo)
        .catch(() => setPromo(null));
    };
    load();
    return subscribePromoBanner(load);
  }, []);

  // Пока грузится, выключен или пустой — ничего не показываем
  if (!promo || !promo.is_active || (!promo.title.trim() && !promo.body.trim())) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6">
      <PromoBannerView promo={promo} />
    </section>
  );
}
