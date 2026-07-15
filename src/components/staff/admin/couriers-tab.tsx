"use client";

import { Stars } from "@/components/delivery/rating-box";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { computeCourierStats } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import type { CourierStats, Order, StaffMember } from "@/lib/types";
import {
  BadgeCheck,
  Ban,
  CheckCircle2,
  Clock,
  Package,
  Star,
  Truck,
  UserRound,
} from "lucide-react";

function courierInitial(c: CourierStats): string {
  return (c.name || c.email).trim().charAt(0).toUpperCase() || "?";
}

/** Точка статуса + подпись «В пути (N) / Свободен». */
function OnlineDot({ online }: { online: boolean }) {
  return (
    <span
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-full",
        online ? "bg-emerald-400" : "bg-muted/50",
      )}
      aria-hidden
    />
  );
}

function statusText(c: CourierStats): string {
  if (c.active > 0) {
    const word =
      c.active === 1 ? "заказ" : c.active < 5 ? "заказа" : "заказов";
    return `В пути (${c.active} ${word})`;
  }
  return "Свободен";
}

/**
 * Компактный список «Курьеры на линии» для боковой колонки в заказах —
 * как на референсе: аватар-буква, имя, статус и точка онлайна.
 */
export function CouriersOnline({
  couriers,
  orders,
}: {
  couriers: StaffMember[];
  orders: Order[];
}) {
  const stats = computeCourierStats(couriers, orders).sort(
    (a, b) => Number(b.online) - Number(a.online) || b.active - a.active,
  );

  return (
    <Card>
      <CardBody className="p-5">
        <h3 className="mb-4 flex items-center gap-2 font-heading text-base font-extrabold uppercase">
          <Truck className="size-4 text-primary" aria-hidden />
          Курьеры на линии
        </h3>
        {stats.length === 0 ? (
          <p className="text-sm text-muted">
            Курьеров пока нет. Добавьте их во вкладке «Персонал».
          </p>
        ) : (
          <ul className="space-y-3">
            {stats.map((c) => (
              <li key={c.id} className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 font-heading text-sm font-bold text-muted">
                  {courierInitial(c)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {c.name || c.email}
                  </p>
                  <p className="truncate text-xs text-muted">{statusText(c)}</p>
                </div>
                <OnlineDot online={c.online} />
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

/** Плитки «Статистика за сегодня»: заказы, доставлено, в пути, отменено, выручка. */
export function TodayStats({ orders }: { orders: Order[] }) {
  const todayKey = new Date().toDateString();
  const today = orders.filter(
    (o) => new Date(o.created_at).toDateString() === todayKey,
  );
  const delivered = today.filter((o) => o.status === "delivered");
  const inTransit = today.filter((o) => o.status === "delivering");
  const cancelled = today.filter((o) => o.status === "cancelled");
  // выручка — по завершённым (доставлен/подан/выдан)
  const revenue = delivered.reduce((s, o) => s + o.total, 0);

  const tiles: Array<{
    label: string;
    value: string;
    icon: typeof Package;
    color: string;
  }> = [
    { label: "Заказов", value: String(today.length), icon: Package, color: "text-white" },
    {
      label: "Завершено",
      value: String(delivered.length),
      icon: CheckCircle2,
      color: "text-emerald-400",
    },
    {
      label: "В пути",
      value: String(inTransit.length),
      icon: Truck,
      color: "text-violet-400",
    },
    {
      label: "Отменено",
      value: String(cancelled.length),
      icon: Ban,
      color: "text-primary",
    },
  ];

  return (
    <Card>
      <CardBody className="p-5">
        <h3 className="mb-4 flex items-center gap-2 font-heading text-base font-extrabold uppercase">
          <Clock className="size-4 text-primary" aria-hidden />
          Статистика за сегодня
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {tiles.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-card border border-line bg-surface-2 p-3"
            >
              <Icon className={cn("mb-1.5 size-4", color)} aria-hidden />
              <p className="font-heading text-2xl font-extrabold leading-none">
                {value}
              </p>
              <p className="mt-1 text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-card border border-line bg-surface-2 px-3 py-2.5">
          <span className="text-sm text-muted">Выручка за день</span>
          <span className="font-heading text-lg font-extrabold">
            {formatPrice(revenue)}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}

/** Полная вкладка «Курьеры»: карточка на каждого + свежие отзывы. */
export function CouriersTab({
  couriers,
  orders,
}: {
  couriers: StaffMember[];
  orders: Order[];
}) {
  const stats = computeCourierStats(couriers, orders).sort(
    (a, b) => b.deliveredTotal - a.deliveredTotal,
  );

  // свежие отзывы по доставке (последние оценённые заказы курьеров)
  const reviews = orders
    .filter((o) => o.courier_id && o.rating != null)
    .sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .slice(0, 6);

  const nameById = new Map(couriers.map((c) => [c.id, c.name || c.email]));

  if (couriers.length === 0) {
    return (
      <Card>
        <CardBody className="py-14 text-center">
          <Truck className="mx-auto mb-4 size-10 text-muted/60" aria-hidden />
          <p className="font-heading text-lg font-extrabold uppercase">
            Курьеров пока нет
          </p>
          <p className="mt-2 text-sm text-muted">
            Добавьте курьеров во вкладке «Персонал» — здесь появится их
            статистика и рейтинг.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((c) => (
          <Card key={c.id}>
            <CardBody className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2 font-heading text-lg font-bold text-muted">
                  {courierInitial(c)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-base font-extrabold">
                    {c.name || c.email}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    <OnlineDot online={c.online} />
                    {statusText(c)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-card border border-line bg-surface-2 py-2.5">
                  <p className="font-heading text-xl font-extrabold">
                    {c.deliveredToday}
                  </p>
                  <p className="text-[11px] text-muted">Сегодня</p>
                </div>
                <div className="rounded-card border border-line bg-surface-2 py-2.5">
                  <p className="font-heading text-xl font-extrabold">
                    {c.deliveredTotal}
                  </p>
                  <p className="text-[11px] text-muted">Всего</p>
                </div>
                <div className="rounded-card border border-line bg-surface-2 py-2.5">
                  <p className="flex items-center justify-center gap-1 font-heading text-xl font-extrabold">
                    {c.rating != null ? (
                      <>
                        {c.rating.toFixed(1)}
                        <Star
                          className="size-3.5 fill-amber-400 text-amber-400"
                          aria-hidden
                        />
                      </>
                    ) : (
                      "—"
                    )}
                  </p>
                  <p className="text-[11px] text-muted">
                    Рейтинг{c.ratingCount ? ` · ${c.ratingCount}` : ""}
                  </p>
                </div>
              </div>

              {c.phone && (
                <a
                  href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                  className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary"
                >
                  <UserRound className="size-4" aria-hidden />
                  {c.phone}
                </a>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      {reviews.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 font-heading text-base font-extrabold uppercase">
            <BadgeCheck className="size-4 text-primary" aria-hidden />
            Последние оценки
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {reviews.map((o) => (
              <Card key={o.id}>
                <CardBody className="p-4">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">
                      {nameById.get(o.courier_id!) ?? "Курьер"}
                    </span>
                    <Stars value={o.rating ?? 0} size="size-4" />
                  </div>
                  <p className="text-xs text-muted">
                    {o.order_number}
                    {o.review_comment ? ` · «${o.review_comment}»` : ""}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
