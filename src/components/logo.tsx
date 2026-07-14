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

export function Logo({ className, size = "compact" }: LogoProps) {
  const large = size === "large";
  return (
    <Link
      href="/"
      className={cn("inline-flex flex-col items-start leading-none", className)}
      aria-label="Lagman Center — на главную"
    >
      <ClocheIcon className={cn("text-white mb-1", large ? "w-8" : "w-6")} />
      <span
        className={cn(
          "font-heading font-black uppercase tracking-tight text-white",
          large ? "text-2xl" : "text-lg",
        )}
      >
        Lagman
      </span>
      <span
        className={cn(
          "font-heading font-black uppercase tracking-tight text-primary",
          large ? "text-2xl" : "text-lg",
        )}
      >
        Center
      </span>
      <span
        className={cn(
          "mt-1 uppercase text-muted font-medium",
          large ? "text-[11px] tracking-[0.35em]" : "text-[9px] tracking-[0.3em]",
        )}
      >
        Cafe Loft
      </span>
    </Link>
  );
}
