"use client";

import { DishImage } from "@/components/dish-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { deleteMenuItem, fetchMenuItems, saveMenuItem, subscribeMenu } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { MENU_CATEGORIES } from "@/lib/seed-data";
import type { MenuItem } from "@/lib/types";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { MenuItemForm } from "./menu-item-form";

export function MenuTab() {
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  const load = useCallback(() => {
    fetchMenuItems()
      .then(setItems)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const un = subscribeMenu(load);
    return un;
  }, [load]);

  if (!items) return <PageLoader label="Загружаем меню…" />;

  const toggleAvailable = async (item: MenuItem) => {
    setBusyId(item.id);
    try {
      await saveMenuItem({ ...item, is_available: !item.is_available });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось обновить блюдо");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item: MenuItem) => {
    if (!window.confirm(`Удалить блюдо «${item.name}»?`)) return;
    setBusyId(item.id);
    try {
      await deleteMenuItem(item.id);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось удалить блюдо");
    } finally {
      setBusyId(null);
    }
  };

  const categoryOrder = (c: string) => {
    const i = (MENU_CATEGORIES as readonly string[]).indexOf(c);
    return i === -1 ? MENU_CATEGORIES.length : i;
  };
  const sorted = [...items].sort(
    (a, b) =>
      categoryOrder(a.category) - categoryOrder(b.category) ||
      a.name.localeCompare(b.name, "ru"),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Всего блюд: {items.length} · в продаже:{" "}
          {items.filter((i) => i.is_available).length}
        </p>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden />
          Добавить блюдо
        </Button>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <ul className="divide-y divide-line">
          {sorted.map((item) => (
            <li
              key={item.id}
              className={cn(
                "flex flex-wrap items-center gap-x-4 gap-y-2 p-3 sm:flex-nowrap",
                !item.is_available && "opacity-60",
              )}
            >
              <DishImage
                src={item.image_url}
                alt={item.name}
                className="size-12 shrink-0 rounded-lg [&_svg]:size-5"
                sizes="48px"
              />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  <span className="truncate">{item.name}</span>
                  {!item.is_available && (
                    <Badge className="border-primary/30 bg-primary/10 text-primary">
                      Скрыто
                    </Badge>
                  )}
                </p>
                <p className="truncate text-xs text-muted">{item.category}</p>
              </div>
              <span className="whitespace-nowrap font-heading font-extrabold">
                {formatPrice(item.price)}
              </span>

              <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-muted">
                <button
                  type="button"
                  role="switch"
                  aria-checked={item.is_available}
                  aria-label={`В продаже: ${item.name}`}
                  disabled={busyId === item.id}
                  onClick={() => toggleAvailable(item)}
                  className={cn(
                    "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:opacity-50",
                    item.is_available ? "bg-emerald-500" : "bg-white/15",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0.5 top-0.5 size-5 rounded-full bg-white transition-transform",
                      item.is_available && "translate-x-5",
                    )}
                  />
                </button>
                <span className="hidden whitespace-nowrap md:inline">
                  В продаже
                </span>
              </label>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditing(item);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="size-3.5" aria-hidden />
                  <span className="hidden sm:inline">Изменить</span>
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={busyId === item.id}
                  onClick={() => remove(item)}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  <span className="hidden sm:inline">Удалить</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {formOpen && (
        <MenuItemForm
          item={editing}
          onClose={() => setFormOpen(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
