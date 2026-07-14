"use client";

import { buttonClasses } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import { fetchTableByCode } from "@/lib/data";
import { saveTableSession } from "@/lib/table-session";
import { QrCode } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Гость отсканировал QR на столе. Проверяем код, запоминаем стол
 * и отправляем в меню — регистрация не нужна.
 */
export function TableGate({ code }: { code: string }) {
  const router = useRouter();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    fetchTableByCode(code)
      .then((table) => {
        if (!active) return;
        if (!table) {
          setNotFound(true);
          return;
        }
        saveTableSession(table, code);
        router.replace("/menu");
      })
      .catch(() => {
        if (active) setNotFound(true);
      });
    return () => {
      active = false;
    };
  }, [code, router]);

  if (!notFound) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <PageLoader label="Открываем меню…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
      <QrCode className="mx-auto mb-4 size-12 text-primary" aria-hidden />
      <h1 className="font-heading text-2xl font-extrabold uppercase">
        Стол не найден
      </h1>
      <p className="mt-3 text-sm text-muted">
        Возможно, QR-код устарел. Отсканируйте код на столе ещё раз или
        обратитесь к персоналу — меню всё равно можно посмотреть.
      </p>
      <Link href="/menu" className={buttonClasses("primary", "md", "mt-6")}>
        Открыть меню
      </Link>
    </div>
  );
}
