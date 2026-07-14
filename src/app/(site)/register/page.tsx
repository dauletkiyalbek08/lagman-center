"use client";

import { DemoAuthNotice } from "@/components/auth/demo-auth-notice";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/field";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth-context";
import { MailCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export default function RegisterPage() {
  const { demo, loading, user, signUp } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** Регистрация прошла, но сессия не появилась — включено подтверждение почты */
  const [submitted, setSubmitted] = useState(false);

  // Пользователь появился (уже был авторизован или signUp сразу дал сессию) — в кабинет
  useEffect(() => {
    if (!demo && !loading && user) {
      router.replace("/account");
    }
  }, [demo, loading, user, router]);

  if (demo) {
    return (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-md">
          <DemoAuthNotice />
        </div>
      </section>
    );
  }

  if (loading || user) {
    return (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-md">
          <PageLoader />
        </div>
      </section>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Пароль должен быть не короче 6 символов");
      return;
    }
    if (password !== password2) {
      setError("Пароли не совпадают");
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email.trim(), password, name.trim(), phone.trim());
      // Если сессия появится, useEffect выше уведёт на /account.
      // Иначе — включено подтверждение почты, показываем сообщение.
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось зарегистрироваться",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <Card>
          <CardBody className="p-6 sm:p-8">
            {submitted ? (
              <div className="text-center">
                <MailCheck
                  className="mx-auto mb-4 size-10 text-primary"
                  aria-hidden
                />
                <h1 className="font-heading text-2xl font-extrabold uppercase tracking-tight mb-3">
                  Почти <span className="text-primary">готово</span>
                </h1>
                <p className="text-sm text-muted mb-6">
                  Проверьте почту и подтвердите регистрацию. После
                  подтверждения войдите со своим email и паролем.
                </p>
                <Link href="/login" className={buttonClasses("secondary", "md")}>
                  Перейти ко входу
                </Link>
              </div>
            ) : (
              <>
                <h1 className="font-heading text-2xl font-extrabold uppercase tracking-tight mb-6">
                  Регистра<span className="text-primary">ция</span>
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="reg-name">Имя *</Label>
                    <Input
                      id="reg-name"
                      autoComplete="name"
                      placeholder="Ваше имя"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-phone">Телефон *</Label>
                    <Input
                      id="reg-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+7 700 000 00 00"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-email">Email *</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-password">Пароль *</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Минимум 6 символов"
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-password2">Повторите пароль *</Label>
                    <Input
                      id="reg-password2"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Ещё раз пароль"
                      minLength={6}
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
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
                      <UserPlus className="size-4" aria-hidden />
                    )}
                    Зарегистрироваться
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted">
                  Уже есть аккаунт?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-white underline-offset-4 hover:text-primary hover:underline"
                  >
                    Войти
                  </Link>
                </p>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
