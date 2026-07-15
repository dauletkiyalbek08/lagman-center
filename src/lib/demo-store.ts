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
  GuestTable,
  MenuItem,
  NewOrderInput,
  NewReservationInput,
  NewStaffInput,
  NewTableInput,
  Order,
  OrderStatus,
  PaymentStatus,
  PromoBanner,
  RatingInput,
  Reservation,
  ReservationStatus,
  Role,
  Settings,
  StaffMember,
  Table,
} from "./types";

/** Курьеры «из коробки» в демо — чтобы вкладка «Курьеры» не пустовала. */
const DEMO_COURIER_1 = "demo-courier-bekzat";
const DEMO_COURIER_2 = "demo-courier-timur";

const KEYS = {
  orders: "lagman.demo.orders",
  reservations: "lagman.demo.reservations",
  menu: "lagman.demo.menu",
  counter: "lagman.demo.counter",
  staff: "lagman.demo.staff",
  tables: "lagman.demo.tables",
  settings: "lagman.demo.settings",
  promo: "lagman.demo.promo",
} as const;

const CHANNEL = "lagman-demo";

type Topic =
  | "orders"
  | "reservations"
  | "menu"
  | "staff"
  | "tables"
  | "settings"
  | "promo";

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
    order_type: "delivery",
    table_id: null,
    table_number: null,
    total: items.reduce((s, [, price, qty]) => s + price * qty, 0),
    delivery_fee: 0,
    address: "г. Щучинск",
    phone: "+7 700 000 0000",
    customer_name: "Гость",
    payment_method: "cash",
    payment_status: "unpaid",
    rating: null,
    review_comment: null,
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
      order_type: "dine_in",
      table_number: 3,
      customer_name: "Дамир",
      phone: null,
      address: null,
      payment_method: "counter",
    }, [
      ["Плов", 2190, 1],
      ["Шашлык из баранины", 2990, 2],
      ["Чай в чайнике", 690, 1],
    ]),
    mk(39, "delivering", 12, {
      customer_name: "Нурлан",
      phone: "+7 702 333 4455",
      address: "ул. Ауэзова 8, кв. 3",
      payment_method: "card",
      delivery_fee: 500,
      courier_id: DEMO_COURIER_1,
    }, [
      ["Гуйру-лагман", 2690, 1],
      ["Самса", 690, 2],
    ]),
    mk(38, "delivered", 55, {
      customer_name: "Асель",
      phone: "+7 707 222 1100",
      address: "мкр. Лесной 4, кв. 12",
      payment_method: "kaspi",
      payment_status: "paid",
      delivery_fee: 500,
      courier_id: DEMO_COURIER_1,
      rating: 5,
      review_comment: "Быстро привезли, всё горячее!",
    }, [
      ["Лагман", 2490, 2],
    ]),
    mk(37, "ready", 8, {
      order_type: "pickup",
      customer_name: "Ержан",
      phone: "+7 705 888 7766",
      address: null,
      payment_method: "counter",
    }, [
      ["Плов", 2190, 1],
      ["Морс ягодный", 590, 1],
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
  const subtotal = input.items.reduce(
    (s, ci) => s + ci.item.price * ci.quantity,
    0,
  );
  const dineIn = input.order_type === "dine_in";
  const delivery = input.order_type === "delivery";
  const table = dineIn
    ? demoFetchTables().find((t) => t.code === input.table_code)
    : undefined;
  const settings = demoFetchSettings();
  // доставка — единственный тип со стоимостью доставки
  const fee = delivery ? demoDeliveryFee(subtotal, settings) : 0;

  const order: Order = {
    id: uid(),
    order_number: nextOrderNumber(),
    customer_id: null,
    status: "new",
    order_type: input.order_type,
    table_id: table?.id ?? null,
    table_number: table?.number ?? null,
    total: subtotal + fee,
    delivery_fee: fee,
    address: input.address ?? null,
    phone: input.phone ?? null,
    customer_name: input.customer_name,
    // сам платит клиент только при доставке; в зале и на самовывоз — касса
    payment_method: delivery ? input.payment_method : "counter",
    payment_status: "unpaid",
    rating: null,
    review_comment: null,
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
  if (table) demoUpdateTable(table.id, { is_occupied: true });
  return order;
}

export function demoUpdateOrderStatus(id: string, status: OrderStatus): void {
  const orders = loadOrders().map((o) =>
    o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o,
  );
  writeJson(KEYS.orders, orders);
  notify("orders");
}

export function demoUpdateOrderPayment(
  id: string,
  payment_status: PaymentStatus,
): void {
  writeJson(
    KEYS.orders,
    loadOrders().map((o) =>
      o.id === id
        ? { ...o, payment_status, updated_at: new Date().toISOString() }
        : o,
    ),
  );
  notify("orders");
}

export function demoRateOrder(id: string, input: RatingInput): void {
  writeJson(
    KEYS.orders,
    loadOrders().map((o) =>
      o.id === id
        ? {
            ...o,
            rating: input.rating,
            review_comment: input.comment || null,
          }
        : o,
    ),
  );
  notify("orders");
}

export function demoDeleteOrder(id: string): void {
  writeJson(
    KEYS.orders,
    loadOrders().filter((o) => o.id !== id),
  );
  notify("orders");
}

export function demoClearFinishedOrders(): number {
  const orders = loadOrders();
  const kept = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled",
  );
  writeJson(KEYS.orders, kept);
  notify("orders");
  return orders.length - kept.length;
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

// ---------- Столы ----------

/** 10 столов «из коробки» — столько же, сколько создаёт схема БД. */
function seedTables(): Table[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `table-${i + 1}`,
    number: i + 1,
    seats: i < 6 ? 4 : 6,
    zone: null,
    code: `demo${i + 1}`,
    is_active: true,
    is_occupied: false,
    created_at: new Date().toISOString(),
  }));
}

export function demoFetchTables(): Table[] {
  const existing = readJson<Table[] | null>(KEYS.tables, null);
  if (existing) return [...existing].sort((a, b) => a.number - b.number);
  const seeded = seedTables();
  writeJson(KEYS.tables, seeded);
  return seeded;
}

export function demoFetchTableByCode(code: string): GuestTable | null {
  const table = demoFetchTables().find(
    (t) => t.code === code.trim().toLowerCase() && t.is_active,
  );
  if (!table) return null;
  return {
    id: table.id,
    number: table.number,
    seats: table.seats,
    zone: table.zone,
  };
}

export function demoCreateTable(input: NewTableInput): void {
  const tables = demoFetchTables();
  if (tables.some((t) => t.number === input.number)) {
    throw new Error(`Стол №${input.number} уже есть`);
  }
  tables.push({
    id: uid(),
    number: input.number,
    seats: input.seats,
    zone: input.zone || null,
    code: `demo${Math.random().toString(36).slice(2, 8)}`,
    is_active: true,
    is_occupied: false,
    created_at: new Date().toISOString(),
  });
  writeJson(KEYS.tables, tables);
  notify("tables");
}

export function demoUpdateTable(id: string, fields: Partial<Table>): void {
  writeJson(
    KEYS.tables,
    demoFetchTables().map((t) => (t.id === id ? { ...t, ...fields } : t)),
  );
  notify("tables");
}

export function demoDeleteTable(id: string): void {
  writeJson(
    KEYS.tables,
    demoFetchTables().filter((t) => t.id !== id),
  );
  notify("tables");
}

// ---------- Настройки ----------

const DEMO_SETTINGS: Settings = {
  delivery_fee: 500,
  free_delivery_from: 0,
  min_order: 0,
};

export function demoFetchSettings(): Settings {
  return readJson<Settings>(KEYS.settings, DEMO_SETTINGS);
}

export function demoSaveSettings(settings: Settings): void {
  writeJson(KEYS.settings, settings);
  notify("settings");
}

function demoDeliveryFee(subtotal: number, settings: Settings): number {
  if (settings.free_delivery_from > 0 && subtotal >= settings.free_delivery_from) {
    return 0;
  }
  return settings.delivery_fee;
}

// ---------- Баннер акции ----------

/** Пустой баннер — когда строки в БД ещё нет. */
export const EMPTY_PROMO: PromoBanner = {
  is_active: false,
  emoji: "🎉",
  title: "",
  body: "",
  cta_label: "",
  cta_href: "",
  accent: "red",
};

/** В демо баннер сразу включён — чтобы было видно, как он выглядит. */
const DEMO_PROMO: PromoBanner = {
  is_active: true,
  emoji: "🎉",
  title: "Комбо к празднику −20%",
  body: "Лагман + шашлык + чай по специальной цене всю неделю. Успейте попробовать!",
  cta_label: "Смотреть меню",
  cta_href: "/menu",
  accent: "red",
};

export function demoFetchPromoBanner(): PromoBanner {
  return readJson<PromoBanner>(KEYS.promo, DEMO_PROMO);
}

export function demoSavePromoBanner(promo: PromoBanner): void {
  writeJson(KEYS.promo, promo);
  notify("promo");
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
    table_id: null,
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

export function demoUpdateReservationTable(
  id: string,
  table_id: string | null,
): void {
  writeJson(
    KEYS.reservations,
    demoFetchReservations().map((r) => (r.id === id ? { ...r, table_id } : r)),
  );
  notify("reservations");
}

export function demoDeleteReservation(id: string): void {
  writeJson(
    KEYS.reservations,
    demoFetchReservations().filter((r) => r.id !== id),
  );
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

// ---------- Персонал (демо) ----------

/** Пара курьеров «из коробки», чтобы вкладка «Курьеры» была наглядной. */
function seedStaff(): StaffMember[] {
  const at = new Date().toISOString();
  return [
    {
      id: DEMO_COURIER_1,
      email: "bekzat@lagmancenter.kz",
      role: "courier",
      name: "Бекзат",
      phone: "+7 707 111 0011",
      created_at: at,
    },
    {
      id: DEMO_COURIER_2,
      email: "timur@lagmancenter.kz",
      role: "courier",
      name: "Тимур",
      phone: "+7 707 222 0022",
      created_at: at,
    },
  ];
}

/** В демо-режиме учётки ненастоящие: пароль не хранится, вход не нужен. */
export function demoFetchStaff(): StaffMember[] {
  const existing = readJson<StaffMember[] | null>(KEYS.staff, null);
  if (existing) return existing;
  const seeded = seedStaff();
  writeJson(KEYS.staff, seeded);
  return seeded;
}

export function demoCreateStaff(input: NewStaffInput): void {
  const staff = demoFetchStaff();
  if (staff.some((s) => s.email === input.email.toLowerCase())) {
    throw new Error("Сотрудник с таким email уже есть");
  }
  staff.push({
    id: uid(),
    email: input.email.toLowerCase(),
    role: input.role,
    name: input.name || null,
    phone: input.phone || null,
    created_at: new Date().toISOString(),
  });
  writeJson(KEYS.staff, staff);
  notify("staff");
}

export function demoUpdateStaffRole(id: string, role: Role): void {
  writeJson(
    KEYS.staff,
    demoFetchStaff().map((s) => (s.id === id ? { ...s, role } : s)),
  );
  notify("staff");
}

export function demoDeleteStaff(id: string): void {
  writeJson(
    KEYS.staff,
    demoFetchStaff().filter((s) => s.id !== id),
  );
  notify("staff");
}
