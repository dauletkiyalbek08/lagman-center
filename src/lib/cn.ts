/** Мини-аналог clsx: склеивает классы, отбрасывая falsy-значения. */
export function cn(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}
