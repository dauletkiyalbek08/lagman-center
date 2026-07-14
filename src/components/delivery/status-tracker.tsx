import { cn } from "@/lib/cn";
import { orderStatusLabel } from "@/lib/constants";
import type { OrderStatus, OrderType } from "@/lib/types";
import { Check, XCircle } from "lucide-react";

const DELIVERY_STEPS: OrderStatus[] = [
  "new",
  "cooking",
  "ready",
  "delivering",
  "delivered",
];

// В зале курьера нет: готовый заказ сразу подают к столу
const DINE_IN_STEPS: OrderStatus[] = ["new", "cooking", "ready", "delivered"];

/** Горизонтальный трекер статуса заказа: Новая → … → Доставлен / Подан. */
export function StatusTracker({
  status,
  type = "delivery",
}: {
  status: OrderStatus;
  type?: OrderType;
}) {
  const STEPS = type === "dine_in" ? DINE_IN_STEPS : DELIVERY_STEPS;

  if (status === "cancelled") {
    return (
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-2 text-sm font-semibold text-primary">
          <XCircle className="size-4" aria-hidden />
          Заказ отменён
        </span>
      </div>
    );
  }

  const current = STEPS.indexOf(status);

  return (
    <div className="overflow-x-auto pb-1">
      <ol className="mx-auto flex w-max items-start">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={step} className="flex items-start">
              {i > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "mt-[15px] h-0.5 w-5 sm:w-10",
                    i <= current ? "bg-primary" : "bg-line",
                  )}
                />
              )}
              <div className="flex flex-col items-center gap-1.5 px-1">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border text-xs font-bold",
                    done || active
                      ? "border-primary bg-primary text-white"
                      : "border-line bg-surface-2 text-muted",
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium whitespace-nowrap",
                    active
                      ? "text-white"
                      : done
                        ? "text-white/80"
                        : "text-muted",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {orderStatusLabel(step, type)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
