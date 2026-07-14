"use client";

import { DishImage } from "@/components/dish-image";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { saveMenuItem, uploadMenuImage } from "@/lib/data";
import { MENU_CATEGORIES } from "@/lib/seed-data";
import type { MenuItem } from "@/lib/types";
import { ImagePlus, Trash2, Upload, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";

/** Значение пункта «+ Новая категория…» в селекте */
const NEW_CATEGORY = "__new__";

/**
 * next/image падает на некорректном src (например, недопечатанном «htt»),
 * поэтому в превью отдаём только то, что он точно умеет отрисовать.
 */
export function safeImageSrc(src: string | null | undefined): string | null {
  const s = (src ?? "").trim();
  if (!s) return null;
  return /^(https?:\/\/|\/|data:image\/|blob:)/i.test(s) ? s : null;
}

interface MenuItemFormProps {
  /** null — создание нового блюда, иначе редактирование */
  item: MenuItem | null;
  /** Категории, которые уже есть в меню (добавятся к списку в селекте) */
  categories?: string[];
  onClose: () => void;
  onSaved: () => void;
}

export function MenuItemForm({
  item,
  categories = [],
  onClose,
  onSaved,
}: MenuItemFormProps) {
  // Варианты категорий: стандартные + все, что реально встречаются в меню
  const options = Array.from(
    new Set(
      [...MENU_CATEGORIES, ...categories, item?.category ?? ""]
        .map((c) => c.trim())
        .filter(Boolean),
    ),
  );

  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [categorySelect, setCategorySelect] = useState<string>(
    item?.category?.trim() || options[0] || NEW_CATEGORY,
  );
  const [newCategory, setNewCategory] = useState("");
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true);

  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Живой object-URL превью: держим в ref, чтобы гарантированно отозвать его
  // при замене файла и при размонтировании (иначе утечёт blob).
  const objectUrlRef = useRef<string | null>(null);

  const setPreview = (url: string | null) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = url;
    setLocalPreview(url);
  };

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  // Закрытие по Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const previewSrc = safeImageSrc(localPreview ?? imageUrl);
  const isNewCategory = categorySelect === NEW_CATEGORY;

  const handleFile = async (file: File) => {
    setError(null);
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("Можно загрузить только изображение");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadMenuImage(file);
      setImageUrl(url);
    } catch (err) {
      setPreview(null);
      setUploadError(
        err instanceof Error ? err.message : "Не удалось загрузить фото",
      );
    } finally {
      setUploading(false);
    }
  };

  const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // сбрасываем значение, чтобы повторный выбор того же файла тоже сработал
    e.target.value = "";
    if (file) void handleFile(file);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const onUrlChange = (value: string) => {
    // ручная ссылка вытесняет загруженное превью
    if (objectUrlRef.current) setPreview(null);
    setImageUrl(value);
    setUploadError(null);
  };

  const clearImage = () => {
    setPreview(null);
    setImageUrl("");
    setUploadError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const category = (isNewCategory ? newCategory : categorySelect).trim();
    const priceNum = Math.round(Number(price));
    const link = imageUrl.trim();

    if (!name.trim()) {
      setError("Укажите название блюда");
      return;
    }
    if (!price.trim() || !Number.isFinite(priceNum) || priceNum < 0) {
      setError("Укажите корректную цену в тенге");
      return;
    }
    if (!category) {
      setError("Укажите категорию блюда");
      return;
    }
    if (link && !safeImageSrc(link)) {
      setError("Ссылка на фото должна начинаться с / или https://");
      return;
    }
    if (uploading) {
      setError("Дождитесь окончания загрузки фото");
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
        image_url: link || null,
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={item ? "Изменить блюдо" : "Добавить блюдо"}
      onClick={onClose}
    >
      <Card
        className="my-4 max-h-[90vh] w-full max-w-lg overflow-y-auto"
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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="dish-name">Название *</Label>
              <Input
                id="dish-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например, Лагман"
                autoComplete="off"
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
                <div className="relative">
                  <Input
                    id="dish-price"
                    type="number"
                    min={0}
                    step={10}
                    inputMode="numeric"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="2490"
                    className="pr-9"
                  />
                  <span
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted"
                    aria-hidden
                  >
                    ₸
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="dish-category">Категория *</Label>
                <Select
                  id="dish-category"
                  value={categorySelect}
                  onChange={(e) => setCategorySelect(e.target.value)}
                >
                  {options.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value={NEW_CATEGORY}>+ Новая категория…</option>
                </Select>
              </div>
            </div>

            {isNewCategory && (
              <div>
                <Label htmlFor="dish-new-category">Название категории *</Label>
                <Input
                  id="dish-new-category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Например: Напитки, Шашлыки, Европейская кухня"
                  autoComplete="off"
                />
                <p className="mt-1.5 text-xs text-muted">
                  Категория появится в меню автоматически, как только вы
                  сохраните блюдо.
                </p>
              </div>
            )}

            {/* ---- Фото: файл или ссылка ---- */}
            <div className="rounded-card border border-line bg-surface-2/40 p-4">
              <Label className="mb-3">Фото блюда</Label>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {previewSrc && (
                  <div className="shrink-0">
                    <DishImage
                      src={previewSrc}
                      alt={name || "Фото блюда"}
                      className="size-28 rounded-card border border-line [&_svg]:size-8"
                      sizes="112px"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted transition-colors hover:text-primary"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Убрать фото
                    </button>
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-3">
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center gap-1.5",
                      "rounded-btn border border-dashed px-4 py-5 text-center transition-colors",
                      dragOver
                        ? "border-primary bg-primary/10"
                        : "border-line bg-surface-2 hover:border-primary/60 hover:bg-white/5",
                      uploading && "pointer-events-none opacity-60",
                    )}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={uploading}
                      onChange={onPickFile}
                    />
                    {uploading ? (
                      <span className="flex items-center gap-2 text-sm text-muted">
                        <Spinner className="size-4" />
                        Загружаем фото…
                      </span>
                    ) : (
                      <>
                        <span className="flex items-center gap-2 text-sm font-semibold text-white">
                          {previewSrc ? (
                            <ImagePlus className="size-4 text-primary" aria-hidden />
                          ) : (
                            <Upload className="size-4 text-primary" aria-hidden />
                          )}
                          {previewSrc ? "Заменить фото" : "Загрузить фото"}
                        </span>
                        <span className="text-xs text-muted">
                          Перетащите файл сюда или нажмите · JPG, PNG до 5 МБ
                        </span>
                      </>
                    )}
                  </label>

                  <div>
                    <Label htmlFor="dish-image-url">
                      или вставьте ссылку на фото
                    </Label>
                    <Input
                      id="dish-image-url"
                      value={imageUrl}
                      onChange={(e) => onUrlChange(e.target.value)}
                      placeholder="/images/lagman.jpg или https://…"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>

                  {uploadError && (
                    <p className="text-sm text-primary">{uploadError}</p>
                  )}
                </div>
              </div>
            </div>

            <label className="flex w-fit cursor-pointer select-none items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="size-4 cursor-pointer accent-primary"
              />
              В продаже
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-btn border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary"
              >
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" disabled={saving || uploading}>
                {saving && <Spinner className="size-4" />}
                Сохранить
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
