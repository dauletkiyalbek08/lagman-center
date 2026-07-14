"use client";

import { DemoAuthNotice } from "@/components/auth/demo-auth-notice";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/field";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/types";
import { Eye, EyeOff, LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

/** Куда ведём сотрудника после входа, если в ?next= ничего внятного нет. */
function homeForRole(role: Role | undefined): string {
  if (role === "admin") return "/admin";
  if (role === "kitchen") return "/kitchen";
  if (role === "courier") return "/courier";
  // Клиент или роль не назначена — на главную, панелей у него нет
  return "/";
}

function LoginForm() {
  const { demo, loading, user, profile, signIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const nextParam = searchParams.get("next");
  // Только внутренние пути: «//evil.com» браузер считает внешним адресом
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : null;

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Единая точка ухода со страницы: и для «уже авторизован при заходе»,
  // и сразу после успешного signIn. Роль (profile) приезжает чуть позже
  // самой сессии, поэтому ждём, пока auth-context снимет loading.
  useEffect(() => {
    if (demo || !user) return;
    if (pathname !== "/login") return;
    if (next) {
      router.replace(next);
      return;
    }
    if (loading) return; // роль ещё неизвестна — подождём профиль
    router.replace(homeForRole(profile?.role));
  }, [demo, loading, user, profile, next, pathname, router]);

  if (demo) return <DemoAuthNotice />;
  // Идёт проверка сессии или уже авторизован — редирект выше вот-вот сработает
  if (loading || user) return <PageLoader />;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(login.trim(), password);
      // Дальше уводит useEffect: сначала дождёмся роли из профиля.
      // submitting не сбрасываем — спиннер живёт до перехода.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти");
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardBody className="p-6 sm:p-8">
        <h1 className="font-heading text-2xl font-extrabold uppercase tracking-tight">
          Вход
        </h1>
        <p className="mt-2 mb-6 text-sm text-muted">
          Клиенты входят по номеру телефона, сотрудники — по email (логин выдаёт
          администратор).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="login-id">Телефон или email</Label>
            <Input
              id="login-id"
              type="text"
              autoComplete="username"
              placeholder="+7 707 123 45 67"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="login-password">Пароль</Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="pr-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-btn text-muted transition-colors hover:text-white"
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                title={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-primary" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <Spinner className="size-4" />
            ) : (
              <LogIn className="size-4" aria-hidden />
            )}
            Войти
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Нет аккаунта?{" "}
          <Link
            href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}
            className="font-semibold text-white underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Зарегистрироваться
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-muted">
          <Link
            href="/"
            className="underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            Вернуться на сайт
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <Suspense fallback={<PageLoader />}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}
