"use client";

import { StatusBadge } from "@/components/staff/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { updateOrderStatus } from "@/lib/data";
import { formatPrice, formatTime } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import {
  BellRing,
  ChevronDown,
  CreditCard,
  History,
  Inbox,
  MapPin,
  MessageSquare,
  Phone,
  User,
} from "lucide-react";
import { useState } from "react";

const KANBAN_COLUMNS: Array<{ status: OrderStatus; title: string }> = [
  { status: "new", title: "Новые" },
  { status: "cooking", title: "Готовятся" },
  { status: "ready", title: "Готовы" },
  { status: "delivering", title: "В пути" },
];

interface OrdersTabProps {
  orders: Order[] | null;
  refetch: () => void;
}

export function OrdersTab({ orders, refetch }: OrdersTabProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  if (!orders) return <PageLoader label="Загружаем заказы…" />;

  const setStatus = async (id: string, status: OrderStatus) => {
    setBusyId(id);
    try {
      await updateOrderStatus(id, status);
      refetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось обновить заказ");
    } finally {
      setBusyId(null);
    }
  };

  const accept = (o: Order) => setStatus(o.id, "cooking");
  const markReady = (o: Order) => setStatus(o.id, "ready");
  const cancel = (o: Order) => {
    if (window.confirm(`Отменить заказ ${o.order_number}?`)) {
      setStatus(o.id, "cancelled");
    }
  };

  const newOrders = orders.filter((o) => o.status === "new");

  const todayKey = new Date().toDateString();
  const history = orders.filter(
    (o) =>
      (o.status === "delivered" || o.status === "cancelled") &&
      new Date(o.created_at).toDateString() === todayKey,
  );

  return (
    <div className="space-y-8">
      {/* Новые заявки */}
      {newOrders.length > 0 && (
        <section aria-label="Новые заявки">
          <h3 className="mb-4 flex items-center gap-2 font-heading text-lg font-extrabold uppercase">
            <BellRing className="size-5 text-primary" aria-hidden />
            Новые заявки
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold">
              {newOrders.length}
            </span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {newOrders.map((o) => (
              <Card key={o.id} className="border-primary/50">
                <CardBody className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-heading text-lg font-extrabold">
                      {o.order_number}
                    </span>
                    <span className="text-sm text-muted">
                      {formatTime(o.created_at)}
                    </span>
                  </div>
                  <OrderDetails order={o} />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      disabled={busyId === o.id}
                      onClick={() => accept(o)}
                    >
                      Принять → на кухню
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={busyId === o.id}
                      onClick={() => cancel(o)}
                    >
                      Отменить
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Kanban активных заказов */}
      <section aria-label="Активные заказы">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {KANBAN_COLUMNS.map(({ status, title }) => {
            const columnOrders = orders.filter((o) => o.status === status);
            return (
              <div
                key={status}
                className="rounded-card border border-line bg-surface/50 p-3"
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h4 className="font-heading text-sm font-extrabold uppercase tracking-wide">
                    {title}
                  </h4>
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-surface-2 px-2 text-xs font-bold text-muted">
                    {columnOrders.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {columnOrders.length === 0 && (
                    <p className="px-1 py-4 text-center text-xs text-muted/70">
                      Пусто
                    </p>
                  )}
                  {columnOrders.map((o) => {
                    const expanded = expandedId === o.id;
                    return (
                      <Card key={o.id} className="bg-surface">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(expanded ? null : o.id)
                          }
                          aria-expanded={expanded}
                          className="block w-full cursor-pointer p-3 text-left transition-colors hover:bg-white/[0.03]"
                        >
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="font-heading text-sm font-extrabold">
                              {o.order_number}
                            </span>
                            <StatusBadge status={o.status} />
                          </div>
                          <div className="flex items-center justify-between gap-2 text-xs text-muted">
                            <span className="truncate">
                              {formatTime(o.created_at)} · {o.customer_name}
                            </span>
                            <span className="flex items-center gap-1 whitespace-nowrap font-semibold text-white">
                              {formatPrice(o.total)}
                              <ChevronDown
                                className={cn(
                                  "size-3.5 text-muted transition-transform",
                                  expanded && "rotate-180",
                                )}
                                aria-hidden
                              />
                            </span>
                          </div>
                        </button>
                        {expanded && (
                          <div className="space-y-3 border-t border-line p-3">
                            <OrderDetails order={o} compact />
                            {o.status === "new" && (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  disabled={busyId === o.id}
                                  onClick={() => accept(o)}
                                >
                                  Принять → на кухню
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  disabled={busyId === o.id}
                                  onClick={() => cancel(o)}
                                >
                                  Отменить
                                </Button>
                              </div>
                            )}
                            {o.status === "cooking" && (
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={busyId === o.id}
                                onClick={() => markReady(o)}
                              >
                                Готов
                              </Button>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* История за сегодня */}
      <section aria-label="История заказов за сегодня">
        <button
          type="button"
          onClick={() => setHistoryOpen((v) => !v)}
          aria-expanded={historyOpen}
          className="flex w-full cursor-pointer items-center justify-between rounded-card border border-line bg-surface px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
        >
          <span className="flex items-center gap-2 font-heading text-sm font-extrabold uppercase tracking-wide">
            <History className="size-4 text-muted" aria-hidden />
            История за сегодня
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-2 px-1.5 text-xs font-bold text-muted">
              {history.length}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-muted transition-transform",
              historyOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        {historyOpen && (
          <div className="mt-2 overflow-hidden rounded-card border border-line bg-surface">
            {history.length === 0 ? (
              <p className="flex items-center gap-2 px-4 py-5 text-sm text-muted">
                <Inbox className="size-4" aria-hidden />
                Сегодня завершённых заказов пока нет.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {history.map((o) => (
                  <li
                    key={o.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm"
                  >
                    <span className="font-heading font-extrabold">
                      {o.order_number}
                    </span>
                    <span className="text-muted">{formatTime(o.created_at)}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {o.customer_name}
                    </span>
                    <span className="font-semibold">{formatPrice(o.total)}</span>
                    <StatusBadge status={o.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

/** Детали заказа: контакты, состав, оплата, комментарий. */
function OrderDetails({
  order,
  compact = false,
}: {
  order: Order;
  compact?: boolean;
}) {
  return (
    <div className={cn("space-y-3", compact ? "text-xs" : "text-sm")}>
      <div className="space-y-1.5">
        <p className="flex items-center gap-2">
          <User className="size-4 shrink-0 text-muted" aria-hidden />
          {order.customer_name}
        </p>
        <p className="flex items-center gap-2">
          <Phone className="size-4 shrink-0 text-muted" aria-hidden />
          <a
            href={`tel:${order.phone.replace(/[^\d+]/g, "")}`}
            className="text-white underline decoration-white/30 underline-offset-2 transition-colors hover:decoration-primary"
          >
            {order.phone}
          </a>
        </p>
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
          {order.address}
        </p>
      </div>

      <ul className="space-y-1 rounded-btn bg-surface-2 px-3 py-2.5">
        {order.items.map((it) => (
          <li key={it.id} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 flex-1">
              {it.name_snapshot}{" "}
              <span className="whitespace-nowrap text-muted">
                × {it.quantity}
              </span>
            </span>
            <span className="whitespace-nowrap text-muted">
              {formatPrice(it.price_snapshot * it.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-muted">
          <CreditCard className="size-4" aria-hidden />
          {PAYMENT_METHOD_LABELS[order.payment_method]}
        </span>
        <span
          className={cn(
            "font-heading font-extrabold",
            compact ? "text-sm" : "text-base",
          )}
        >
          {formatPrice(order.total)}
        </span>
      </div>

      {order.comment && (
        <p className="flex items-start gap-2 rounded-btn border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-300">
          <MessageSquare className="mt-0.5 size-4 shrink-0" aria-hidden />
          {order.comment}
        </p>
      )}
    </div>
  );
}
