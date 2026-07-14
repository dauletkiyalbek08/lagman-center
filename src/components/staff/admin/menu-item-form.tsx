"use client";

import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { saveMenuItem } from "@/lib/data";
import { MENU_CATEGORIES } from "@/lib/seed-data";
import type { MenuItem } from "@/lib/types";
import { X } from "lucide-react";
import { useState, type FormEvent } from "react";

const OTHER_CATEGORY = "__other__";

interface MenuItemFormProps {
  /** null — создание нового блюда, иначе редактирование */
  item: MenuItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export function MenuItemForm({ item, onClose, onSaved }: MenuItemFormProps) {
  const knownCategory =
    !item || (MENU_CATEGORIES as readonly string[]).includes(item.category);

  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [categorySelect, setCategorySelect] = useState<string>(
    item ? (knownCategory ? item.category : OTHER_CATEGORY) : MENU_CATEGORIES[0],
  );
  const [customCategory, setCustomCategory] = useState(
    item && !knownCategory ? item.category : "",
  );
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const category =
      categorySelect === OTHER_CATEGORY
        ? customCategory.trim()
        : categorySelect;
    const priceNum = Math.round(Number(price));

    if (!name.trim()) {
      setError("Укажите название блюда");
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError("Укажите корректную цену");
      return;
    }
    if (!category) {
      setError("Укажите категорию");
      return;
    }

    setSaving(true);
    try {
      await saveMenuItem({
        ...(item ? { id: item.id } : {}),
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        category,
        image_url: imageUrl.trim() || null,
        is_available: isAvailable,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось сохранить блюдо",
      );
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={item ? "Изменить блюдо" : "Добавить блюдо"}
      onClick={onClose}
    >
      <Card
        className="my-4 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <CardBody>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h3 className="font-heading text-lg font-extrabold uppercase">
              {item ? "Изменить блюдо" : "Добавить блюдо"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="cursor-pointer rounded-btn p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-white"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="dish-name">Название *</Label>
              <Input
                id="dish-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например, Лагман"
                required
              />
            </div>

            <div>
              <Label htmlFor="dish-description">Описание</Label>
              <Textarea
                id="dish-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Короткое описание блюда"
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="dish-price">Цена, ₸ *</Label>
                <Input
                  id="dish-price"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="2490"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dish-category">Категория</Label>
                <Select
                  id="dish-category"
                  value={categorySelect}
                  onChange={(e) => setCategorySelect(e.target.value)}
                >
                  {MENU_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value={OTHER_CATEGORY}>Другая…</option>
                </Select>
              </div>
            </div>

            {categorySelect === OTHER_CATEGORY && (
              <div>
                <Label htmlFor="dish-custom-category">Своя категория *</Label>
                <Input
                  id="dish-custom-category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Например, Десерты"
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="dish-image">Ссылка на фото</Label>
              <Input
                id="dish-image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/images/lagman.jpg"
              />
              <p className="mt-1.5 text-xs text-muted">
                Формат: /images/….jpg или https://…
              </p>
            </div>

            <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="size-4 cursor-pointer accent-primary"
              />
              В продаже
            </label>

            {error && (
              <p className="rounded-btn border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" disabled={saving}>
                {saving && <Spinner className="size-4" />}
                {item ? "Сохранить" : "Добавить"}
              </Button>
              <Button variant="secondary" onClick={onClose} disabled={saving}>
                Отмена
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
