"use client";

import { DishImage } from "@/components/dish-image";
import { SectionHeading } from "@/components/section-heading";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useCart } from "@/lib/cart-context";
import { fetchMenuItems } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { POPULAR_ITEM_NAMES } from "@/lib/seed-data";
import type { MenuItem } from "@/lib/types";
import { Check, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * Выбирает популярные блюда по названиям из POPULAR_ITEM_NAMES (порядок важен).
 * Ненайденные позиции добираются первыми доступными блюдами — до 4 штук.
 */
function pickPopular(items: MenuItem[]): MenuItem[] {
  const available = items.filter((i) => i.is_available);
  const picked: MenuItem[] = [];
  for (const name of POPULAR_ITEM_NAMES) {
    const found = available.find(
      (i) => i.name.toLowerCase() === name.toLowerCase(),
    );
    if (found) picked.push(found);
  }
  for (const item of available) {
    if (picked.length >= 4) break;
    if (!picked.some((p) => p.id === item.id)) picked.push(item);
  }
  return picked.slice(0, 4);
}

function DishCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <div className="aspect-[4/3] w-full bg-surface-2" />
      <CardBody className="space-y-3">
        <div className="h-4 w-2/3 rounded bg-surface-2" />
        <div className="h-3 w-full rounded bg-surface-2" />
        <div className="h-8 w-1/2 rounded bg-surface-2" />
      </CardBody>
    </Card>
  );
}

/** Секция «Популярные блюда» с добавлением в корзину. */
export function PopularDishes() {
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const { add } = useCart();

  useEffect(() => {
    let cancelled = false;
    fetchMenuItems().then((menu) => {
      if (!cancelled) setItems(pickPopular(menu));
    });
    return () => {
      cancelled = true;
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleAdd = (item: MenuItem) => {
    add(item);
    setAddedId(item.id);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <SectionHeading
        pre="ПОПУЛЯРНЫЕ"
        accent="БЛЮДА"
        action={
          <Link href="/menu" className={buttonClasses("secondary", "sm")}>
            Смотреть всё меню
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items === null
          ? Array.from({ length: 4 }, (_, i) => <DishCardSkeleton key={i} />)
          : items.map((item) => (
              <Card key={item.id} className="flex flex-col">
                <DishImage
                  src={item.image_url}
                  alt={item.name}
                  className="aspect-[4/3] w-full"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <CardBody className="flex flex-1 flex-col gap-2">
                  <h3 className="font-heading font-bold uppercase tracking-tight">
                    {item.name}
                  </h3>
                  <p className="line-clamp-2 text-sm text-muted">
                    {item.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="font-heading text-lg font-extrabold">
                      {formatPrice(item.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdd(item)}
                      aria-label={`Добавить «${item.name}» в корзину`}
                      className="flex size-10 cursor-pointer items-center justify-center rounded-btn bg-primary text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {addedId === item.id ? (
                        <Check className="size-5" aria-hidden />
                      ) : (
                        <ShoppingCart className="size-5" aria-hidden />
                      )}
                    </button>
                  </div>
                </CardBody>
              </Card>
            ))}
      </div>
    </section>
  );
}
