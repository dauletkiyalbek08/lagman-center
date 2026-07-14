"use client";

import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { ESTABLISHMENTS } from "@/lib/constants";
import { createReservation } from "@/lib/data";
import { CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";

/** Локальная дата «сегодня» в формате YYYY-MM-DD (для min у input[type=date]). */
function todayLocal(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const OPEN_TIME = "10:00";
const CLOSE_TIME = "23:00";

const GUEST_OPTIONS = [
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  })),
  { value: "13", label: "12+" },
];

interface FormState {
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: string;
  establishment_id: string;
}

const INITIAL_STATE: FormState = {
  name: "",
  phone: "",
  date: "",
  time: "",
  guests: "2",
  establishment_id: ESTABLISHMENTS[0].id,
};

export function BookingForm({ className }: { className?: string }) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof FormState) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.date ||
      !form.time ||
      !form.guests ||
      !form.establishment_id
    ) {
      setError("Пожалуйста, заполните все обязательные поля.");
      return;
    }

    // noValidate отключает встроенные min/max — проверяем сами
    if (form.date < todayLocal()) {
      setError("Выберите сегодняшнюю или будущую дату.");
      return;
    }
    if (form.time < OPEN_TIME || form.time > CLOSE_TIME) {
      setError(`Мы работаем с ${OPEN_TIME} до ${CLOSE_TIME}.`);
      return;
    }

    setSubmitting(true);
    try {
      await createReservation({
        name: form.name.trim(),
        phone: form.phone.trim(),
        date: form.date,
        time: form.time,
        guests: Number(form.guests),
        establishment_id: form.establishment_id,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось отправить заявку. Попробуйте ещё раз.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 py-10 text-center",
          className,
        )}
      >
        <CheckCircle2 className="size-14 text-emerald-400" aria-hidden />
        <p className="font-heading text-xl font-extrabold uppercase">
          Заявка на бронь отправлена!
        </p>
        <p className="text-sm text-muted">
          Мы свяжемся с вами для подтверждения брони.
        </p>
        <Button
          variant="ghost"
          className="mt-2"
          onClick={() => {
            setForm(INITIAL_STATE);
            setSuccess(false);
          }}
        >
          Забронировать ещё
        </Button>
      </div>
    );
  }

  return (
    <form className={cn("text-left", className)} onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label htmlFor="booking-name">Имя *</Label>
          <Input
            id="booking-name"
            name="name"
            placeholder="Ваше имя"
            autoComplete="name"
            required
            value={form.name}
            onChange={(e) => set("name")(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="booking-phone">Телефон *</Label>
          <Input
            id="booking-phone"
            name="phone"
            type="tel"
            placeholder="+7 ___ ___ __ __"
            autoComplete="tel"
            required
            value={form.phone}
            onChange={(e) => set("phone")(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="booking-date">Дата *</Label>
          <Input
            id="booking-date"
            name="date"
            type="date"
            min={todayLocal()}
            required
            value={form.date}
            onChange={(e) => set("date")(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="booking-time">Время *</Label>
          <Input
            id="booking-time"
            name="time"
            type="time"
            min={OPEN_TIME}
            max={CLOSE_TIME}
            required
            value={form.time}
            onChange={(e) => set("time")(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-muted">Работаем с 10:00 до 23:00</p>
        </div>
        <div>
          <Label htmlFor="booking-guests">Количество гостей *</Label>
          <Select
            id="booking-guests"
            name="guests"
            required
            value={form.guests}
            onChange={(e) => set("guests")(e.target.value)}
          >
            {GUEST_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="booking-establishment">Выберите заведение *</Label>
          <Select
            id="booking-establishment"
            name="establishment_id"
            required
            value={form.establishment_id}
            onChange={(e) => set("establishment_id")(e.target.value)}
          >
            {ESTABLISHMENTS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-primary" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="mt-6 w-full sm:w-auto"
      >
        {submitting && <Spinner className="size-4" />}
        {submitting ? "Отправляем…" : "Забронировать"}
      </Button>
    </form>
  );
}
