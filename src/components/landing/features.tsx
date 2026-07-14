import { BadgeCheck, Clock, Flame, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  text: string;
}

const FEATURES: Feature[] = [
  {
    icon: BadgeCheck,
    title: "Халяль",
    text: "Вся продукция сертифицирована",
  },
  {
    icon: Flame,
    title: "Свежие продукты",
    text: "Готовим каждый день из свежих продуктов",
  },
  {
    icon: Truck,
    title: "Быстрая доставка",
    text: "Доставка по Щучинску и району",
  },
  {
    icon: Clock,
    title: "Время работы",
    text: "10:00–23:00, ежедневно",
  },
];

/** Полоса преимуществ под hero: 4 карточки (2 в ряд на мобильном). */
export function Features() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col items-start gap-3 rounded-card border border-line bg-surface p-4 sm:p-5"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <feature.icon className="size-6" aria-hidden />
            </span>
            <div>
              <h3 className="font-heading text-sm font-bold uppercase sm:text-base">
                {feature.title}
              </h3>
              <p className="mt-1 text-xs text-muted sm:text-sm">
                {feature.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
