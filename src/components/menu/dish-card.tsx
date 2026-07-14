"use client";

import { DishImage } from "@/components/dish-image";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import { Minus, Plus, ShoppingCart } from "lucide-react";

/** Карточка блюда в каталоге меню с контролом корзины. */
export function DishCard({ item }: { item: MenuItem }) {
  const { add, setQuantity, quantityOf } = useCart();
  const qty = quantityOf(item.id);

  return (
    <Card className="flex flex-col">
      <DishImage
        src={item.image_url}
        alt={item.name}
        className="aspect-[4/3] w-full"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      />
      <CardBody className="flex flex-1 flex-col gap-2">
        <h3 className="font-heading text-lg font-bold leading-snug">
          {item.name}
        </h3>
        <p className="text-sm text-muted">{item.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="font-heading text-xl font-extrabold">
            {formatPrice(item.price)}
          </span>
          {qty === 0 ? (
            <Button
              size="sm"
              onClick={() => add(item)}
              aria-label={`Добавить «${item.name}» в корзину`}
            >
              <ShoppingCart className="size-4" aria-hidden />
              В корзину
            </Button>
          ) : (
            <div className="flex h-9 items-center rounded-btn border border-line bg-surface-2">
              <button
                type="button"
                onClick={() => setQuantity(item.id, qty - 1)}
                className="flex h-full w-9 cursor-pointer items-center justify-center text-muted transition-colors hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                aria-label={`Убрать одну порцию «${item.name}»`}
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <span className="min-w-7 text-center font-heading text-sm font-bold">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(item.id, qty + 1)}
                className="flex h-full w-9 cursor-pointer items-center justify-center text-muted transition-colors hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                aria-label={`Добавить ещё одну порцию «${item.name}»`}
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
