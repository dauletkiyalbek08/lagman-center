"use client";

import { SectionHeading } from "@/components/section-heading";
import { cn } from "@/lib/cn";
import {
  fetchOrders,
  fetchReservations,
  fetchStaff,
  subscribeOrders,
  subscribeReservations,
} from "@/lib/data";
import type { Order, Reservation, StaffMember } from "@/lib/types";
import {
  CalendarClock,
  ClipboardList,
  LayoutGrid,
  Megaphone,
  Settings,
  Truck,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CouriersTab } from "./couriers-tab";
import { MenuTab } from "./menu-tab";
import { OrdersTab } from "./orders-tab";
import { PromoTab } from "./promo-tab";
import { ReservationsTab } from "./reservations-tab";
import { SettingsTab } from "./settings-tab";
import { StaffTab } from "./staff-tab";
import { TablesTab } from "./tables-tab";

type TabId =
  | "orders"
  | "tables"
  | "menu"
  | "reservations"
  | "couriers"
  | "staff"
  | "promo"
  | "settings";

export function AdminPanel() {
  const [tab, setTab] = useState<TabId>("orders");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [couriers, setCouriers] = useState<StaffMember[]>([]);

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

  // список курьеров нужен для статистики и «Курьеров на линии»; меняется редко
  const loadCouriers = useCallback(() => {
    fetchStaff()
      .then((list) => setCouriers(list.filter((s) => s.role === "courier")))
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

  useEffect(() => {
    loadCouriers();
  }, [loadCouriers]);

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
    { id: "tables", label: "Столы", icon: LayoutGrid, badge: 0 },
    { id: "menu", label: "Меню", icon: UtensilsCrossed, badge: 0 },
    {
      id: "reservations",
      label: "Брони",
      icon: CalendarClock,
      badge: newReservationsCount,
    },
    { id: "couriers", label: "Курьеры", icon: Truck, badge: 0 },
    { id: "staff", label: "Персонал", icon: Users, badge: 0 },
    { id: "promo", label: "Баннер", icon: Megaphone, badge: 0 },
    { id: "settings", label: "Настройки", icon: Settings, badge: 0 },
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

      {tab === "orders" && (
        <OrdersTab
          orders={orders}
          couriers={couriers}
          refetch={loadOrders}
        />
      )}
      {tab === "tables" && (
        <TablesTab orders={orders} reservations={reservations} />
      )}
      {tab === "menu" && <MenuTab />}
      {tab === "reservations" && (
        <ReservationsTab
          reservations={reservations}
          refetch={loadReservations}
        />
      )}
      {tab === "couriers" && (
        <CouriersTab couriers={couriers} orders={orders ?? []} />
      )}
      {tab === "staff" && <StaffTab onChange={loadCouriers} />}
      {tab === "promo" && <PromoTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}
