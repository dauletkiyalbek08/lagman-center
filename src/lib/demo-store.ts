"use client";

/**
 * Демо-хранилище для работы сайта без подключённого Supabase.
 * Заказы, брони и правки меню живут в localStorage, а «realtime»
 * между вкладками обеспечивают BroadcastChannel + событие storage.
 * API повторяет форму данных из Supabase, поэтому страницы не знают,
 * с каким бэкендом работают (см. lib/data.ts).
 */

import { SEED_MENU_ITEMS } from "./seed-data";
import type {
  MenuItem,
  NewOrderInput,
  NewReservationInput,
  Order,
  OrderStatus,
  Reservation,
  ReservationStatus,
} from "./types";

const KEYS = {
  orders: "lagman.demo.orders",
  reservations: "lagman.demo.reservations",
  menu: "lagman.demo.menu",
  counter: "lagman.demo.counter",
} as const;

const CHANNEL = "lagman-demo";

type Topic = "orders" | "reservations" | "menu";

function isBrowser() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (!isBrowser() || typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL);
  return channel;
}

const localListeners = new Set<(topic: Topic) => void>();

function notify(topic: Topic) {
  localListeners.forEach((cb) => cb(topic));
  getChannel()?.postMessage(topic);
}

/** Подписка на изменения демо-данных (своя вкладка + другие вкладки). */
export function demoSubscribe(topic: Topic, cb: () => void): () => void {
  const local = (t: Topic) => {
    if (t === topic) cb();
  };
  localListeners.add(local);

  const ch = getChannel();
  const onMessage = (e: MessageEvent) => {
    if (e.data === topic) cb();
  };
  ch?.addEventListener("message", onMessage);

  const onStorage = (e: StorageEvent) => {
    if (e.key === KEYS[topic]) cb();
  };
  if (isBrowser()) window.addEventListener("storage", onStorage);

  return () => {
    localListeners.delete(local);
    ch?.removeEventListener("message", onMessage);
    if (isBrowser()) window.removeEventListener("storage", onStorage);
  };
}

function nextOrderNumber(): string {
  const n = readJson<number>(KEYS.counter, 41) + 1;
  writeJson(KEYS.counter, n);
  return `#${String(n).padStart(5, "0")}`;
}

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`;
}

/** Пара показательных заказов, чтобы панели персонала не были пустыми. */
function seedOrders(): Order[] {
  const now = Date.now();
  const mk = (
    num: number,
    status: OrderStatus,
    minutesAgo: number,
    data: Partial<Order>,
    items: Array<[string, number, number]>,
  ): Order => ({
    id: uid(),
    order_number: `#${String(num).padStart(5, "0")}`,
    customer_id: null,
    status,
    total: items.reduce((s, [, price, qty]) => s + price * qty, 0),
    address: "г. Щучинск",
    phone: "+7 700 000 0000",
    customer_name: "Гость",
    payment_method: "cash",
    comment: null,
    courier_id: null,
    created_at: new Date(now - minutesAgo * 60_000).toISOString(),
    updated_at: new Date(now - minutesAgo * 60_000).toISOString(),
    items: items.map(([name, price, qty]) => ({
      id: uid(),
      name_snapshot: name,
      price_snapshot: price,
      quantity: qty,
    })),
    ...data,
  });

  return [
    mk(40, "cooking", 18, {
      customer_name: "Айгерим",
      phone: "+7 701 111 2233",
      address: "ул. Абылай хана 12, кв. 5",
      payment_method: "kaspi",
      comment: "Без лука, пожалуйста",
    }, [
      ["Лагман", 2490, 2],
      ["Самса", 690, 4],
    ]),
    mk(41, "new", 6, {
      customer_name: "Дамир",
      phone: "+7 705 444 5566",
      address: "мкр. Юбилейный 7, подъезд 2",
      payment_method: "cash",
    }, [
      ["Плов", 2190, 1],
      ["Шашлык из баранины", 2990, 2],
      ["Чай в чайнике", 690, 1],
    ]),
  ];
}

function loadOrders(): Order[] {
  const existing = readJson<Order[] | null>(KEYS.orders, null);
  if (existing) return existing;
  const seeded = seedOrders();
  writeJson(KEYS.orders, seeded);
  return seeded;
}

// ---------- Заказы ----------

export function demoFetchOrders(): Order[] {
  return loadOrders().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function demoFetchOrder(id: string): Order | null {
  return loadOrders().find((o) => o.id === id) ?? null;
}

export function demoCreateOrder(input: NewOrderInput): Order {
  const orders = loadOrders();
  const order: Order = {
    id: uid(),
    order_number: nextOrderNumber(),
    customer_id: null,
    status: "new",
    total: input.items.reduce((s, ci) => s + ci.item.price * ci.quantity, 0),
    address: input.address,
    phone: input.phone,
    customer_name: input.customer_name,
    payment_method: input.payment_method,
    comment: input.comment || null,
    courier_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: input.items.map((ci) => ({
      id: uid(),
      name_snapshot: ci.item.name,
      price_snapshot: ci.item.price,
      quantity: ci.quantity,
    })),
  };
  writeJson(KEYS.orders, [order, ...orders]);
  notify("orders");
  return order;
}

export function demoUpdateOrderStatus(id: string, status: OrderStatus): void {
  const orders = loadOrders().map((o) =>
    o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o,
  );
  writeJson(KEYS.orders, orders);
  notify("orders");
}

/** Курьер забирает заказ. false — если статус уже не ready (взял другой). */
export function demoClaimOrder(id: string): boolean {
  const orders = loadOrders();
  const order = orders.find((o) => o.id === id);
  if (!order || order.status !== "ready") return false;
  writeJson(
    KEYS.orders,
    orders.map((o) =>
      o.id === id
        ? {
            ...o,
            status: "delivering" as OrderStatus,
            courier_id: "demo-courier",
            updated_at: new Date().toISOString(),
          }
        : o,
    ),
  );
  notify("orders");
  return true;
}

// ---------- Брони ----------

export function demoFetchReservations(): Reservation[] {
  return readJson<Reservation[]>(KEYS.reservations, []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function demoCreateReservation(input: NewReservationInput): Reservation {
  const reservation: Reservation = {
    id: uid(),
    status: "new",
    created_at: new Date().toISOString(),
    ...input,
  };
  writeJson(KEYS.reservations, [reservation, ...demoFetchReservations()]);
  notify("reservations");
  return reservation;
}

export function demoUpdateReservationStatus(
  id: string,
  status: ReservationStatus,
): void {
  const next = demoFetchReservations().map((r) =>
    r.id === id ? { ...r, status } : r,
  );
  writeJson(KEYS.reservations, next);
  notify("reservations");
}

// ---------- Меню ----------

export function demoFetchMenu(): MenuItem[] {
  return readJson<MenuItem[]>(KEYS.menu, SEED_MENU_ITEMS);
}

export function demoUpsertMenuItem(item: MenuItem): void {
  const menu = demoFetchMenu();
  const idx = menu.findIndex((m) => m.id === item.id);
  if (idx >= 0) menu[idx] = item;
  else menu.push(item);
  writeJson(KEYS.menu, menu);
  notify("menu");
}

export function demoDeleteMenuItem(id: string): void {
  writeJson(
    KEYS.menu,
    demoFetchMenu().filter((m) => m.id !== id),
  );
  notify("menu");
}
