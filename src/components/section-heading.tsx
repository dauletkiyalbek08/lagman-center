import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface SectionHeadingProps {
  /** Белая часть заголовка, напр. «НАШИ» */
  pre?: string;
  /** Красная часть заголовка, напр. «ЗАВЕДЕНИЯ» */
  accent?: string;
  /** Элемент справа (например, кнопка «Смотреть всё меню») */
  action?: ReactNode;
  className?: string;
}

export function SectionHeading({
  pre,
  accent,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 mb-8",
        className,
      )}
    >
      <h2 className="font-heading text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
        {pre && <span className="text-white">{pre} </span>}
        {accent && <span className="text-primary">{accent}</span>}
      </h2>
      {action}
    </div>
  );
}
