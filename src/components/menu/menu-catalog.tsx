"use client";

import { CartBar } from "@/components/menu/cart-bar";
import {
  CategoryChips,
  categoryAnchorId,
} from "@/components/menu/category-chips";
import { DishCard } from "@/components/menu/dish-card";
import { SectionHeading } from "@/components/section-heading";
import { PageLoader } from "@/components/ui/spinner";
import { fetchMenuItems, subscribeMenu } from "@/lib/data";
import { MENU_CATEGORIES } from "@/lib/seed-data";
import type { MenuItem } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

interface CategoryGroup {
  category: string;
  items: MenuItem[];
}

/**
 * Группирует доступные блюда по категориям. Порядок — как в
 * MENU_CATEGORIES, неизвестные категории идут в конец.
 */
function groupByCategory(items: MenuItem[]): CategoryGroup[] {
  const map = new Map<string, MenuItem[]>();
  for (const item of items) {
    if (!item.is_available) continue;
    const list = map.get(item.category);
    if (list) list.push(item);
    else map.set(item.category, [item]);
  }
  const known: string[] = MENU_CATEGORIES.filter((c) => map.has(c));
  const unknown = [...map.keys()].filter(
    (c) => !(MENU_CATEGORIES as readonly string[]).includes(c),
  );
  return [...known, ...unknown].map((category) => ({
    category,
    items: map.get(category)!,
  }));
}

/** Клиентский каталог меню: лента категорий, секции блюд, панель корзины. */
export function MenuCatalog() {
  const [items, setItems] = useState<MenuItem[] | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      fetchMenuItems().then((data) => {
        if (active) setItems(data);
      });
    };
    load();
    const unsubscribe = subscribeMenu(load);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const groups = useMemo(() => groupByCategory(items ?? []), [items]);

  return (
    <div className="pb-28">
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <SectionHeading pre="НАШЕ" accent="МЕНЮ" className="mb-3" />
        <p className="mb-6 max-w-2xl text-muted">
          Готовим по-домашнему: лагман ручной вытяжки, шашлык на углях и
          горячая выпечка из тандыра. Всё меню — халяль.
        </p>
      </div>

      {items === null ? (
        <PageLoader label="Загружаем меню…" />
      ) : (
        <>
          <CategoryChips categories={groups.map((g) => g.category)} />
          <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6">
            {groups.map((group) => (
              <section
                key={group.category}
                id={categoryAnchorId(group.category)}
                className="scroll-mt-36"
              >
                <h2 className="mb-5 font-heading text-xl font-extrabold uppercase tracking-tight sm:text-2xl">
                  {group.category}
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.items.map((item) => (
                    <DishCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
            {groups.length === 0 && (
              <p className="py-16 text-center text-muted">
                Меню пока пустое — загляните чуть позже.
              </p>
            )}
          </div>
        </>
      )}

      <CartBar />
    </div>
  );
}
