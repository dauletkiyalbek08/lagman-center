"use client";

import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { ESTABLISHMENTS, RESERVATION_STATUS_LABELS } from "@/lib/constants";
import { updateReservationStatus } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { Reservation, ReservationStatus } from "@/lib/types";
import { CalendarClock, Clock, MapPin, Phone, Users } from "lucide-react";
import { useState } from "react";

const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
  new: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-primary/15 text-primary border-primary/30",
};

function guestsLabel(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} гость`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} гостя`;
  return `${n} гостей`;
}

interface ReservationsTabProps {
  reservations: Reservation[] | null;
  refetch: () => void;
}

export function ReservationsTab({
  reservations,
  refetch,
}: ReservationsTabProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!reservations) return <PageLoader label="Загружаем брони…" />;

  const setStatus = async (id: string, status: ReservationStatus) => {
    setBusyId(id);
    try {
      await updateReservationStatus(id, status);
      refetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось обновить бронь");
    } finally {
      setBusyId(null);
    }
  };

  if (reservations.length === 0) {
    return (
      <Card>
        <CardBody className="py-14 text-center">
          <CalendarClock
            className="mx-auto mb-4 size-10 text-muted/60"
            aria-hidden
          />
          <p className="font-heading text-lg font-extrabold uppercase">
            Броней пока нет
          </p>
          <p className="mt-2 text-sm text-muted">
            Новые заявки на бронирование столов появятся здесь автоматически.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reservations.map((r) => {
        const establishment = ESTABLISHMENTS.find(
          (e) => e.id === r.establishment_id,
        );
        return (
          <Card
            key={r.id}
            className={cn(r.status === "new" && "border-blue-500/40")}
          >
            <CardBody className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-heading font-extrabold">{r.name}</p>
                <span
                  className={cn(
                    "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                    RESERVATION_STATUS_COLORS[r.status],
                  )}
                >
                  {RESERVATION_STATUS_LABELS[r.status]}
                </span>
              </div>

              <div className="space-y-1.5 text-sm">
                <p className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0 text-muted" aria-hidden />
                  <a
                    href={`tel:${r.phone.replace(/[^\d+]/g, "")}`}
                    className="underline decoration-white/30 underline-offset-2 transition-colors hover:decoration-primary"
                  >
                    {r.phone}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0 text-muted" aria-hidden />
                  {formatDate(r.date)}, {r.time}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="size-4 shrink-0 text-muted" aria-hidden />
                  {guestsLabel(r.guests)}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="size-4 shrink-0 text-muted" aria-hidden />
                  {establishment?.name ?? "Заведение не указано"}
                </p>
              </div>

              {r.status === "new" && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    disabled={busyId === r.id}
                    onClick={() => setStatus(r.id, "confirmed")}
                  >
                    Подтвердить
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={busyId === r.id}
                    onClick={() => setStatus(r.id, "cancelled")}
                  >
                    Отменить
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
