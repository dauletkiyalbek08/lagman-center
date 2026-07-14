/**
 * Вход клиента — по номеру телефона.
 *
 * Supabase умеет авторизацию по телефону, но только с платным SMS-провайдером:
 * каждый код подтверждения стоит денег и требует отдельного договора. Нам
 * подтверждение номера не нужно (курьер и так звонит), поэтому номер играет
 * роль логина: из него получается «технический» email, с которым и работает
 * Supabase Auth. Пользователь этого адреса не видит и не вводит — только номер.
 */

/** Домен виден только в базе; писем на него никто не шлёт. */
const PHONE_DOMAIN = "phone.lagmancenter.kz";

/**
 * Приводит номер к виду 77071234567: и «8 707…», и «+7 707…», и «707…».
 * null — если это не похоже на казахстанский номер.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `7${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits.startsWith("7")) {
    // «707 123 45 67» без кода страны
    return `7${digits}`;
  }
  return null;
}

/** Красивый вид для профиля и панели курьера: +7 707 123 45 67 */
export function formatPhone(normalized: string): string {
  const m = /^7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(normalized);
  if (!m) return normalized;
  return `+7 ${m[1]} ${m[2]} ${m[3]} ${m[4]}`;
}

/** Логин Supabase для клиента: 77071234567@phone.lagmancenter.kz */
export function phoneToEmail(normalized: string): string {
  return `${normalized}@${PHONE_DOMAIN}`;
}

/** true — если это технический email клиента, а не настоящая почта сотрудника */
export function isPhoneEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${PHONE_DOMAIN}`);
}

/**
 * В форму входа можно вписать и номер, и email (сотрудники входят по почте).
 * Решаем по наличию «@»: номера его не содержат.
 */
export function loginToEmail(input: string): string | null {
  const value = input.trim();
  if (value.includes("@")) return value.toLowerCase();
  const phone = normalizePhone(value);
  return phone ? phoneToEmail(phone) : null;
}
