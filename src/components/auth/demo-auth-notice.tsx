import { buttonClasses } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Bike, ChefHat, Info, LayoutDashboard } from "lucide-react";
import Link from "next/link";

/**
 * Заглушка для /login в демо-режиме (Supabase не подключён):
 * входа нет, панели персонала открыты напрямую.
 */
export function DemoAuthNotice() {
  return (
    <Card>
      <CardBody className="p-6 sm:p-8">
        <h1 className="font-heading text-2xl font-extrabold uppercase tracking-tight mb-4">
          Вход для <span className="text-primary">персонала</span>
        </h1>
        <div className="flex items-start gap-2.5 rounded-card border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300 mb-6">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Supabase не подключён: панели открыты без входа. Форма входа
            появится после настройки (
            <code className="rounded bg-black/30 px-1 py-0.5 text-xs">
              README-SETUP.md
            </code>
            ).
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/admin" className={buttonClasses("secondary", "md")}>
            <LayoutDashboard className="size-4" aria-hidden />
            Панель администратора
          </Link>
          <Link href="/kitchen" className={buttonClasses("secondary", "md")}>
            <ChefHat className="size-4" aria-hidden />
            Панель кухни
          </Link>
          <Link href="/courier" className={buttonClasses("secondary", "md")}>
            <Bike className="size-4" aria-hidden />
            Панель курьера
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
