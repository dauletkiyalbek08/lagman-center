import { cn } from "@/lib/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block size-5 animate-spin rounded-full border-2 border-white/20 border-t-primary",
        className,
      )}
      aria-label="Загрузка"
    />
  );
}

export function PageLoader({ label = "Загрузка…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted">
      <Spinner className="size-8" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
