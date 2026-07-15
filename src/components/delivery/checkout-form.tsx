"use client";

import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/cn";
import { DELIVERY_PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import {
  DEFAULT_SETTINGS,
  createOrder,
  deliveryFeeFor,
  fetchSettings,
  isSupabaseConfigured,
} from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { useTableSession } from "@/lib/table-session";
import type { DeliveryPaymentMethod, Order, Settings } from "@/lib/types";
import {
  Banknote,
  CreditCard,
  Info,
  ShoppingBag,
  Smartphone,
  Truck,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

const PAYMENT_ICONS: Record<DeliveryPaymentMethod, typeof Banknote> = {
  cash: Banknote,
  card: CreditCard,
  kaspi: Smartphone,
};

/** Доставка на адрес или самовывоз из кафе — выбирает вошедший клиент. */
type Mode = "delivery" | "pickup";

interface FieldErrors {
  phone?: string;
  address?: string;
}

/**
 * Оформление заказа. Три сценария:
 *  · гость за столом (QR) — без регистрации, оплата на кассе;
 *  · доставка — только для вошедшего клиента: адрес + стоимость доставки;
 *  · самовывоз — для вошедшего клиента: без адреса и без доставки, оплата
 *    на кассе при получении.
 */
export function CheckoutForm({
  onSuccess,
}: {
  onSuccess: (order: Order) => void;
}) {
  const { items, total: subtotal } = useCart();
  const { user, profile } = useAuth();
  const table = useTableSession();
  const pathname = usePathname();

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => {
    fetchSettings()
      .then(setSettings)
      .catch(() => {});
  }, []);

  const [mode, setMode] = useState<Mode>("delivery");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<DeliveryPaymentMethod>("cash");
  const [comment, setComment] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Предзаполнение из профиля (не затирая уже введённое):
  // правим состояние прямо при рендере, когда профиль догрузился
  const [prevProfile, setPrevProfile] = useState(profile);
  if (profile !== prevProfile) {
    setPrevProfile(profile);
    if (profile?.name) setName((v) => v || profile.name!);
    if (profile?.phone) setPhone((v) => v || profile.phone!);
    if (profile?.address) setAddress((v) => v || profile.address!);
  }

  const dineIn = Boolean(table);
  const isDelivery = !dineIn && mode === "delivery";
  const isPickup = !dineIn && mode === "pickup";
  // В демо-режиме входа нет вовсе, поэтому заказ на дом/навынос там не запираем
  const needsLogin = !dineIn && isSupabaseConfigured && !user;

  const fee = isDelivery ? deliveryFeeFor(subtotal, settings) : 0;
  const total = subtotal + fee;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!dineIn) {
      const errs: FieldErrors = {};
      if (!phone.trim()) errs.phone = "Укажите номер телефона";
      if (isDelivery && !address.trim()) errs.address = "Укажите адрес доставки";
      setFieldErrors(errs);
      if (errs.phone || errs.address) return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder(
        dineIn
          ? {
              order_type: "dine_in",
              table_code: table!.code,
              customer_name: name.trim(),
              payment_method: "counter",
              comment: comment.trim() || undefined,
              items,
            }
          : isPickup
            ? {
                order_type: "pickup",
                phone: phone.trim(),
                customer_name: name.trim(),
                payment_method: "counter",
                comment: comment.trim() || undefined,
                items,
              }
            : {
                order_type: "delivery",
                address: address.trim(),
                phone: phone.trim(),
                customer_name: name.trim(),
                payment_method: payment,
                comment: comment.trim() || undefined,
                items,
              },
      );
      onSuccess(order);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось оформить заказ. Попробуйте ещё раз.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (needsLogin) {
    return (
      <Card className="lg:sticky lg:top-24">
        <CardBody className="p-6">
          <h2 className="mb-2 font-heading text-lg font-extrabold uppercase">
            Доставка и самовывоз
          </h2>
          <p className="text-sm text-muted">
            Чтобы заказать доставку или самовывоз, войдите по номеру телефона.
            Это займёт полминуты: номер и пароль — больше ничего не нужно.
          </p>

          <div className="mt-5 space-y-2">
            <Link
              href={`/register?next=${encodeURIComponent(pathname)}`}
              className={buttonClasses("primary", "lg", "w-full")}
            >
              <UserRound className="size-4" aria-hidden />
              Зарегистрироваться
            </Link>
            <Link
              href={`/login?next=${encodeURIComponent(pathname)}`}
              className={buttonClasses("secondary", "md", "w-full")}
            >
              У меня уже есть аккаунт
            </Link>
          </div>

          <p className="mt-5 flex items-start gap-2 rounded-btn border border-line bg-surface-2 px-3 py-2.5 text-xs text-muted">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            Сидите в кафе? Отсканируйте QR-код на столе — там заказ оформляется
            без регистрации, а оплата на кассе.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="lg:sticky lg:top-24">
      <CardBody className="p-6">
        <h2 className="mb-5 font-heading text-lg font-extrabold uppercase">
          {dineIn
            ? `Заказ за столом №${table!.number}`
            : isPickup
              ? "Самовывоз"
              : "Оформление доставки"}
        </h2>

        {dineIn && (
          <p className="mb-5 flex items-start gap-2 rounded-btn border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-primary">
            <UtensilsCrossed className="mt-0.5 size-4 shrink-0" aria-hidden />
            Заказ уйдёт на кухню и его подадут к столу. Оплата на кассе, когда
            будете уходить.
          </p>
        )}

        {/* Переключатель «Доставка / Самовывоз» — только вне режима стола */}
        {!dineIn && (
          <div className="mb-5 grid grid-cols-2 gap-2">
            {(
              [
                { m: "delivery", label: "Доставка", Icon: Truck },
                { m: "pickup", label: "Самовывоз", Icon: ShoppingBag },
              ] as const
            ).map(({ m, label, Icon }) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setFieldErrors({});
                  }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-btn border px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-white"
                      : "border-line bg-surface-2 text-muted hover:border-white/30",
                  )}
                >
                  <Icon
                    className={cn("size-4", active && "text-primary")}
                    aria-hidden
                  />
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {isPickup && (
          <p className="mb-5 flex items-start gap-2 rounded-btn border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-primary">
            <ShoppingBag className="mt-0.5 size-4 shrink-0" aria-hidden />
            Заберёте сами из кафе. Позвоним, когда заказ будет готов. Оплата на
            кассе при получении.
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <Label htmlFor="checkout-name">
              Имя {dineIn && <span className="text-muted">(необязательно)</span>}
            </Label>
            <Input
              id="checkout-name"
              name="name"
              autoComplete="name"
              placeholder="Как к вам обращаться"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {!dineIn && (
            <div>
              <Label htmlFor="checkout-phone">Телефон *</Label>
              <Input
                id="checkout-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+7 ___ ___ ____"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setFieldErrors((f) => ({ ...f, phone: undefined }));
                }}
                aria-invalid={Boolean(fieldErrors.phone)}
                className={cn(fieldErrors.phone && "border-primary!")}
              />
              {fieldErrors.phone ? (
                <p className="mt-1.5 text-xs text-primary">
                  {fieldErrors.phone}
                </p>
              ) : (
                isPickup && (
                  <p className="mt-1.5 text-xs text-muted">
                    Позвоним по нему, когда заказ будет готов.
                  </p>
                )
              )}
            </div>
          )}

          {isDelivery && (
            <>
              <div>
                <Label htmlFor="checkout-address">Адрес доставки *</Label>
                <Textarea
                  id="checkout-address"
                  name="address"
                  autoComplete="street-address"
                  placeholder="Улица, дом, квартира, подъезд"
                  rows={2}
                  className={cn(
                    "min-h-16",
                    fieldErrors.address && "border-primary!",
                  )}
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setFieldErrors((f) => ({ ...f, address: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.address)}
                />
                {fieldErrors.address ? (
                  <p className="mt-1.5 text-xs text-primary">
                    {fieldErrors.address}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-muted">
                    Щучинск. Укажите адрес точно — курьер поедет по нему.
                  </p>
                )}
              </div>

              <fieldset>
                <legend className="mb-1.5 block text-sm font-medium text-muted">
                  Оплата при получении
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {DELIVERY_PAYMENT_METHODS.map((method) => {
                    const Icon = PAYMENT_ICONS[method];
                    const active = payment === method;
                    return (
                      <label
                        key={method}
                        className={cn(
                          "flex cursor-pointer flex-col items-center gap-1.5 rounded-btn border px-1.5 py-3",
                          "text-center text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary/10 text-white"
                            : "border-line bg-surface-2 text-muted hover:border-white/30",
                        )}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          value={method}
                          checked={active}
                          onChange={() => setPayment(method)}
                          className="sr-only"
                        />
                        <Icon
                          className={cn("size-5", active ? "text-primary" : "")}
                          aria-hidden
                        />
                        {PAYMENT_METHOD_LABELS[method]}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </>
          )}

          <div>
            <Label htmlFor="checkout-comment">Комментарий</Label>
            <Textarea
              id="checkout-comment"
              name="comment"
              placeholder="Пожелания к заказу (необязательно)"
              rows={2}
              className="min-h-16"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {/* Итого: блюда + доставка */}
          <div className="space-y-1.5 border-t border-line pt-4 text-sm">
            <div className="flex items-center justify-between text-muted">
              <span>Блюда</span>
              <span className="tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            {isDelivery && (
              <div className="flex items-center justify-between text-muted">
                <span>Доставка</span>
                <span className="tabular-nums">
                  {fee === 0 ? "бесплатно" : formatPrice(fee)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1.5">
              <span className="font-semibold">Итого</span>
              <span className="font-heading text-xl font-extrabold tabular-nums">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {error && (
            <p className="rounded-btn border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting && <Spinner className="size-4 border-white/40" />}
            {submitting
              ? "Отправляем…"
              : dineIn
                ? "Отправить на кухню"
                : isPickup
                  ? "Оформить самовывоз"
                  : "Оформить заказ"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
