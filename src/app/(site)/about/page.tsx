import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ESTABLISHMENTS } from "@/lib/constants";
import {
  Armchair,
  BadgeCheck,
  Clock,
  Flame,
  MapPin,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "О нас",
  description:
    "Lagman Center — халяль-кафе в Щучинске: лучший лагман в городе, сочный шашлык, свежие продукты и уютная атмосфера для всей семьи.",
};

const VALUES = [
  {
    icon: BadgeCheck,
    title: "Халяль",
    text: "Всё меню полностью халяль: тщательно выбираем мясо и поставщиков.",
  },
  {
    icon: Flame,
    title: "Свежие продукты",
    text: "Готовим каждый день из свежих продуктов — тесто тянем вручную, мясо жарим на углях.",
  },
  {
    icon: Users,
    title: "Для всей семьи",
    text: "Просторный зал и меню, в котором каждый найдёт любимое блюдо — от детей до бабушек.",
  },
  {
    icon: Armchair,
    title: "Уютная атмосфера",
    text: "Тёплый свет, стиль cafe loft и внимательный сервис — хочется задержаться подольше.",
  },
];

export default function AboutPage() {
  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Image
          src="/images/about-interior.jpg"
          alt="Интерьер кафе Lagman Center"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-bg via-black/60 to-black/40"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-24 sm:py-36">
          <p className="font-heading text-sm sm:text-base font-bold uppercase tracking-[0.25em] text-primary">
            Lagman Center — Cafe Loft
          </p>
          <h1 className="mt-3 font-heading text-4xl sm:text-6xl font-black uppercase tracking-tight">
            О <span className="text-primary">нас</span>
          </h1>
        </div>
      </section>

      {/* История */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-3xl space-y-5 text-base leading-relaxed text-muted">
          <p>
            <span className="font-semibold text-white">Lagman Center</span> —
            халяль-кафе в Щучинске, куда приходят за лучшим лагманом в городе.
            Мы тянем лапшу вручную, томим мясо с овощами по классическому
            рецепту и подаём блюдо горячим — так, как его готовят дома, только
            вкуснее.
          </p>
          <p>
            Каждый день мы начинаем с рынка: свежие продукты, отборное мясо и
            зелень попадают на кухню утром, а вечером уже в вашей тарелке.
            Никаких заготовок «на неделю» — лагман, плов, манты и шашлык
            готовятся ежедневно небольшими партиями.
          </p>
          <p>
            Мы создали место, куда удобно прийти всей семьёй: уютный зал в
            стиле cafe loft, а летом — терраса «Шашлычный двор» прямо в парке,
            где шашлык жарится на углях у вас на глазах. Приходите — угостим!
          </p>
        </div>
      </section>

      {/* Ценности */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
        <SectionHeading pre="НАШИ" accent="ЦЕННОСТИ" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardBody>
                <span className="inline-flex size-11 items-center justify-center rounded-card bg-primary/10">
                  <Icon className="size-5 text-primary" aria-hidden />
                </span>
                <h3 className="mt-4 font-heading text-base font-extrabold uppercase">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {text}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Заведения */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <SectionHeading pre="НАШИ" accent="ЗАВЕДЕНИЯ" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ESTABLISHMENTS.map((est) => (
            <Card key={est.id}>
              <CardBody className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-heading text-xl font-extrabold uppercase">
                    {est.name}
                  </h3>
                  <Badge>{est.tag}</Badge>
                </div>
                <ul className="mt-4 space-y-2.5 text-sm text-muted">
                  <li className="flex items-start gap-2.5">
                    <MapPin
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span>{est.address}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Clock
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span>Ежедневно {est.hours}</span>
                  </li>
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <Card className="bg-gradient-to-r from-primary/15 via-surface to-surface">
          <CardBody className="flex flex-col items-center gap-6 p-8 text-center sm:p-10 md:flex-row md:justify-between md:text-left">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
                Приходите в гости{" "}
                <span className="text-primary">или закажите доставку</span>
              </h2>
              <p className="mt-2 text-sm text-muted">
                Ждём вас ежедневно с 10:00 до 23:00 — или привезём горячий
                лагман прямо к вам домой.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link href="/menu" className={buttonClasses("primary", "lg")}>
                Смотреть меню
              </Link>
              <Link
                href="/booking"
                className={buttonClasses("secondary", "lg")}
              >
                Забронировать стол
              </Link>
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
