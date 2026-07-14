"use client";

import { cn } from "@/lib/cn";
import { UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface DishImageProps {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Фото блюда с фолбэком: если картинки нет или она не загрузилась,
 * показываем аккуратный плейсхолдер в тёмной теме.
 */
export function DishImage({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority,
}: DishImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center",
          "bg-[radial-gradient(ellipse_at_center,_#2a1214_0%,_#161011_60%,_#0e0e0e_100%)]",
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <UtensilsCrossed className="size-10 text-primary/50" aria-hidden />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
