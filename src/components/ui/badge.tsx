import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        "border-line bg-surface-2 text-muted",
        className,
      )}
      {...props}
    />
  );
}
