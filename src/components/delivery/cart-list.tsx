"use client";

import { DishImage } from "@/components/dish-image";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { Minus, Plus, Trash2 } from "lucide-react";

const stepBtn =
  "flex size-8 items-center justify-center rounded-btn border border-line bg-surface-2 " +
  "text-white transition-colors hover:border-white/40 cursor-pointer " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** Состав заказа: строки позиций со степпером количества и итогом. */
export function CartList() {
  const { items, total, setQuantity, remove } = useCart();

  return (
    <div>
      <ul className="space-y-3">
        {items.map(({ item, quantity }) => (
          <li
            key={item.id}
            className="rounded-card bg-surface border border-line p-4"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                <DishImage
                  src={item.image_url}
                  alt={item.name}
                  className="size-16 shrink-0 rounded-btn overflow-hidden"
                  sizes="64px"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.name}</p>
                  <p className="text-sm text-muted">
                    {formatPrice(item.price)} / шт.
                  </p>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className={stepBtn}
                    onClick={() => setQuantity(item.id, quantity - 1)}
                    aria-label={`Убавить «${item.name}»`}
                  >
                    <Minus className="size-4" aria-hidden />
                  </button>
                  <span className="w-8 text-center font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className={stepBtn}
                    onClick={() => setQuantity(item.id, quantity + 1)}
                    aria-label={`Добавить «${item.name}»`}
                  >
                    <Plus className="size-4" aria-hidden />
                  </button>
                </div>

                <span className="w-24 text-right font-semibold tabular-nums">
                  {formatPrice(item.price * quantity)}
                </span>

                <button
                  type="button"
                  className="text-muted transition-colors hover:text-primary cursor-pointer"
                  onClick={() => remove(item.id)}
                  aria-label={`Удалить «${item.name}» из корзины`}
                >
                  <Trash2 className="size-5" aria-hidden />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
        <span className="text-lg text-muted">Итого:</span>
        <span className="font-heading text-2xl font-extrabold sm:text-3xl">
          {formatPrice(total)}
        </span>
      </div>
    </div>
  );
}
