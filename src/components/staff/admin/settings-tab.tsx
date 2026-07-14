"use client";

import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/field";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { fetchSettings, saveSettings } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import type { Settings } from "@/lib/types";
import { Check, Info } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

/** Настройки доставки: сколько стоит, от какой суммы бесплатно, минимум заказа. */
export function SettingsTab() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [fee, setFee] = useState("");
  const [freeFrom, setFreeFrom] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        setSettings(s);
        setFee(String(s.delivery_fee));
        setFreeFrom(String(s.free_delivery_from));
        setMinOrder(String(s.min_order));
      })
      .catch((e: unknown) => {
        setError(
          e instanceof Error ? e.message : "Не удалось загрузить настройки",
        );
      });
  }, []);

  if (!settings && !error) return <PageLoader label="Загружаем настройки…" />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Settings = {
      delivery_fee: Number(fee),
      free_delivery_from: Number(freeFrom),
      min_order: Number(minOrder),
    };
    if (
      Object.values(next).some((v) => !Number.isInteger(v) || v < 0)
    ) {
      setError("Суммы — целые числа, не меньше нуля");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveSettings(next);
      setSettings(next);
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось сохранить настройки",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <Card>
        <CardBody className="p-6">
          <h3 className="mb-1 font-heading text-lg font-extrabold uppercase">
            Доставка
          </h3>
          <p className="mb-5 text-sm text-muted">
            Стоимость доставки прибавляется к сумме заказа. Клиент видит её в
            корзине ещё до оформления, а считается она на сервере — подделать из
            браузера нельзя.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="set-fee">Стоимость доставки, ₸</Label>
              <Input
                id="set-fee"
                type="number"
                min={0}
                value={fee}
                onChange={(e) => {
                  setFee(e.target.value);
                  setSaved(false);
                }}
              />
              <p className="mt-1.5 text-xs text-muted">
                0 — доставка всегда бесплатная.
              </p>
            </div>

            <div>
              <Label htmlFor="set-free-from">Бесплатная доставка от, ₸</Label>
              <Input
                id="set-free-from"
                type="number"
                min={0}
                value={freeFrom}
                onChange={(e) => {
                  setFreeFrom(e.target.value);
                  setSaved(false);
                }}
              />
              <p className="mt-1.5 text-xs text-muted">
                0 — бесплатной доставки нет.
              </p>
            </div>

            <div>
              <Label htmlFor="set-min">Минимальная сумма заказа, ₸</Label>
              <Input
                id="set-min"
                type="number"
                min={0}
                value={minOrder}
                onChange={(e) => {
                  setMinOrder(e.target.value);
                  setSaved(false);
                }}
              />
              <p className="mt-1.5 text-xs text-muted">
                0 — заказать можно на любую сумму.
              </p>
            </div>

            {error && (
              <p className="rounded-btn border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving && <Spinner className="size-4 border-white/40" />}
                Сохранить
              </Button>
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

      <p className="flex items-start gap-2 rounded-card border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          Сейчас доставку оплачивают при получении — курьеру наличными, картой
          или переводом Kaspi. Предоплату на сайте включим, когда у заведения
          появится Kaspi Business: тогда сумма (
          {settings ? formatPrice(settings.delivery_fee) : "доставка"} + блюда)
          будет подставляться в Kaspi автоматически, а сайт сам увидит оплату.
        </span>
      </p>
    </div>
  );
}
