"use client";

import { SectionHeading } from "@/components/section-heading";
import { DemoBanner } from "@/components/staff/demo-banner";
import { StatusBadge } from "@/components/staff/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABELS } from "@/lib/constants";
import { fetchMyOrders, subscribeOrders } from "@/lib/data";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { Order, Role } from "@/lib/types";
import {
  Bike,
  ChefHat,
  LayoutDashboard,
  LogOut,
  Mail,
  Phone,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STAFF_PANELS: Partial<
  Record<Role, { href: string; label: string; icon: typeof LayoutDashboard }>
> = {
  admin: { href: "/admin", label: "Панель администратора", icon: LayoutDashboard },
  kitchen: { href: "/kitchen", label: "Панель кухни", icon: ChefHat },
  courier: { href: "/courier", label: "Панель курьера", icon: Bike },
};

function OrderCard({ order }: { order: Order }) {
  return (
    <Card>
      <CardBody>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-3">
            <span className="font-heading font-extrabold">
              {order.order_number}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <span className="text-xs text-muted">
            {formatDateTime(order.created_at)}
          </span>
        </div>

        <ul className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-baseline justify-between gap-3"
            >
              <span className="text-white/90">
                {item.name_snapshot}{" "}
                <span className="text-muted">× {item.quantity}</span>
              </span>
              <span className="shrink-0 text-muted">
                {formatPrice(item.price_snapshot * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
          <span className="text-muted">Итого</span>
          <span className="font-heading text-base font-extrabold">
            {formatPrice(order.total)}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}

export default function AccountPage() {
  const { demo, loading, user, profile, signOut } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const needsLogin = !demo && !loading && !user;

  useEffect(() => {
    if (needsLogin) {
      router.replace("/login");
    }
  }, [needsLogin, router]);

  useEffect(() => {
    let active = true;
    const load = () =>
      fetchMyOrders().then((data) => {
        if (active) setOrders(data);
      });
    load();
    const unsubscribe = subscribeOrders(load);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (!demo && (loading || !user)) {
    return (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <PageLoader />
      </section>
    );
  }

  const role: Role = profile?.role ?? "customer";
  const panel = STAFF_PANELS[role];

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.push("/");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        {demo && <DemoBanner />}

        <SectionHeading pre="Личный" accent="кабинет" className="mb-0" />

        {/* Профиль (скрыт в демо-режиме) */}
        {!demo && (
          <Card>
            <CardBody className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h2 className="font-heading text-xl font-extrabold uppercase tracking-tight">
                      {profile?.name || "Без имени"}
                    </h2>
                    <Badge>{ROLE_LABELS[role]}</Badge>
                  </div>
                  <ul className="space-y-1.5 text-sm text-muted">
                    <li className="flex items-center gap-2">
                      <Mail className="size-4 shrink-0" aria-hidden />
                      <span className="break-all">{user?.email ?? "—"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Phone className="size-4 shrink-0" aria-hidden />
                      <span>{profile?.phone || "Телефон не указан"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <UserRound className="size-4 shrink-0" aria-hidden />
                      <span>Роль: {ROLE_LABELS[role]}</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  {panel && (
                    <Link
                      href={panel.href}
                      className={buttonClasses("primary", "md")}
                    >
                      <panel.icon className="size-4" aria-hidden />
                      Перейти в панель
                    </Link>
                  )}
                  <Button
                    variant="danger"
                    onClick={handleSignOut}
                    disabled={signingOut}
                  >
                    <LogOut className="size-4" aria-hidden />
                    Выйти
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Мои заказы */}
        <div>
          <SectionHeading pre="Мои" accent="заказы" className="mb-6" />

          {orders === null ? (
            <PageLoader label="Загружаем заказы…" />
          ) : orders.length === 0 ? (
            <Card>
              <CardBody className="p-8 text-center">
                <UtensilsCrossed
                  className="mx-auto mb-4 size-10 text-muted"
                  aria-hidden
                />
                <p className="font-heading text-lg font-extrabold uppercase mb-2">
                  Заказов пока нет
                </p>
                <p className="text-sm text-muted mb-6">
                  Выберите блюда в меню — и мы приготовим их для вас.
                </p>
                <Link href="/menu" className={buttonClasses("primary", "md")}>
                  Перейти в меню
                </Link>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
