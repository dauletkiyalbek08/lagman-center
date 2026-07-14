import { buttonClasses } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

/** Главный экран лендинга: фото шашлыка фоном + слоган и CTA. */
export function Hero() {
  return (
    <section className="relative flex min-h-[560px] items-center overflow-hidden">
      <Image
        src="/images/hero-shashlik.jpg"
        alt="Сочный шашлык на мангале"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Затемнение: на мобильном сплошной оверлей, на десктопе градиент слева */}
      <div className="absolute inset-0 bg-bg/60 md:bg-bg/25" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-r from-bg via-bg/75 to-bg/10"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary sm:text-sm">
            Халяль кафе в Щучинске
          </p>
          <h1 className="mt-4 font-heading text-4xl font-black uppercase leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Вкусно. Быстро.
            <br />
            <span className="text-primary">Халяль.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
            Лучший лагман в городе, сочный шашлык, ароматный плов и уютная
            атмосфера.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/menu" className={buttonClasses("primary", "lg")}>
              Смотреть меню
            </Link>
            <Link href="/booking" className={buttonClasses("secondary", "lg")}>
              Забронировать стол
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
