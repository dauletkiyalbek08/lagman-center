"use client";

import { PageLoader } from "@/components/ui/spinner";
import { buttonClasses } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/lib/types";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { DemoBanner } from "./demo-banner";

interface StaffGuardProps {
  /** Роли, которым разрешён доступ (admin допускается всегда) */
  allow: Role[];
  children: React.ReactNode;
}

/**
 * Ограничивает доступ к панелям персонала по роли из profiles.
 * В демо-режиме (без Supabase) панели открыты для просмотра.
 */
export function StaffGuard({ allow, children }: StaffGuardProps) {
  const { demo, loading, user, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const needsLogin = !demo && !loading && !user;

  useEffect(() => {
    if (needsLogin) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [needsLogin, router, pathname]);

  if (demo) {
    return (
      <div className="space-y-4">
        <DemoBanner />
        {children}
      </div>
    );
  }

  if (loading || needsLogin) return <PageLoader />;

  const role = profile?.role;
  const allowed = role === "admin" || (role && allow.includes(role));

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md rounded-card border border-line bg-surface p-8 text-center">
        <ShieldAlert className="mx-auto mb-4 size-10 text-primary" aria-hidden />
        <h1 className="font-heading text-xl font-extrabold uppercase mb-2">
          Нет доступа
        </h1>
        <p className="text-sm text-muted mb-6">
          Этот раздел доступен ролям:{" "}
          {allow.map((r) => ROLE_LABELS[r]).join(", ")}. Ваша роль:{" "}
          {role ? ROLE_LABELS[role] : "не назначена"}. Обратитесь к
          администратору.
        </p>
        <Link href="/" className={buttonClasses("secondary", "md")}>
          На главную
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
