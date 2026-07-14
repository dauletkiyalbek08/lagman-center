import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { CONTACTS, ESTABLISHMENTS } from "@/lib/constants";
import {
  Camera,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Контакты халяль-кафе Lagman Center в Щучинске: телефон, WhatsApp, Instagram, адреса заведений и часы работы. Ежедневно 10:00–23:00.",
};

const MAP_LINKS: Record<string, string> = {
  "shashlychny-dvor": "https://yandex.kz/maps/?text=Щучинск%20парк",
  "lagman-center": "https://yandex.kz/maps/?text=Щучинск%20Lagman%20Center",
};

export default function ContactsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
      <SectionHeading accent="КОНТАКТЫ" />

      {/* Способы связи */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <span className="inline-flex size-11 items-center justify-center rounded-card bg-primary/10">
              <Phone className="size-5 text-primary" aria-hidden />
            </span>
            <h3 className="mt-4 font-heading text-base font-extrabold uppercase">
              Телефон
            </h3>
            <a
              href={CONTACTS.phoneHref}
              className="mt-2 block font-semibold text-white transition-colors hover:text-primary"
            >
              {CONTACTS.phone}
            </a>
            <p className="mt-1.5 text-xs text-muted">
              Звоните ежедневно 10:00–23:00
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <span className="inline-flex size-11 items-center justify-center rounded-card bg-primary/10">
              <MessageCircle className="size-5 text-primary" aria-hidden />
            </span>
            <h3 className="mt-4 font-heading text-base font-extrabold uppercase">
              WhatsApp
            </h3>
            <a
              href={CONTACTS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block font-semibold text-white transition-colors hover:text-primary"
            >
              Написать в WhatsApp
            </a>
            <p className="mt-1.5 text-xs text-muted">
              Ответим на вопросы и примем бронь
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <span className="inline-flex size-11 items-center justify-center rounded-card bg-primary/10">
              <Camera className="size-5 text-primary" aria-hidden />
            </span>
            <h3 className="mt-4 font-heading text-base font-extrabold uppercase">
              Instagram
            </h3>
            <a
              href={CONTACTS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block break-all font-semibold text-white transition-colors hover:text-primary"
            >
              {CONTACTS.instagramHandle}
            </a>
            <p className="mt-1.5 text-xs text-muted">
              Новинки меню и жизнь кафе
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <span className="inline-flex size-11 items-center justify-center rounded-card bg-primary/10 font-heading text-sm font-black text-primary">
              VK
            </span>
            <h3 className="mt-4 font-heading text-base font-extrabold uppercase">
              VK
            </h3>
            <a
              href={CONTACTS.vk}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block break-all font-semibold text-white transition-colors hover:text-primary"
            >
              {CONTACTS.vkHandle}
            </a>
            <p className="mt-1.5 text-xs text-muted">Мы ВКонтакте</p>
          </CardBody>
        </Card>
      </div>

      {/* Заведения */}
      <SectionHeading pre="НАШИ" accent="ЗАВЕДЕНИЯ" className="mt-14" />
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
              <a
                href={MAP_LINKS[est.id] ?? MAP_LINKS["lagman-center"]}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
              >
                Открыть на карте
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <Card className="mt-14 bg-gradient-to-r from-primary/15 via-surface to-surface">
        <CardBody className="flex flex-col items-center gap-6 p-8 text-center sm:p-10 md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
              Хотите столик?{" "}
              <span className="text-primary">Забронируйте онлайн</span>
            </h2>
            <p className="mt-2 text-sm text-muted">
              Заявка занимает меньше минуты — мы перезвоним и подтвердим бронь.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Link href="/booking" className={buttonClasses("primary", "lg")}>
              Забронировать стол
            </Link>
            <Link href="/menu" className={buttonClasses("secondary", "lg")}>
              Заказать доставку
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
