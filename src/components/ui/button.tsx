import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "success";
export type ButtonSize = "sm" | "md" | "lg";

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-btn font-semibold",
    "transition-colors duration-150 cursor-pointer select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    "disabled:opacity-50 disabled:pointer-events-none",
    variant === "primary" && "bg-primary text-white hover:bg-primary-hover",
    variant === "secondary" &&
      "bg-transparent text-white border border-white/25 hover:border-white/60 hover:bg-white/5",
    variant === "ghost" && "bg-transparent text-muted hover:text-white hover:bg-white/5",
    variant === "danger" &&
      "bg-transparent text-primary border border-primary/40 hover:bg-primary/10",
    variant === "success" && "bg-emerald-600 text-white hover:bg-emerald-700",
    size === "sm" && "h-9 px-3 text-sm",
    size === "md" && "h-11 px-5 text-sm",
    size === "lg" && "h-12 px-7 text-base",
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  );
}
