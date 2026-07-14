import { cn } from "@/lib/cn";
import { ORDER_STATUS_COLORS, orderStatusLabel } from "@/lib/constants";
import type { OrderStatus, OrderType } from "@/lib/types";

export function StatusBadge({
  status,
  type = "delivery",
  className,
}: {
  status: OrderStatus;
  /** В зале заказ «подают», а не «доставляют» — подпись отличается */
  type?: OrderType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        ORDER_STATUS_COLORS[status],
        className,
      )}
    >
      {orderStatusLabel(status, type)}
    </span>
  );
}
