import { cn } from "@/lib/cn";
import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const fieldClasses =
  "w-full rounded-btn bg-surface-2 border border-line px-4 text-sm text-white " +
  "placeholder:text-muted/70 transition-colors " +
  "focus:outline-none focus:border-primary/70 focus:ring-1 focus:ring-primary/40 " +
  "disabled:opacity-50";

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-sm font-medium text-muted mb-1.5", className)}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClasses, "h-11", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(fieldClasses, "py-3 min-h-24 resize-y", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(fieldClasses, "h-11 appearance-none cursor-pointer", className)}
      {...props}
    >
      {children}
    </select>
  );
}
