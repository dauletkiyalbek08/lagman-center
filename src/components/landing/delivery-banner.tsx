import { buttonClasses } from "@/components/ui/button";
import { ShoppingCart, Truck, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface Step {
  icon: LucideIcon;
  text: string;
}

const STEPS: Step[] = [
  { icon: UtensilsCrossed, text: "Выберите блюда из меню" },
  { icon: ShoppingCart, text: "Оформите заказ на сайте" },
  { icon: Truck, text: "Ожидайте доставку" },
];

/** Тёмный баннер «Закажи доставку» с тремя шагами. */
export function DeliveryBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="relative overflow-hidden rounded-card border border-line bg-surface p-8 text-center sm:p-12">
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-primary/5 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <h2 className="font-heading text-2xl font-black uppercase tracking-tight sm:text-3xl lg:text-4xl">
            Закажи <span className="text-primary">доставку</span>
          </h2>
          <p className="mt-2 text-sm text-muted sm:text-base">
            Привезём горячее и свежее прямо к вам!
          </p>

          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((step, index) => (
              <div
                key={step.text}
                className="flex flex-col items-center gap-3 text-center"
              >
                <span className="relative flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="size-6" aria-hidden />
                  <span className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-primary font-heading text-xs font-bold text-white">
                    {index + 1}
                  </span>
                </span>
                <p className="text-sm text-white/90">{step.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link href="/menu" className={buttonClasses("primary", "lg")}>
              Заказать доставку
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
