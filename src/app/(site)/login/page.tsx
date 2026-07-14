"use client";

import { DemoAuthNotice } from "@/components/auth/demo-auth-notice";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/field";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth-context";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

function LoginForm() {
  const { demo, loading, user, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextParam = searchParams.get("next");
  // Только внутренние пути: «//evil.com» браузер считает внешним адресом
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Уже авторизован — сразу в кабинет (или на страницу из ?next=)
  useEffect(() => {
    if (!demo && !loading && user) {
      router.replace(next);
    }
  }, [demo, loading, user, router, next]);

  if (demo) return <DemoAuthNotice />;
  if (loading || user) return <PageLoader />;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти");
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardBody className="p-6 sm:p-8">
        <h1 className="font-heading text-2xl font-extrabold uppercase tracking-tight mb-6">
          Вход <span className="text-primary">в аккаунт</span>
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="login-password">Пароль</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
            href="/register"
            className="font-semibold text-white underline-offset-4 hover:text-primary hover:underline"
          >
            Зарегистрироваться
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
