"use client";

import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/cn";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { createOrder } from "@/lib/data";
import type { Order, PaymentMethod } from "@/lib/types";
import { Banknote, CreditCard, Smartphone } from "lucide-react";
import { useState, type FormEvent } from "react";

const PAYMENT_ICONS: Record<
  PaymentMethod,
  typeof Banknote
> = {
  cash: Banknote,
  card: CreditCard,
  kaspi: Smartphone,
};

const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

interface FieldErrors {
  phone?: string;
  address?: string;
}

/** Карточка «Оформление заказа»: контакты, адрес, оплата, комментарий. */
export function CheckoutForm({
  onSuccess,
}: {
  onSuccess: (order: Order) => void;
}) {
  const { items } = useCart();
  const { profile } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [comment, setComment] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Предзаполнение из профиля (не затирая уже введённое):
  // корректировка состояния прямо при рендере, когда профиль догрузился
  const [prevProfile, setPrevProfile] = useState(profile);
  if (profile !== prevProfile) {
    setPrevProfile(profile);
    if (profile?.name) setName((v) => v || profile.name!);
    if (profile?.phone) setPhone((v) => v || profile.phone!);
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const errs: FieldErrors = {};
    if (!phone.trim()) errs.phone = "Укажите номер телефона";
    if (!address.trim()) errs.address = "Укажите адрес доставки";
    setFieldErrors(errs);
    if (errs.phone || errs.address) return;

    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder({
        address: address.trim(),
        phone: phone.trim(),
        customer_name: name.trim(),
        payment_method: payment,
        comment: comment.trim() || undefined,
        items,
      });
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

  return (
    <Card className="lg:sticky lg:top-24">
      <CardBody className="p-6">
        <h2 className="mb-5 font-heading text-lg font-extrabold uppercase">
          Оформление заказа
        </h2>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <Label htmlFor="checkout-name">Имя</Label>
            <Input
              id="checkout-name"
              name="name"
              autoComplete="name"
              placeholder="Как к вам обращаться"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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
            {fieldErrors.phone && (
              <p className="mt-1.5 text-xs text-primary">{fieldErrors.phone}</p>
            )}
          </div>

          <div>
            <Label htmlFor="checkout-address">Адрес доставки *</Label>
            <Textarea
              id="checkout-address"
              name="address"
              autoComplete="street-address"
              placeholder="Улица, дом, квартира"
              rows={2}
              className={cn("min-h-16", fieldErrors.address && "border-primary!")}
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setFieldErrors((f) => ({ ...f, address: undefined }));
              }}
              aria-invalid={Boolean(fieldErrors.address)}
            />
            {fieldErrors.address && (
              <p className="mt-1.5 text-xs text-primary">
                {fieldErrors.address}
              </p>
            )}
          </div>

          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-muted">
              Способ оплаты
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((method) => {
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
            {submitting ? "Отправляем…" : "Оформить заказ"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
