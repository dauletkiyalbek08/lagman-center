"use client";

import { SectionHeading } from "@/components/section-heading";
import { cn } from "@/lib/cn";
import {
  fetchOrders,
  fetchReservations,
  subscribeOrders,
  subscribeReservations,
} from "@/lib/data";
import type { Order, Reservation } from "@/lib/types";
import {
  CalendarClock,
  ClipboardList,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { MenuTab } from "./menu-tab";
import { OrdersTab } from "./orders-tab";
import { ReservationsTab } from "./reservations-tab";
import { StaffTab } from "./staff-tab";

type TabId = "orders" | "menu" | "reservations" | "staff";

export function AdminPanel() {
  const [tab, setTab] = useState<TabId>("orders");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [reservations, setReservations] = useState<Reservation[] | null>(null);

  const loadOrders = useCallback(() => {
    fetchOrders()
      .then(setOrders)
      .catch(() => {});
  }, []);

  const loadReservations = useCallback(() => {
    fetchReservations()
      .then(setReservations)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadOrders();
    const un = subscribeOrders(loadOrders);
    return un;
  }, [loadOrders]);

  useEffect(() => {
    loadReservations();
    const un = subscribeReservations(loadReservations);
    return un;
  }, [loadReservations]);

  const newOrdersCount =
    orders?.filter((o) => o.status === "new").length ?? 0;
  const newReservationsCount =
    reservations?.filter((r) => r.status === "new").length ?? 0;

  const tabs: Array<{
    id: TabId;
    label: string;
    icon: typeof ClipboardList;
    badge: number;
  }> = [
    { id: "orders", label: "Заказы", icon: ClipboardList, badge: newOrdersCount },
    { id: "menu", label: "Меню", icon: UtensilsCrossed, badge: 0 },
    {
      id: "reservations",
      label: "Брони",
      icon: CalendarClock,
      badge: newReservationsCount,
    },
    { id: "staff", label: "Персонал", icon: Users, badge: 0 },
  ];

  return (
    <div className="space-y-6">
      <SectionHeading pre="Панель" accent="Администратора" className="mb-2" />

      <div
        className="flex gap-1 overflow-x-auto border-b border-line pb-px"
        role="tablist"
        aria-label="Разделы панели администратора"
      >
        {tabs.map(({ id, label, icon: Icon, badge }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-2 rounded-t-btn border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "border-primary text-white"
                  : "border-transparent text-muted hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
              {badge > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "orders" && <OrdersTab orders={orders} refetch={loadOrders} />}
      {tab === "menu" && <MenuTab />}
      {tab === "reservations" && (
        <ReservationsTab
          reservations={reservations}
          refetch={loadReservations}
        />
      )}
      {tab === "staff" && <StaffTab />}
    </div>
  );
}
