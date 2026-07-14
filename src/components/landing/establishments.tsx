import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ESTABLISHMENTS } from "@/lib/constants";
import { Clock, Flame, MapPin } from "lucide-react";
import Link from "next/link";

/** Стилизованная плитка-«вывеска» в верхней части карточки заведения. */
function EstablishmentSign({ id, name }: { id: string; name: string }) {
  if (id === "lagman-center") {
    return (
      <div className="flex h-44 flex-col items-center justify-center border-b border-line bg-black">
        <span className="font-heading text-3xl font-black uppercase leading-none tracking-tight text-white">
          Lagman
        </span>
        <span className="mt-1 font-heading text-3xl font-black uppercase leading-none tracking-tight text-primary">
          Center
        </span>
        <span className="mt-3 text-[10px] font-medium uppercase tracking-[0.35em] text-muted">
          Cafe Loft
        </span>
      </div>
    );
  }
  return (
    <div className="flex h-44 flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-500 via-amber-700 to-amber-950 px-4">
      <Flame className="size-7 text-amber-100/90" aria-hidden />
      <span className="text-center font-heading text-2xl font-black uppercase tracking-wide text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] sm:text-3xl">
        {name}
      </span>
    </div>
  );
}

/** Секция «Наши заведения»: две карточки из ESTABLISHMENTS. */
export function Establishments() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <SectionHeading pre="НАШИ" accent="ЗАВЕДЕНИЯ" />
      <div className="grid gap-6 md:grid-cols-2">
        {ESTABLISHMENTS.map((est) => (
          <Card key={est.id}>
            <EstablishmentSign id={est.id} name={est.name} />
            <CardBody className="flex flex-col gap-4">
              <div>
                <h3 className="font-heading text-lg font-extrabold uppercase tracking-tight">
                  {est.name}
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="size-4 shrink-0" aria-hidden />
                  {est.address}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>
                  <Clock className="size-3.5" aria-hidden />
                  {est.hours}
                </Badge>
                <Badge>{est.tag}</Badge>
              </div>
              <div className="mt-auto flex flex-wrap gap-3">
                <Link href="/menu" className={buttonClasses("primary", "sm")}>
                  Смотреть меню
                </Link>
                <Link
                  href="/booking"
                  className={buttonClasses("secondary", "sm")}
                >
                  Забронировать стол
                </Link>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
