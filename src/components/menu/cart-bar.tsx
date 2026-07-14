"use client";

import { buttonClasses } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { useMounted } from "@/lib/use-mounted";
import Link from "next/link";

/**
 * Плавающая панель корзины внизу экрана. Рендерится только после
 * монтирования, чтобы не было расхождения гидрации (корзина живёт
 * в localStorage).
 */
export function CartBar() {
  const { count, total } = useCart();
  const mounted = useMounted();

  if (!mounted || count === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-xl sm:gap-4 sm:px-5">
      <span className="whitespace-nowrap font-heading text-sm font-bold sm:text-base">
        {count} поз. · {formatPrice(total)}
      </span>
      <Link href="/delivery" className={buttonClasses("primary", "sm")}>
        Оформить заказ
      </Link>
    </div>
  );
}
