import { Logo } from "@/components/logo";
import { CONTACTS, ESTABLISHMENTS, NAV_LINKS } from "@/lib/constants";
import { Clock, Heart, MapPin, Phone } from "lucide-react";
import Link from "next/link";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.1-.7l.4-.5c.1-.2.1-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.4-.3Z" />
    </svg>
  );
}

function VkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M13.1 17.9c-5.6 0-8.8-3.8-8.9-10.2h2.8c.1 4.7 2.2 6.7 3.8 7.1V7.7h2.6v4c1.6-.2 3.3-2 3.9-4h2.6a7.7 7.7 0 0 1-3.6 5.1 8 8 0 0 1 4.2 5.1h-2.9a5 5 0 0 0-4.2-3.6v3.6h-.3Z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-[#0a0a0a]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo size="large" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Лучшее халяльное кафе в Щучинске. Вкусная еда и приятная атмосфера
            для всей семьи.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href={CONTACTS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-primary hover:text-primary"
            >
              <InstagramIcon className="size-4" />
            </a>
            <a
              href={CONTACTS.vk}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ВКонтакте"
              className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-primary hover:text-primary"
            >
              <VkIcon className="size-4" />
            </a>
            <a
              href={CONTACTS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-primary hover:text-primary"
            >
              <WhatsAppIcon className="size-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-4 font-heading text-sm font-extrabold uppercase tracking-wide">
            Навигация
          </h3>
          <ul className="space-y-2.5">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm text-muted transition-colors hover:text-white"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-heading text-sm font-extrabold uppercase tracking-wide">
            Наши заведения
          </h3>
          <ul className="space-y-5">
            {ESTABLISHMENTS.map((e) => (
              <li key={e.id}>
                <p className="text-sm font-semibold text-white">{e.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
                  {e.address}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <Clock className="size-3.5 shrink-0 text-primary" aria-hidden />
                  {e.hours}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-heading text-sm font-extrabold uppercase tracking-wide">
            Контакты
          </h3>
          <ul className="space-y-2.5 text-sm text-muted">
            <li>
              <a
                href={CONTACTS.phoneHref}
                className="flex items-center gap-2 font-semibold text-white transition-colors hover:text-primary"
              >
                <Phone className="size-4 text-primary" aria-hidden />
                {CONTACTS.phone}
              </a>
            </li>
            <li>
              <a
                href={CONTACTS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <InstagramIcon className="size-4 text-primary" />
                {CONTACTS.instagramHandle}
              </a>
            </li>
            <li>
              <a
                href={CONTACTS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <WhatsAppIcon className="size-4 text-primary" />
                wa.me/77079179404
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="size-4 text-primary" aria-hidden />
              Режим работы: {CONTACTS.hours} · {CONTACTS.hoursNote}
            </li>
          </ul>
          <Link
            href="/login"
            className="mt-5 inline-block text-xs text-muted/70 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            Вход для персонала
          </Link>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:px-6">
          <p>© 2024 Lagman Center. Все права защищены.</p>
          <p className="flex items-center gap-1.5">
            Сделано с
            <Heart className="size-3.5 fill-primary text-primary" aria-hidden />
            для наших гостей
          </p>
        </div>
      </div>
    </footer>
  );
}
