"use client";

import { Logo } from "@/components/logo";
import { buttonClasses } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/cn";
import { CONTACTS, NAV_LINKS } from "@/lib/constants";
import { useMounted } from "@/lib/use-mounted";
import { Menu, Phone, ShoppingCart, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const mounted = useMounted();

  // Закрываем мобильное меню при переходе на другую страницу
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Основная навигация">
          {NAV_LINKS.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative py-1 text-sm font-medium transition-colors",
                  active
                    ? "text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-primary"
                    : "text-muted hover:text-white",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={CONTACTS.phoneHref}
            className="hidden items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-primary xl:flex"
          >
            <Phone className="size-4 text-primary" aria-hidden />
            {CONTACTS.phone}
          </a>

          <Link
            href="/delivery"
            className="relative rounded-btn p-2 text-muted transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Корзина"
          >
            <ShoppingCart className="size-5" aria-hidden />
            {mounted && count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {count > 99 ? "99" : count}
              </span>
            )}
          </Link>

          <Link
            href="/login"
            className="hidden rounded-btn p-2 text-muted transition-colors hover:bg-white/5 hover:text-white sm:block"
            aria-label="Вход для персонала"
            title="Вход для персонала"
          >
            <User className="size-5" aria-hidden />
          </Link>

          <Link
            href="/menu"
            className={cn(buttonClasses("primary", "sm"), "hidden md:inline-flex")}
          >
            Заказать доставку
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-btn p-2 text-white lg:hidden"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-bg lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3" aria-label="Мобильная навигация">
            {NAV_LINKS.map(({ href, label }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "border-b border-line/60 py-3 text-sm font-medium last:border-0",
                    active ? "text-primary" : "text-white",
                  )}
                >
                  {label}
                </Link>
              );
            })}
            <div className="flex flex-col gap-3 pb-2 pt-4">
              <a
                href={CONTACTS.phoneHref}
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <Phone className="size-4 text-primary" aria-hidden />
                {CONTACTS.phone}
              </a>
              <Link href="/menu" className={buttonClasses("primary", "md")}>
                Заказать доставку
              </Link>
              <Link href="/login" className={buttonClasses("secondary", "md")}>
                Вход для персонала
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
