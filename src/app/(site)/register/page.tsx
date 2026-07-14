"use client";

import { DemoAuthNotice } from "@/components/auth/demo-auth-notice";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/field";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";
import { normalizePhone } from "@/lib/phone";
import { Eye, EyeOff, UserRoundPlus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

/** Только внутренние пути: «//evil.com» браузер считает внешним адресом. */
function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/delivery";
}

function RegisterForm() {
  const { demo, loading, user, signUp } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Уже вошёл — регистрироваться незачем
  useEffect(() => {
    if (!demo && user) router.replace(next);
  }, [demo, user, next, router]);

  if (demo) return <DemoAuthNotice />;
  if (loading || user) return <PageLoader />;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalized = normalizePhone(phone);
    if (!normalized) {
      setPhoneError("Проверьте номер: например, +7 707 123 45 67");
      return;
    }
    setPhoneError(null);
    setError(null);
    setSubmitting(true);
    try {
      await signUp({
        phone: normalized,
        password,
        name: name.trim(),
        address: address.trim(),
      });
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось зарегистрироваться");
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardBody className="p-6 sm:p-8">
        <h1 className="font-heading text-2xl font-extrabold uppercase tracking-tight">
          Регистрация для <span className="text-primary">доставки</span>
        </h1>
        <p className="mt-2 mb-6 text-sm text-muted">
          Нужен только номер телефона и пароль. Никаких кодов и писем: по номеру
          курьер свяжется с вами, а адрес подставится в следующий заказ.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <Label htmlFor="reg-name">Имя</Label>
            <Input
              id="reg-name"
              autoComplete="name"
              placeholder="Как к вам обращаться"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="reg-phone">Телефон *</Label>
            <Input
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+7 707 123 45 67"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneError(null);
              }}
              aria-invalid={Boolean(phoneError)}
              className={cn(phoneError && "border-primary!")}
              required
            />
            {phoneError ? (
              <p className="mt-1.5 text-xs text-primary">{phoneError}</p>
            ) : (
              <p className="mt-1.5 text-xs text-muted">
                Это и будет вашим логином.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="reg-password">Пароль *</Label>
            <div className="relative">
              <Input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Минимум 6 символов"
                className="pr-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-btn text-muted transition-colors hover:text-white"
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="reg-address">
              Адрес доставки <span className="text-muted">(необязательно)</span>
            </Label>
            <Textarea
              id="reg-address"
              autoComplete="street-address"
              placeholder="Улица, дом, квартира"
              rows={2}
              className="min-h-16"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-btn border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? (
              <Spinner className="size-4 border-white/40" />
            ) : (
              <UserRoundPlus className="size-4" aria-hidden />
            )}
            Зарегистрироваться
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Уже есть аккаунт?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="font-semibold text-white underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Войти
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-muted">
          Сидите в кафе? Отсканируйте QR-код на столе — там регистрация не нужна.
        </p>
      </CardBody>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-md">
        <Suspense fallback={<PageLoader />}>
          <RegisterForm />
        </Suspense>
      </div>
    </section>
  );
}
