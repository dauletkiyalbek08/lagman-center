"use client";

import { SectionHeading } from "@/components/section-heading";
import { OrderTicket } from "@/components/staff/order-ticket";
import { StaffGuard } from "@/components/staff/staff-guard";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import { fetchOrders, subscribeOrders, updateOrderStatus } from "@/lib/data";
import type { Order } from "@/lib/types";
import { Check, ChefHat, Flame } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

function KitchenPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

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

  // «Минут в работе» обновляем раз в минуту
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Только заказы в работе, старые сверху — их готовим первыми
  const cooking = useMemo(
    () =>
      orders
        .filter((o) => o.status === "cooking")
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
    [orders],
  );

  const minutesInWork = (order: Order) =>
    Math.max(0, Math.floor((now - new Date(order.created_at).getTime()) / 60_000));

  const markReady = async (id: string) => {
    setPendingId(id);
    try {
      await updateOrderStatus(id, "ready");
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <SectionHeading
        pre="ПАНЕЛЬ"
        accent="КУХНИ"
        className="mb-2"
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/15 px-4 py-1.5 text-sm font-bold text-amber-400">
            <Flame className="size-4" aria-hidden />
            В работе: {cooking.length}
          </span>
        }
      />
      <p className="mb-8 text-sm text-muted">
        Заказы в работе. Новые появляются автоматически.
      </p>

      {loading ? (
        <PageLoader />
      ) : cooking.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-surface px-6 py-20 text-center">
          <ChefHat className="mx-auto mb-4 size-14 text-muted" aria-hidden />
          <p className="font-heading text-xl font-extrabold uppercase">
            Нет заказов в работе
          </p>
          <p className="mt-2 text-sm text-muted">
            Новые заказы появятся здесь автоматически
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cooking.map((order) => (
            <OrderTicket
              key={order.id}
              order={order}
              largeItems
              showComment
              meta={
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-sm font-bold text-amber-400">
                  <Flame className="size-4" aria-hidden />
                  {minutesInWork(order)} мин
                </span>
              }
            >
              <Button
                variant="success"
                size="lg"
                className="w-full"
                disabled={pendingId === order.id}
                onClick={() => markReady(order.id)}
              >
                Готово <Check className="size-5" aria-hidden />
              </Button>
            </OrderTicket>
          ))}
        </div>
      )}
    </div>
  );
}

export default function KitchenPage() {
  return (
    <StaffGuard allow={["kitchen"]}>
      <KitchenPanel />
    </StaffGuard>
  );
}
