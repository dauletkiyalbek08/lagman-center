"use client";

import { Logo } from "@/components/logo";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";
import { ROLE_LABELS } from "@/lib/constants";
import { ChefHat, Globe, LayoutDashboard, LogOut, Truck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const PANEL_LINKS = [
  { href: "/admin", label: "Админ", icon: LayoutDashboard, roles: ["admin"] },
  { href: "/kitchen", label: "Кухня", icon: ChefHat, roles: ["admin", "kitchen"] },
  { href: "/courier", label: "Курьер", icon: Truck, roles: ["admin", "courier"] },
];

export function StaffTopbar() {
  const { demo, user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const role = profile?.role;
  const links = PANEL_LINKS.filter(
    (l) => demo || (role && l.roles.includes(role)),
  );

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-5">
          <Logo />
          <span className="hidden rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted sm:inline-block">
            Панель персонала
          </span>
        </div>

        <nav className="flex items-center gap-1" aria-label="Разделы панели">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-btn px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {role && (
            <span className="hidden text-xs text-muted md:inline">
              {profile?.name || user?.email} · {ROLE_LABELS[role]}
            </span>
          )}
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-white"
          >
            <Globe className="size-4" aria-hidden />
            <span className="hidden sm:inline">На сайт</span>
          </Link>
          {user && (
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
              className="flex cursor-pointer items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary"
            >
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
