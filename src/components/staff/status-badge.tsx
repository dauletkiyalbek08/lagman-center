import { cn } from "@/lib/cn";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
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
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
