"use client";

import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/field";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import {
  createTable,
  deleteTable,
  fetchTables,
  subscribeTables,
  updateTable,
} from "@/lib/data";
import { tableQrDataUrl, tableQrUrl } from "@/lib/qr";
import type { Order, Reservation, Table } from "@/lib/types";
import {
  Download,
  Plus,
  Printer,
  QrCode,
  Trash2,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type TableState = "free" | "occupied" | "reserved";

const STATE_STYLES: Record<TableState, string> = {
  free: "border-line bg-surface",
  occupied: "border-primary/50 bg-primary/10",
  reserved: "border-amber-500/50 bg-amber-500/10",
};

const STATE_LABELS: Record<TableState, string> = {
  free: "Свободен",
  occupied: "Заняты гости",
  reserved: "Забронирован",
};

const STATE_BADGES: Record<TableState, string> = {
  free: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  occupied: "border-primary/40 bg-primary/15 text-primary",
  reserved: "border-amber-500/40 bg-amber-500/15 text-amber-400",
};

/** Заказ «живой», пока его не подали и не отменили. */
const ACTIVE_STATUSES = new Set(["new", "cooking", "ready"]);

/**
 * Бронь считается актуальной, если она на сегодня и её время ещё не прошло
 * (плюс час на опоздания) — чтобы вчерашние брони не красили стол вечно.
 */
function activeReservationFor(
  table: Table,
  reservations: Reservation[],
  now: Date,
): Reservation | undefined {
  const today = now.toISOString().slice(0, 10);
  return reservations.find((r) => {
    if (r.table_id !== table.id) return false;
    if (r.status === "cancelled") return false;
    if (r.date !== today) return false;
    const [h, m] = r.time.split(":").map(Number);
    if (Number.isNaN(h)) return true;
    const end = new Date(now);
    end.setHours(h, (m || 0) + 60, 0, 0);
    return end.getTime() >= now.getTime();
  });
}

interface TablesTabProps {
  orders: Order[] | null;
  reservations: Reservation[] | null;
}

export function TablesTab({ orders, reservations }: TablesTabProps) {
  const [tables, setTables] = useState<Table[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [qrFor, setQrFor] = useState<Table | null>(null);
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(() => {
    fetchTables()
      .then((list) => {
        setTables(list);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Не удалось загрузить столы");
      });
  }, []);

  useEffect(() => {
    load();
    return subscribeTables(load);
  }, [load]);

  // Бронь «протухает» со временем — раз в минуту пересчитываем карту
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const setOccupied = async (table: Table, is_occupied: boolean) => {
    setBusyId(table.id);
    setError(null);
    try {
      await updateTable(table.id, { is_occupied });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось обновить стол");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (table: Table) => {
    if (
      !window.confirm(
        `Удалить стол №${table.number}? Его QR-код перестанет работать.`,
      )
    ) {
      return;
    }
    setBusyId(table.id);
    setError(null);
    try {
      await deleteTable(table.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить стол");
    } finally {
      setBusyId(null);
    }
  };

  if (!tables && !error) return <PageLoader label="Загружаем столы…" />;

  const activeDineIn = (orders ?? []).filter(
    (o) => o.order_type === "dine_in" && ACTIVE_STATUSES.has(o.status),
  );

  const stateOf = (table: Table): TableState => {
    const hasOrder = activeDineIn.some((o) => o.table_id === table.id);
    if (table.is_occupied || hasOrder) return "occupied";
    if (activeReservationFor(table, reservations ?? [], now)) return "reserved";
    return "free";
  };

  const list = tables ?? [];
  const counts = list.reduce(
    (acc, t) => {
      acc[stateOf(t)] += 1;
      return acc;
    },
    { free: 0, occupied: 0, reserved: 0 } as Record<TableState, number>,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {(["free", "occupied", "reserved"] as TableState[]).map((s) => (
            <span
              key={s}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold",
                STATE_BADGES[s],
              )}
            >
              {STATE_LABELS[s]}: {counts[s]}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/qr"
            target="_blank"
            className={buttonClasses("secondary", "md")}
          >
            <Printer className="size-4" aria-hidden />
            Печать QR-кодов
          </Link>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Добавить стол
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted">
        Наклейте на каждый стол его QR-код: гость отсканирует, увидит меню и
        закажет сам — без официанта и без регистрации. Заказ придёт на кухню с
        номером стола, оплата на кассе.
      </p>

      {error && (
        <p className="rounded-card border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
          {error}
        </p>
      )}

      {list.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <Users className="mx-auto mb-4 size-10 text-muted/60" aria-hidden />
            <p className="text-sm text-muted">
              Столов пока нет. Нажмите «Добавить стол» — для каждого сразу
              появится свой QR-код.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((table) => {
            const state = stateOf(table);
            const reservation = activeReservationFor(
              table,
              reservations ?? [],
              now,
            );
            const order = activeDineIn.find((o) => o.table_id === table.id);
            const busy = busyId === table.id;

            return (
              <div
                key={table.id}
                className={cn(
                  "flex flex-col gap-3 rounded-card border p-4",
                  STATE_STYLES[state],
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-heading text-2xl font-extrabold">
                      №{table.number}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                      <Users className="size-3.5" aria-hidden />
                      {table.seats} мест{table.zone ? ` · ${table.zone}` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      STATE_BADGES[state],
                    )}
                  >
                    {STATE_LABELS[state]}
                  </span>
                </div>

                {order && (
                  <p className="rounded-btn bg-black/20 px-2.5 py-1.5 text-xs">
                    Заказ{" "}
                    <span className="font-semibold">{order.order_number}</span>{" "}
                    в работе
                  </p>
                )}
                {!order && reservation && (
                  <p className="rounded-btn bg-black/20 px-2.5 py-1.5 text-xs">
                    Бронь на {reservation.time} · {reservation.name}
                  </p>
                )}

                <div className="mt-auto grid grid-cols-2 gap-2">
                  {state === "occupied" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => setOccupied(table, false)}
                    >
                      Освободить
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => setOccupied(table, true)}
                    >
                      <UserRoundCheck className="size-3.5" aria-hidden />
                      Посадить
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setQrFor(table)}
                  >
                    <QrCode className="size-3.5" aria-hidden />
                    QR-код
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="col-span-2"
                    disabled={busy}
                    onClick={() => remove(table)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Удалить стол
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formOpen && (
        <TableForm
          existing={list}
          onClose={() => setFormOpen(false)}
          onCreated={() => {
            setFormOpen(false);
            load();
          }}
        />
      )}

      {qrFor && <QrDialog table={qrFor} onClose={() => setQrFor(null)} />}
    </div>
  );
}

/** Модалка «Добавить стол». */
function TableForm({
  existing,
  onClose,
  onCreated,
}: {
  existing: Table[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const nextNumber =
    existing.reduce((max, t) => Math.max(max, t.number), 0) + 1;

  const [number, setNumber] = useState(String(nextNumber));
  const [seats, setSeats] = useState("4");
  const [zone, setZone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const num = Number(number);
    const seatCount = Number(seats);
    if (!Number.isInteger(num) || num < 1) {
      setError("Номер стола — целое число больше нуля");
      return;
    }
    if (!Number.isInteger(seatCount) || seatCount < 1) {
      setError("Количество мест — целое число больше нуля");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createTable({ number: num, seats: seatCount, zone: zone.trim() });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось добавить стол");
      setSaving(false);
    }
  };

  return (
    <Modal title="Новый стол" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="table-number">Номер стола *</Label>
            <Input
              id="table-number"
              type="number"
              min={1}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="table-seats">Мест *</Label>
            <Input
              id="table-seats"
              type="number"
              min={1}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="table-zone">
            Зал <span className="text-muted">(необязательно)</span>
          </Label>
          <Input
            id="table-zone"
            placeholder="Летняя терраса, второй этаж…"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-btn border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Spinner className="size-4 border-white/40" />}
            Добавить
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** QR-код одного стола: показать и скачать картинкой. */
function QrDialog({ table, onClose }: { table: Table; onClose: () => void }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const url = tableQrUrl(table.code);

  useEffect(() => {
    let active = true;
    tableQrDataUrl(table.code).then((src) => {
      if (active) setDataUrl(src);
    });
    return () => {
      active = false;
    };
  }, [table.code]);

  return (
    <Modal title={`QR-код · Стол №${table.number}`} onClose={onClose}>
      <div className="flex flex-col items-center gap-4">
        {dataUrl ? (
          // обычный <img>: это data-URL, оптимизировать next/image тут нечего
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={`QR-код стола №${table.number}`}
            className="size-56 rounded-card bg-white p-3"
          />
        ) : (
          <div className="flex size-56 items-center justify-center">
            <Spinner className="size-6" />
          </div>
        )}

        <p className="break-all text-center text-xs text-muted">{url}</p>

        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <a
            href={dataUrl ?? "#"}
            download={`stol-${table.number}.png`}
            className={buttonClasses("secondary", "md", "flex-1")}
            aria-disabled={!dataUrl}
          >
            <Download className="size-4" aria-hidden />
            Скачать PNG
          </a>
          <Link
            href="/admin/qr"
            target="_blank"
            className={buttonClasses("primary", "md", "flex-1")}
          >
            <Printer className="size-4" aria-hidden />
            Печать всех
          </Link>
        </div>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <Card className="w-full max-w-md">
        <CardBody className="p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h3 className="font-heading text-lg font-extrabold uppercase">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="cursor-pointer rounded-btn p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-white"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          {children}
        </CardBody>
      </Card>
    </div>
  );
}
