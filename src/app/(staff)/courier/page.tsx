"use client";

import { SectionHeading } from "@/components/section-heading";
import { OrderTicket, telHref } from "@/components/staff/order-ticket";
import { StaffGuard } from "@/components/staff/staff-guard";
import { Button, buttonClasses } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth-context";
import {
  claimOrderForDelivery,
  fetchOrders,
  subscribeOrders,
  updateOrderStatus,
} from "@/lib/data";
import type { Order, OrderStatus } from "@/lib/types";
import { Check, MapPin, Package, Phone, Truck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

function mapsHref(address: string): string {
  return `https://yandex.kz/maps/?text=${encodeURIComponent(`Щучинск, ${address}`)}`;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-card border border-dashed border-line bg-surface px-6 py-14 text-center">
      <Truck className="mx-auto mb-4 size-12 text-muted" aria-hidden />
      <p className="font-heading text-lg font-extrabold uppercase">{title}</p>
      <p className="mt-2 text-sm text-muted">{text}</p>
    </div>
  );
}

function CourierPanel() {
  const { demo, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchOrders().then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeOrders(load);
    return unsubscribe;
  }, [load]);

  // Старые сверху — их развозим первыми
  const byStatus = useCallback(
    (status: OrderStatus) =>
      orders
        .filter((o) => o.status === status)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
    [orders],
  );

  const ready = useMemo(() => byStatus("ready"), [byStatus]);

  // «У меня в доставке» — только свои заказы (в демо-режиме курьер один)
  const delivering = useMemo(
    () =>
      byStatus("delivering").filter(
        (o) => demo || !user || o.courier_id === user.id,
      ),
    [byStatus, demo, user],
  );

  const claim = async (id: string) => {
    setPendingId(id);
    setNotice(null);
    try {
      const claimed = await claimOrderForDelivery(id);
      if (!claimed) setNotice("Этот заказ уже забрал другой курьер.");
      load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Не удалось взять заказ");
    } finally {
      setPendingId(null);
    }
  };

  const markDelivered = async (id: string) => {
    setPendingId(id);
    setNotice(null);
    try {
      await updateOrderStatus(id, "delivered");
      load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Не удалось обновить статус");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <SectionHeading
        pre="ПАНЕЛЬ"
        accent="КУРЬЕРА"
        className="mb-2"
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-4 py-1.5 text-sm font-bold">
            <Package className="size-4 text-primary" aria-hidden />
            Активных заказов: {ready.length + delivering.length}
          </span>
        }
      />
      <p className="mb-6 text-sm text-muted">
        Готовые заказы и ваши доставки. Список обновляется автоматически.
      </p>

      {notice && (
        <p className="mb-6 rounded-card border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
          {notice}
        </p>
      )}

      {loading ? (
        <PageLoader />
      ) : (
        <div className="space-y-12">
          {/* Секция 1: готовы к выдаче */}
          <section>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <h2 className="font-heading text-xl font-extrabold uppercase tracking-tight sm:text-2xl">
                ГОТОВЫ К <span className="text-primary">ВЫДАЧЕ</span>
              </h2>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-0.5 text-sm font-bold text-emerald-400">
                {ready.length}
              </span>
            </div>

            {ready.length === 0 ? (
              <EmptyState
                title="Пока нет готовых заказов"
                text="Как только кухня приготовит заказ, он появится здесь"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {ready.map((order) => (
                  <OrderTicket
                    key={order.id}
                    order={order}
                    showComment
                    showTotal
                    showContacts
                  >
                    <Button
                      size="lg"
                      className="w-full"
                      disabled={pendingId === order.id}
                      onClick={() => claim(order.id)}
                    >
                      <Truck className="size-5" aria-hidden />
                      Взял в доставку
                    </Button>
                  </OrderTicket>
                ))}
              </div>
            )}
          </section>

          {/* Секция 2: в доставке */}
          <section>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <h2 className="font-heading text-xl font-extrabold uppercase tracking-tight sm:text-2xl">
                У МЕНЯ <span className="text-primary">В ДОСТАВКЕ</span>
              </h2>
              <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-0.5 text-sm font-bold text-violet-400">
                {delivering.length}
              </span>
            </div>

            {delivering.length === 0 ? (
              <EmptyState
                title="Сейчас нет заказов в доставке"
                text="Возьмите готовый заказ из списка выше"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {delivering.map((order) => (
                  <OrderTicket
                    key={order.id}
                    order={order}
                    showComment
                    showTotal
                    showContacts
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={telHref(order.phone)}
                        className={buttonClasses("secondary", "md", "w-full")}
                      >
                        <Phone className="size-4" aria-hidden />
                        Позвонить
                      </a>
                      <a
                        href={mapsHref(order.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonClasses("secondary", "md", "w-full")}
                      >
                        <MapPin className="size-4" aria-hidden />
                        Открыть на карте
                      </a>
                    </div>
                    <Button
                      variant="success"
                      size="lg"
                      className="w-full"
                      disabled={pendingId === order.id}
                      onClick={() => markDelivered(order.id)}
                    >
                      Доставлен <Check className="size-5" aria-hidden />
                    </Button>
                  </OrderTicket>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default function CourierPage() {
  return (
    <StaffGuard allow={["courier"]}>
      <CourierPanel />
    </StaffGuard>
  );
}
