"use client";

import { StaffGuard } from "@/components/staff/staff-guard";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import { CONTACTS } from "@/lib/constants";
import { fetchTables } from "@/lib/data";
import { tableQrDataUrl } from "@/lib/qr";
import type { Table } from "@/lib/types";
import { Printer } from "lucide-react";
import { useEffect, useState } from "react";

interface Card {
  table: Table;
  qr: string;
}

/**
 * Печатная страница: карточка на каждый стол — QR, номер, короткая инструкция.
 * Распечатать, разрезать и поставить на столы.
 */
function QrSheet() {
  const [cards, setCards] = useState<Card[] | null>(null);

  useEffect(() => {
    let active = true;
    fetchTables()
      .then(async (tables) => {
        const withQr = await Promise.all(
          tables
            .filter((t) => t.is_active)
            .map(async (table) => ({
              table,
              qr: await tableQrDataUrl(table.code),
            })),
        );
        if (active) setCards(withQr);
      })
      .catch(() => {
        if (active) setCards([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!cards) return <PageLoader label="Готовим QR-коды…" />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-heading text-xl font-extrabold uppercase">
            QR-коды столов
          </h1>
          <p className="mt-1 text-sm text-muted">
            Распечатайте, разрежьте по карточкам и поставьте на столы. Гость
            сканирует код — открывается меню, заказ уходит на кухню.
          </p>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden />
          Печать
        </Button>
      </div>

      {cards.length === 0 ? (
        <p className="text-sm text-muted print:hidden">
          Столов нет. Добавьте их в разделе «Столы».
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 print:grid-cols-2 print:gap-3">
          {cards.map(({ table, qr }) => (
            <div
              key={table.id}
              className="flex break-inside-avoid flex-col items-center gap-2 rounded-card border border-line bg-white p-5 text-center text-black print:border-black/20"
            >
              <p className="font-heading text-2xl font-extrabold uppercase">
                Стол №{table.number}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wide text-black/50">
                Меню и заказ без официанта
              </p>
              {/* data-URL: оптимизировать next/image тут нечего */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                alt={`QR-код стола №${table.number}`}
                className="size-40 print:size-36"
              />
              <p className="text-sm font-semibold">
                Наведите камеру телефона на код
              </p>
              <p className="text-xs text-black/60">
                Выберите блюда → «Отправить на кухню». Оплата на кассе.
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide">
                Lagman Center · {CONTACTS.phone}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QrPage() {
  return (
    <StaffGuard allow={["admin"]}>
      <QrSheet />
    </StaffGuard>
  );
}
