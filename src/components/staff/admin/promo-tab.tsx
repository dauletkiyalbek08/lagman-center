"use client";

import { PromoBannerView } from "@/components/landing/promo-banner";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/field";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { fetchPromoBanner, savePromoBanner } from "@/lib/data";
import type { PromoAccent, PromoBanner } from "@/lib/types";
import { Check, EyeOff, Info } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

const ACCENTS: Array<{ id: PromoAccent; label: string; dot: string }> = [
  { id: "red", label: "Праздник", dot: "bg-primary" },
  { id: "amber", label: "Акция", dot: "bg-amber-500" },
  { id: "emerald", label: "Комбо", dot: "bg-emerald-500" },
];

const EMOJI_CHOICES = ["🎉", "🔥", "🍜", "🥳", "🎁", "⭐", "❤️", "🌙"];

/** Готовые заготовки — заполняют баннер одним кликом. */
const PRESETS: Array<{ label: string; value: Partial<PromoBanner> }> = [
  {
    label: "🎉 Праздник",
    value: {
      emoji: "🎉",
      accent: "red",
      title: "С праздником!",
      body: "Поздравляем и дарим особое меню. Ждём вас в гости!",
      cta_label: "Смотреть меню",
      cta_href: "/menu",
    },
  },
  {
    label: "🔥 Акция",
    value: {
      emoji: "🔥",
      accent: "amber",
      title: "Скидка −20% всю неделю",
      body: "Успейте заказать любимые блюда по специальной цене.",
      cta_label: "Заказать",
      cta_href: "/menu",
    },
  },
  {
    label: "🍜 Комбо",
    value: {
      emoji: "🍜",
      accent: "emerald",
      title: "Комбо-набор по выгодной цене",
      body: "Лагман + шашлык + чай — вкусно и дешевле, чем по отдельности.",
      cta_label: "Смотреть меню",
      cta_href: "/menu",
    },
  },
];

/** Баннер акции/праздника на главной: создать, изменить, включить или убрать. */
export function PromoTab() {
  const [promo, setPromo] = useState<PromoBanner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPromoBanner()
      .then(setPromo)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Не удалось загрузить баннер"),
      );
  }, []);

  if (!promo && !error) return <PageLoader label="Загружаем баннер…" />;
  if (!promo) {
    return (
      <p className="rounded-card border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
        {error}
      </p>
    );
  }

  const set = (patch: Partial<PromoBanner>) => {
    setPromo((prev) => (prev ? { ...prev, ...patch } : prev));
    setSaved(false);
  };

  const persist = async (next: PromoBanner) => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await savePromoBanner(next);
      setPromo(next);
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось сохранить баннер",
      );
    } finally {
      setSaving(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void persist(promo);
  };

  // «Убрать с сайта» — выключаем и сразу сохраняем
  const hide = () => void persist({ ...promo, is_active: false });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(320px,420px)]">
      {/* Форма */}
      <Card>
        <CardBody className="p-6">
          <form onSubmit={submit} className="space-y-5">
            {/* Показ на сайте */}
            <label className="flex items-center justify-between gap-4 rounded-card border border-line bg-surface-2 px-4 py-3">
              <span>
                <span className="block font-semibold">Показывать на сайте</span>
                <span className="block text-xs text-muted">
                  Баннер появится на главной у всех клиентов
                </span>
              </span>
              <input
                type="checkbox"
                className="size-5 shrink-0 accent-primary"
                checked={promo.is_active}
                onChange={(e) => set({ is_active: e.target.checked })}
              />
            </label>

            {/* Заготовки */}
            <div>
              <Label>Быстрые заготовки</Label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => set(p.value)}
                    className="rounded-btn border border-line bg-surface-2 px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/60 hover:text-white"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Стиль (акцент) */}
            <div>
              <Label>Стиль под повод</Label>
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((ac) => (
                  <button
                    key={ac.id}
                    type="button"
                    onClick={() => set({ accent: ac.id })}
                    className={cn(
                      "flex items-center gap-2 rounded-btn border px-3.5 py-2 text-sm font-semibold transition-colors",
                      promo.accent === ac.id
                        ? "border-primary text-white"
                        : "border-line text-muted hover:text-white",
                    )}
                  >
                    <span className={cn("size-2.5 rounded-full", ac.dot)} />
                    {ac.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Эмодзи */}
            <div>
              <Label htmlFor="promo-emoji">Значок (эмодзи)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="promo-emoji"
                  value={promo.emoji}
                  onChange={(e) => set({ emoji: e.target.value })}
                  className="w-20 text-center text-lg"
                  maxLength={4}
                />
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_CHOICES.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => set({ emoji: em })}
                      className="rounded-btn border border-line bg-surface-2 px-2 py-1 text-lg leading-none transition-colors hover:border-primary/60"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Заголовок */}
            <div>
              <Label htmlFor="promo-title">Заголовок</Label>
              <Input
                id="promo-title"
                value={promo.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="Например: Комбо к празднику −20%"
                maxLength={80}
              />
            </div>

            {/* Текст */}
            <div>
              <Label htmlFor="promo-body">Текст</Label>
              <Textarea
                id="promo-body"
                value={promo.body}
                onChange={(e) => set({ body: e.target.value })}
                placeholder="Коротко о предложении: что, для кого, до когда"
                maxLength={200}
              />
            </div>

            {/* Кнопка */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="promo-cta">Кнопка (текст)</Label>
                <Input
                  id="promo-cta"
                  value={promo.cta_label}
                  onChange={(e) => set({ cta_label: e.target.value })}
                  placeholder="Смотреть меню"
                  maxLength={30}
                />
              </div>
              <div>
                <Label htmlFor="promo-href">Ссылка кнопки</Label>
                <Input
                  id="promo-href"
                  value={promo.cta_href}
                  onChange={(e) => set({ cta_href: e.target.value })}
                  placeholder="/menu"
                />
              </div>
            </div>
            <p className="flex items-start gap-2 text-xs text-muted">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Кнопка появится, только если заполнены оба поля. Ссылки на сайт:
              /menu, /delivery, /booking. Оставьте пустыми — будет баннер без
              кнопки.
            </p>

            {error && (
              <p className="rounded-btn border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving && <Spinner className="size-4 border-white/40" />}
                Сохранить
              </Button>
              {promo.is_active && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={saving}
                  onClick={hide}
                >
                  <EyeOff className="size-4" aria-hidden />
                  Убрать с сайта
                </Button>
              )}
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                  <Check className="size-4" aria-hidden />
                  Сохранено
                </span>
              )}
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Живое превью */}
      <div>
        <p className="mb-2 text-sm font-medium text-muted">
          Как увидит клиент{" "}
          {!promo.is_active && (
            <span className="text-amber-400">· сейчас скрыт</span>
          )}
        </p>
        <div className={cn(!promo.is_active && "opacity-60")}>
          {promo.title.trim() || promo.body.trim() ? (
            <PromoBannerView promo={promo} preview />
          ) : (
            <div className="rounded-card border border-dashed border-line bg-surface px-5 py-10 text-center text-sm text-muted">
              Заполните заголовок или текст — здесь появится превью баннера.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
