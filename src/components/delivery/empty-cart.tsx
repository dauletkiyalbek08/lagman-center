import { buttonClasses } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Bike, ClipboardList, ShoppingCart, UtensilsCrossed } from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    icon: UtensilsCrossed,
    title: "Выберите блюда из меню",
    text: "Лагман, шашлык, манты и другие блюда халяль — всё готовим из свежих продуктов.",
  },
  {
    icon: ClipboardList,
    title: "Оформите заказ на сайте",
    text: "Укажите адрес и телефон — менеджер перезвонит для подтверждения.",
  },
  {
    icon: Bike,
    title: "Ожидайте доставку",
    text: "Курьер привезёт заказ горячим. Оплата наличными, картой или Kaspi.",
  },
];

/** Пустая корзина: приглашение в меню + как работает доставка. */
export function EmptyCart() {
  return (
    <div>
      <div className="flex flex-col items-center gap-4 py-12 text-center sm:py-16">
        <span className="flex size-20 items-center justify-center rounded-full bg-surface border border-line">
          <ShoppingCart className="size-9 text-muted" aria-hidden />
        </span>
        <h1 className="font-heading text-2xl font-extrabold uppercase sm:text-3xl">
          Корзина пуста
        </h1>
        <p className="max-w-md text-muted">
          Выберите блюда из меню — привезём горячее и свежее
        </p>
        <Link href="/menu" className={buttonClasses("primary", "lg", "mt-2")}>
          Перейти в меню
        </Link>
      </div>

      <section className="mt-6 sm:mt-10">
        <h2 className="mb-6 text-center font-heading text-xl font-extrabold uppercase sm:text-2xl">
          Как работает <span className="text-primary">доставка</span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card key={step.title}>
              <CardBody className="flex flex-col items-center gap-3 text-center">
                <span className="relative flex size-14 items-center justify-center rounded-full bg-primary/10 border border-primary/30">
                  <step.icon className="size-6 text-primary" aria-hidden />
                  <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {i + 1}
                  </span>
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted">{step.text}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
