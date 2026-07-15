"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { rateOrder } from "@/lib/data";
import type { Order } from "@/lib/types";
import { Star } from "lucide-react";
import { useState } from "react";

/** Ряд звёзд 1–5. readOnly — просто показать оценку. */
export function Stars({
  value,
  onSelect,
  size = "size-6",
}: {
  value: number;
  onSelect?: (v: number) => void;
  size?: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= shown;
        const star = (
          <Star
            className={cn(
              size,
              filled ? "fill-amber-400 text-amber-400" : "text-muted/50",
            )}
            aria-hidden
          />
        );
        return onSelect ? (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="cursor-pointer p-0.5 transition-transform hover:scale-110"
            aria-label={`${n} из 5`}
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}

/**
 * Оценка заказа клиентом после доставки/выдачи: звёзды + комментарий.
 * Для доставки это оценка курьера, для зала/самовывоза — заведения.
 */
export function RatingBox({ order }: { order: Order }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // если заказ уже оценён (пришёл с рейтингом) — показываем благодарность
  const [done, setDone] = useState(order.rating != null);

  if (done) {
    return (
      <div className="rounded-card border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
        <p className="mb-2 font-heading text-base font-extrabold uppercase text-emerald-300">
          Спасибо за оценку!
        </p>
        <div className="flex justify-center">
          <Stars value={order.rating ?? rating} />
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (rating < 1) {
      setError("Поставьте оценку от 1 до 5 звёзд");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await rateOrder(order.id, { rating, comment: comment.trim() || undefined });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить оценку");
    } finally {
      setSubmitting(false);
    }
  };

  const isDelivery = order.order_type === "delivery";

  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <p className="mb-1 font-heading text-base font-extrabold uppercase">
        {isDelivery ? "Оцените курьера" : "Оцените заказ"}
      </p>
      <p className="mb-3 text-sm text-muted">
        {isDelivery
          ? "Как прошла доставка? Ваша оценка попадёт в рейтинг курьера."
          : "Всё понравилось? Поделитесь впечатлением."}
      </p>

      <Stars value={rating} onSelect={setRating} size="size-8" />

      <Textarea
        placeholder="Комментарий (необязательно)"
        rows={2}
        className="mt-3 min-h-16"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      {error && <p className="mt-2 text-sm text-primary">{error}</p>}

      <Button className="mt-3 w-full" disabled={submitting} onClick={submit}>
        {submitting && <Spinner className="size-4 border-white/40" />}
        Отправить оценку
      </Button>
    </div>
  );
}
