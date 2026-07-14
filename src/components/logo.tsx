import { cn } from "@/lib/cn";
import Link from "next/link";

/** Иконка-клош (крышка для блюд) из референса логотипа. */
function ClocheIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M3 14h18" />
      <path d="M4.5 14a7.5 7.5 0 0 1 15 0" />
      <path d="M12 6.5V5" />
      <circle cx="12" cy="4" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  /** compact — для шапки, large — для подвала/страниц */
  size?: "compact" | "large";
}

/**
 * Два разных «замка» под разные места.
 *
 * large — вертикальный стек из фирменного стиля (клош, LAGMAN / CENTER,
 * подпись). Он высокий, ~90px, и хорош там, где место есть: в подвале.
 *
 * compact — горизонтальный: клош слева, «LAGMAN CENTER» в одну строку.
 * В шапке (h-20 = 80px) вертикальный стек не помещается вовсе — обрезался
 * верхним краем, а подпись вываливалась под линию шапки на фото.
 */
export function Logo({ className, size = "compact" }: LogoProps) {
  if (size === "large") {
    return (
      <Link
        href="/"
        className={cn("inline-flex flex-col items-start leading-none", className)}
        aria-label="Lagman Center — на главную"
      >
        <ClocheIcon className="mb-1 w-8 text-white" />
        <span className="font-heading text-2xl font-black uppercase tracking-tight text-white">
          Lagman
        </span>
        <span className="font-heading text-2xl font-black uppercase tracking-tight text-primary">
          Center
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.35em] text-muted">
          Cafe Loft
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/"
      aria-label="Lagman Center — на главную"
      className={cn(
        "group inline-flex shrink-0 items-center gap-2.5 rounded-btn",
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary",
        className,
      )}
    >
      {/* Кант светлее фона: border-line (#2a2a2a) на bg-surface-2 (#232323)
          почти не виден — плитка расплылась бы серым пятном */}
      <span className="grid size-9 shrink-0 place-items-center rounded-btn border border-white/10 bg-surface-2 transition-colors duration-200 group-hover:border-primary/70 sm:size-10">
        <ClocheIcon className="w-6 text-white sm:w-7" />
      </span>
      <span className="flex flex-col leading-none">
        {/* whitespace-nowrap обязателен: между 1024 и 1279px рядом с логотипом
            уже стоит вся навигация, и без него надпись ломается на две строки */}
        <span className="font-heading text-[17px] leading-none font-black tracking-tight whitespace-nowrap text-white uppercase">
          Lagman <span className="text-primary">Center</span>
        </span>
        <span className="mt-1.5 flex items-center gap-1.5">
          <span className="h-px w-3 bg-primary/80" aria-hidden />
          <span className="text-[9px] leading-none font-medium tracking-[0.24em] text-white/45 uppercase">
            Cafe Loft
          </span>
        </span>
      </span>
    </Link>
  );
}
