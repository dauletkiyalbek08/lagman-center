"use client";

import { StatusTracker } from "@/components/delivery/status-tracker";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import {
  fetchOrder,
  fetchOrderStatus,
  isSupabaseConfigured,
  subscribeOrders,
} from "@/lib/data";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";
import { CheckCircle2, MapPin, UtensilsCrossed, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

/** Как часто спрашиваем статус, когда заказ оформлен без регистрации. */
const GUEST_POLL_MS = 20_000;

/** Экран успешного оформления: галочка, трекер статуса, состав заказа. */
export function OrderSuccess({
  initialOrder,
  onDismiss,
}: {
  initialOrder: Order;
  onDismiss?: () => void;
}) {
  const [order, setOrder] = useState(initialOrder);
  const { user } = useAuth();

  // Сброс локального состояния, если показываем уже другой заказ
  const [prevInitial, setPrevInitial] = useState(initialOrder);
  if (prevInitial !== initialOrder) {
    setPrevInitial(initialOrder);
    setOrder(initialOrder);
  }

  const dineIn = order.order_type === "dine_in";

  // Владелец заказа (или демо-режим) читает строку целиком и слушает realtime
  const canReadOrder = !isSupabaseConfigured || Boolean(user);

  useEffect(() => {
    if (!canReadOrder) return;
    const load = () =>
      fetchOrder(initialOrder.id).then((o) => {
        if (o) setOrder(o);
      });
    load();
    return subscribeOrders(load);
  }, [initialOrder.id, canReadOrder]);

  // Гость за столом строку заказа читать не может (RLS), поэтому статус
  // спрашиваем отдельной функцией и опрашиваем её по таймеру: realtime-события
  // до неавторизованного клиента тоже не доходят.
  useEffect(() => {
    if (canReadOrder) return;
    let stopped = false;
    const poll = () =>
      fetchOrderStatus(initialOrder.id).then((status) => {
        if (!stopped && status) setOrder((o) => ({ ...o, status }));
      });
    poll();
    const timer = window.setInterval(poll, GUEST_POLL_MS);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [initialOrder.id, canReadOrder]);

  const subtotal = order.total - order.delivery_fee;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="size-16 text-emerald-400" aria-hidden />
        <h1 className="font-heading text-2xl font-extrabold uppercase sm:text-3xl">
          Заявка <span className="text-primary">{order.order_number}</span>{" "}
          принята!
        </h1>
        <p className="max-w-md text-muted">
          {dineIn
            ? `Заказ уже на кухне. Подадим к столу №${order.table_number}.`
            : "Ожидайте звонка для подтверждения. Мы готовим ваш заказ."}
        </p>
      </div>

      <div className="mt-8">
        <StatusTracker status={order.status} type={order.order_type} />
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        Статус заказа обновляется автоматически. Сохраните номер заявки — по нему
        можно уточнить заказ у персонала.
      </p>

      <Card className="mt-8">
        <CardBody className="p-6">
          <h2 className="mb-4 font-heading text-base font-extrabold uppercase">
            Состав заказа
          </h2>
          <ul className="space-y-2.5">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline justify-between gap-4 text-sm"
              >
                <span className="min-w-0">
                  {item.name_snapshot}{" "}
                  <span className="text-muted">× {item.quantity}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums">
                  {formatPrice(item.price_snapshot * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
            {order.delivery_fee > 0 && (
              <>
                <div className="flex items-center justify-between text-muted">
                  <span>Блюда</span>
                  <span className="tabular-nums">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Доставка</span>
                  <span className="tabular-nums">
                    {formatPrice(order.delivery_fee)}
                  </span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-muted">Итого:</span>
              <span className="font-heading text-xl font-extrabold tabular-nums">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          {dineIn ? (
            <div className="mt-4 space-y-2 text-sm text-muted">
              <p className="flex items-start gap-2">
                <UtensilsCrossed
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden
                />
                Стол №{order.table_number}
              </p>
              <p className="flex items-start gap-2">
                <Wallet
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden
                />
                Оплата на кассе, когда будете уходить
              </p>
            </div>
          ) : (
            <p className="mt-4 flex items-start gap-2 text-sm text-muted">
              <MapPin
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              {order.address}
            </p>
          )}
        </CardBody>
      </Card>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/menu" className={buttonClasses("secondary", "md")}>
          {dineIn ? "Заказать ещё" : "Вернуться в меню"}
        </Link>
        {onDismiss && (
          <Button variant="ghost" onClick={onDismiss}>
            Скрыть заявку
          </Button>
        )}
      </div>
    </div>
  );
}
