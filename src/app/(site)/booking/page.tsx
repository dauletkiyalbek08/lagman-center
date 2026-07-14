import { BookingForm } from "@/components/booking-form";
import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { CONTACTS, ESTABLISHMENTS } from "@/lib/constants";
import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Бронирование стола",
  description:
    "Забронируйте стол в Lagman Center или на летней террасе «Шашлычный двор» в Щучинске. Онлайн-заявка или по телефону — ежедневно 10:00–23:00.",
};

export default function BookingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
      <SectionHeading pre="БРОНИРОВАНИЕ" accent="СТОЛА" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Форма */}
        <Card className="lg:col-span-2 self-start">
          <CardBody className="p-6 sm:p-8">
            <BookingForm />
            <p className="mt-6 text-sm text-muted">
              Мы свяжемся с вами для подтверждения брони.
            </p>
          </CardBody>
        </Card>

        {/* Инфо-колонка */}
        <div className="flex flex-col gap-6">
          {ESTABLISHMENTS.map((est) => (
            <Card key={est.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-heading text-lg font-extrabold uppercase">
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

          <Card>
            <CardBody>
              <h3 className="font-heading text-lg font-extrabold uppercase">
                Предпочитаете позвонить?
              </h3>
              <p className="mt-2 text-sm text-muted">
                Забронируем стол по телефону или в WhatsApp — ежедневно{" "}
                {CONTACTS.hours}.
              </p>
              <div className="mt-4 space-y-2.5 text-sm">
                <a
                  href={CONTACTS.phoneHref}
                  className="flex items-center gap-2.5 font-semibold text-white transition-colors hover:text-primary"
                >
                  <Phone className="size-4 text-primary" aria-hidden />
                  {CONTACTS.phone}
                </a>
                <a
                  href={CONTACTS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 font-semibold text-white transition-colors hover:text-primary"
                >
                  <MessageCircle className="size-4 text-primary" aria-hidden />
                  Написать в WhatsApp
                </a>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
