"use client";

import { DishImage } from "@/components/dish-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { PageLoader } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import {
  deleteMenuItem,
  fetchMenuItems,
  saveMenuItem,
  subscribeMenu,
} from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { MENU_CATEGORIES } from "@/lib/seed-data";
import type { MenuItem } from "@/lib/types";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MenuItemForm, safeImageSrc } from "./menu-item-form";

/** Стандартные категории идут первыми, свои — следом по алфавиту */
function categoryOrder(c: string): number {
  const i = (MENU_CATEGORIES as readonly string[]).indexOf(c);
  return i === -1 ? MENU_CATEGORIES.length : i;
}

export function MenuTab() {
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  const load = useCallback(() => {
    fetchMenuItems()
      .then(setItems)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Не удалось загрузить меню"),
      );
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeMenu(load);
    return unsubscribe;
  }, [load]);

  /** Все категории, которые реально есть в меню — их же предлагаем в форме */
  const categories = useMemo(
    () =>
      Array.from(
        new Set((items ?? []).map((i) => i.category.trim()).filter(Boolean)),
      ),
    [items],
  );

  /** Поиск по названию + группировка по категориям */
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const found = (items ?? []).filter((i) =>
      q ? i.name.toLowerCase().includes(q) : true,
    );

    const map = new Map<string, MenuItem[]>();
    for (const item of found) {
      const key = item.category.trim() || "Без категории";
      const list = map.get(key);
      if (list) list.push(item);
      else map.set(key, [item]);
    }

    return [...map.entries()]
      .map(([category, list]) => ({
        category,
        items: list.sort((a, b) => a.name.localeCompare(b.name, "ru")),
      }))
      .sort(
        (a, b) =>
          categoryOrder(a.category) - categoryOrder(b.category) ||
          a.category.localeCompare(b.category, "ru"),
      );
  }, [items, query]);

  if (!items) return <PageLoader label="Загружаем меню…" />;

  const shown = groups.reduce((sum, g) => sum + g.items.length, 0);

  const toggleAvailable = async (item: MenuItem) => {
    setBusyId(item.id);
    setError(null);
    try {
      await saveMenuItem({ ...item, is_available: !item.is_available });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось обновить блюдо");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item: MenuItem) => {
    if (!window.confirm(`Удалить блюдо «${item.name}»?`)) return;
    setBusyId(item.id);
    setError(null);
    try {
      await deleteMenuItem(item.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить блюдо");
    } finally {
      setBusyId(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setFormOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* ---- Панель управления ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="size-4" aria-hidden />
          Добавить блюдо
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-64">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по названию"
              aria-label="Поиск блюда по названию"
              className="pl-10"
            />
          </div>
          <p className="whitespace-nowrap text-sm text-muted">
            Всего: {items.length}
            {query.trim() && ` · найдено: ${shown}`}
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-btn border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Скрыть ошибку"
            className="cursor-pointer opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {/* ---- Список блюд по категориям ---- */}
      {groups.length === 0 ? (
        <div className="rounded-card border border-line bg-surface p-10 text-center text-sm text-muted">
          {items.length === 0
            ? "В меню пока нет блюд. Нажмите «Добавить блюдо»."
            : `По запросу «${query.trim()}» ничего не найдено.`}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.category} className="space-y-2">
              <h3 className="flex items-center gap-2 font-heading text-sm font-extrabold uppercase tracking-wide">
                {group.category}
                <span className="text-muted">({group.items.length})</span>
              </h3>

              <div className="overflow-hidden rounded-card border border-line bg-surface">
                <ul className="divide-y divide-line">
                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      className={cn(
                        "flex flex-wrap items-center gap-x-4 gap-y-3 p-3 sm:flex-nowrap",
                        !item.is_available && "opacity-60",
                      )}
                    >
                      <DishImage
                        src={safeImageSrc(item.image_url)}
                        alt={item.name}
                        className="size-14 shrink-0 rounded-btn [&_svg]:size-6"
                        sizes="56px"
                      />

                      <div className="min-w-0 flex-1 basis-40">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-semibold">
                            {item.name}
                          </span>
                          {!item.is_available && (
                            <Badge className="border-primary/30 bg-primary/10 text-primary">
                              Скрыто
                            </Badge>
                          )}
                        </p>
                        {item.description && (
                          <p className="truncate text-xs text-muted">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <span className="whitespace-nowrap font-heading font-extrabold">
                        {formatPrice(item.price)}
                      </span>

                      <div className="flex items-center gap-2 text-xs text-muted">
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
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEdit(item)}
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
            </section>
          ))}
        </div>
      )}

      {formOpen && (
        <MenuItemForm
          item={editing}
          categories={categories}
          onClose={() => setFormOpen(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
