/** 2490 -> "2 490 ₸" */
export function formatPrice(price: number): string {
  return `${price.toLocaleString("ru-RU").replace(/,/g, " ")} ₸`;
}

/** ISO-строка -> "14:32" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** ISO-строка -> "14 июля, 14:32" */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "2026-07-14" -> "14 июля 2026" */
export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
