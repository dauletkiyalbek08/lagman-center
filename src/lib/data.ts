"use client";

/**
 * Единый слой данных. Страницы вызывают эти функции и не знают,
 * какой бэкенд активен: Supabase (когда заданы ключи в .env.local)
 * или локальное демо-хранилище (lib/demo-store.ts).
 */

import * as demo from "./demo-store";
import { SEED_MENU_ITEMS } from "./seed-data";
import { getSupabaseBrowser } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/config";
import type {
  CourierStats,
  GuestTable,
  MenuItem,
  NewOrderInput,
  NewReservationInput,
  NewStaffInput,
  NewTableInput,
  Order,
  OrderStatus,
  PaymentStatus,
  RatingInput,
  Reservation,
  ReservationStatus,
  Role,
  Settings,
  StaffMember,
  Table,
} from "./types";

export { isSupabaseConfigured };

export const DEFAULT_SETTINGS: Settings = {
  delivery_fee: 500,
  free_delivery_from: 0,
  min_order: 0,
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapOrder(row: any): Order {
  return {
    id: row.id,
    order_number: row.order_number,
    customer_id: row.customer_id ?? null,
    status: row.status,
    order_type: row.order_type ?? "delivery",
    table_id: row.table_id ?? null,
    table_number: row.table_number ?? null,
    total: row.total,
    delivery_fee: row.delivery_fee ?? 0,
    address: row.address ?? null,
    phone: row.phone ?? null,
    customer_name: row.customer_name,
    payment_method: row.payment_method,
    payment_status: row.payment_status ?? "unpaid",
    rating: row.rating ?? null,
    review_comment: row.review_comment ?? null,
    comment: row.comment ?? null,
    courier_id: row.courier_id ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    items: (row.order_items ?? []).map((i: any) => ({
      id: i.id,
      name_snapshot: i.name_snapshot,
      price_snapshot: i.price_snapshot,
      quantity: i.quantity,
    })),
  };
}

const ORDER_SELECT = "*, order_items(*)";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------- Меню ----------

export async function fetchMenuItems(): Promise<MenuItem[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoFetchMenu();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("created_at", { ascending: true });
  if (error || !data || data.length === 0) return SEED_MENU_ITEMS;
  return data as MenuItem[];
}

export async function saveMenuItem(
  item: Omit<MenuItem, "id"> & { id?: string },
): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    demo.demoUpsertMenuItem({
      ...item,
      id: item.id ?? `item-${Math.random().toString(36).slice(2)}`,
    });
    return;
  }
  // Сид-меню использует текстовые id — такие записи создаём в БД заново
  const { id, ...fields } = item;
  const { error } =
    id && UUID_RE.test(id)
      ? await supabase.from("menu_items").update(fields).eq("id", id)
      : await supabase.from("menu_items").insert(fields);
  if (error) throw new Error(error.message);
}

export async function deleteMenuItem(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    demo.demoDeleteMenuItem(id);
    return;
  }
  if (!UUID_RE.test(id)) {
    throw new Error(
      "Это блюдо из демо-сида: его нет в базе. Добавьте блюда через панель.",
    );
  }
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Загружает фото блюда в бакет `menu` (Supabase Storage) и возвращает
 * публичную ссылку. В демо-режиме файла грузить некуда, поэтому отдаём
 * data-URL — картинка будет жить в этом браузере.
 */
export async function uploadMenuImage(file: File): Promise<string> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
      reader.readAsDataURL(file);
    });
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Можно загрузить только изображение");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Файл больше 5 МБ — выберите фото поменьше");
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `dishes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from("menu")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw new Error(`Не удалось загрузить фото: ${error.message}`);

  const { data } = supabase.storage.from("menu").getPublicUrl(path);
  return data.publicUrl;
}

export function subscribeMenu(cb: () => void): () => void {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoSubscribe("menu", cb);
  const channel = supabase
    .channel("menu-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, cb)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------- Заказы ----------

/**
 * Заказ создаётся RPC-функцией create_order (SECURITY DEFINER):
 * гость не имеет права читать заказы, поэтому обычный
 * `insert ... returning` не прошёл бы RLS. Заодно сервер сам считает
 * сумму (цены + доставка) по данным из БД и пишет заказ вместе
 * с позициями атомарно.
 */
export async function createOrder(input: NewOrderInput): Promise<Order> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoCreateOrder(input);

  const { data, error } = await supabase.rpc("create_order", {
    p_order_type: input.order_type,
    p_table_code: input.table_code ?? null,
    p_address: input.address ?? null,
    p_phone: input.phone ?? null,
    p_customer_name: input.customer_name,
    p_payment_method: input.payment_method,
    p_comment: input.comment ?? null,
    p_items: input.items.map((ci) => ({
      menu_item_id: UUID_RE.test(ci.item.id) ? ci.item.id : null,
      name: ci.item.name,
      price: ci.item.price,
      quantity: ci.quantity,
    })),
  });
  if (error || !data) {
    throw new Error(error?.message ?? "Не удалось оформить заказ");
  }

  // RPC возвращает только строку orders — позиции подставляем из корзины
  return mapOrder({
    ...data,
    order_items: input.items.map((ci) => ({
      id: ci.item.id,
      name_snapshot: ci.item.name,
      price_snapshot: ci.item.price,
      quantity: ci.quantity,
    })),
  });
}

export async function fetchOrder(id: string): Promise<Order | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoFetchOrder(id);
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapOrder(data);
}

/**
 * Статус заказа по id — доступен и гостю (RPC поверх RLS).
 * Нужен для трекера на экране «Заявка принята», когда заказ
 * оформлен без регистрации.
 */
export async function fetchOrderStatus(
  id: string,
): Promise<OrderStatus | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoFetchOrder(id)?.status ?? null;
  const { data, error } = await supabase.rpc("order_status", {
    p_order_id: id,
  });
  if (error || !data) return null;
  return data as OrderStatus;
}

export async function fetchOrders(): Promise<Order[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoFetchOrders();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapOrder);
}

export async function fetchMyOrders(): Promise<Order[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoFetchOrders();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("customer_id", auth.user.id)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapOrder);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    demo.demoUpdateOrderStatus(id, status);
    return;
  }
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Клиент оценивает доставленный заказ (звёзды + комментарий) — через RPC. */
export async function rateOrder(
  id: string,
  input: RatingInput,
): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    demo.demoRateOrder(id, input);
    return;
  }
  const { error } = await supabase.rpc("rate_order", {
    p_order_id: id,
    p_rating: input.rating,
    p_comment: input.comment ?? null,
  });
  if (error) throw new Error(error.message);
}

/** Удаление заказа (для теста/очистки истории) — доступно только админу. */
export async function deleteOrder(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    demo.demoDeleteOrder(id);
    return;
  }
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Очистка завершённых заказов (доставленные + отменённые) — кнопка «очистить
 * историю» в админке. Возвращает, сколько удалено.
 */
export async function clearFinishedOrders(): Promise<number> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoClearFinishedOrders();
  const { data, error } = await supabase
    .from("orders")
    .delete()
    .in("status", ["delivered", "cancelled"])
    .select("id");
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

/** Отметка об оплате: в зале её ставит касса, при доставке — курьер/админ. */
export async function updateOrderPayment(
  id: string,
  payment_status: PaymentStatus,
): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    demo.demoUpdateOrderPayment(id, payment_status);
    return;
  }
  const { error } = await supabase
    .from("orders")
    .update({ payment_status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Курьер забирает готовый заказ: ready -> delivering + courier_id.
 * Условие `.eq("status", "ready")` делает операцию гонко-безопасной —
 * если заказ уже взял другой курьер, обновится 0 строк и мы честно
 * скажем об этом. Возвращает false, если заказ «увели».
 */
export async function claimOrderForDelivery(id: string): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoClaimOrder(id);

  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "delivering", courier_id: auth.user?.id ?? null })
    .eq("id", id)
    .eq("status", "ready")
    .select("id");
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export function subscribeOrders(cb: () => void): () => void {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoSubscribe("orders", cb);
  const channel = supabase
    .channel("orders-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, cb)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------- Столы ----------

/**
 * Гость, отсканировавший QR, узнаёт свой стол по коду через RPC.
 * Прямого чтения таблицы столов у него нет: в строке лежит код,
 * а раздавать коды всех столов подряд ни к чему.
 */
export async function fetchTableByCode(
  code: string,
): Promise<GuestTable | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoFetchTableByCode(code);
  const { data, error } = await supabase.rpc("table_by_code", {
    p_code: code,
  });
  if (error || !data || data.length === 0) return null;
  return data[0] as GuestTable;
}

export async function fetchTables(): Promise<Table[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoFetchTables();
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .order("number", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Table[];
}

export async function createTable(input: NewTableInput): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    demo.demoCreateTable(input);
    return;
  }
  const { error } = await supabase.from("tables").insert({
    number: input.number,
    seats: input.seats,
    zone: input.zone || null,
  });
  if (error) {
    throw new Error(
      error.code === "23505"
        ? `Стол №${input.number} уже есть`
        : error.message,
    );
  }
}

export async function updateTable(
  id: string,
  fields: Partial<Pick<Table, "number" | "seats" | "zone" | "is_active" | "is_occupied">>,
): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    demo.demoUpdateTable(id, fields);
    return;
  }
  const { error } = await supabase.from("tables").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTable(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    demo.demoDeleteTable(id);
    return;
  }
  const { error } = await supabase.from("tables").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function subscribeTables(cb: () => void): () => void {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoSubscribe("tables", cb);
  const channel = supabase
    .channel("tables-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "tables" }, cb)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------- Настройки доставки ----------

export async function fetchSettings(): Promise<Settings> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoFetchSettings();
  const { data, error } = await supabase
    .from("settings")
    .select("delivery_fee, free_delivery_from, min_order")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return DEFAULT_SETTINGS;
  return data as Settings;
}

export async function saveSettings(settings: Settings): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    demo.demoSaveSettings(settings);
    return;
  }
  const { error } = await supabase
    .from("settings")
    .update(settings)
    .eq("id", 1);
  if (error) throw new Error(error.message);
}

/** Стоимость доставки для показанной корзины (то же правило, что в БД). */
export function deliveryFeeFor(subtotal: number, settings: Settings): number {
  if (settings.free_delivery_from > 0 && subtotal >= settings.free_delivery_from) {
    return 0;
  }
  return settings.delivery_fee;
}

// ---------- Брони ----------

/** Бронь создаётся RPC-функцией: гость не имеет SELECT-прав на reservations. */
export async function createReservation(
  input: NewReservationInput,
): Promise<Reservation> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoCreateReservation(input);
  const { data, error } = await supabase.rpc("create_reservation", {
    p_name: input.name,
    p_phone: input.phone,
    p_date: input.date,
    p_time: input.time,
    p_guests: input.guests,
    p_establishment_id: input.establishment_id,
  });
  if (error || !data) {
    throw new Error(error?.message ?? "Не удалось отправить бронь");
  }
  return data as Reservation;
}

export async function fetchReservations(): Promise<Reservation[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoFetchReservations();
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Reservation[];
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    demo.demoUpdateReservationStatus(id, status);
    return;
  }
  const { error } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Удаление брони (для теста/очистки) — только админ. */
export async function deleteReservation(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    demo.demoDeleteReservation(id);
    return;
  }
  const { error } = await supabase
    .from("reservations")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Админ сажает бронь за конкретный стол (или снимает привязку). */
export async function updateReservationTable(
  id: string,
  table_id: string | null,
): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    demo.demoUpdateReservationTable(id, table_id);
    return;
  }
  const { error } = await supabase
    .from("reservations")
    .update({ table_id })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------- Персонал ----------

/**
 * Учётки сотрудников заводит сама база (функции admin_* с security definer):
 * создавать пользователей из браузера можно только сервисным ключом, а его
 * нельзя отдавать во фронтенд — он даёт полный доступ ко всем данным.
 */
export async function fetchStaff(): Promise<StaffMember[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoFetchStaff();
  const { data, error } = await supabase.rpc("admin_list_staff");
  if (error) throw new Error(error.message);
  return (data ?? []) as StaffMember[];
}

export async function createStaff(input: NewStaffInput): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    demo.demoCreateStaff(input);
    return;
  }
  const { error } = await supabase.rpc("admin_create_staff", {
    p_email: input.email,
    p_password: input.password,
    p_name: input.name,
    p_phone: input.phone,
    p_role: input.role,
  });
  if (error) throw new Error(error.message);
}

export async function updateStaffRole(id: string, role: Role): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    demo.demoUpdateStaffRole(id, role);
    return;
  }
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setStaffPassword(
  id: string,
  password: string,
): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;
  const { error } = await supabase.rpc("admin_set_password", {
    p_user_id: id,
    p_password: password,
  });
  if (error) throw new Error(error.message);
}

/**
 * Статистика по курьерам: считается на клиенте из уже загруженных заказов —
 * админ и так видит все заказы, отдельный запрос не нужен. Онлайн-статус
 * выводим из активных доставок (у кого сейчас есть заказ «в пути»).
 */
export function computeCourierStats(
  couriers: StaffMember[],
  orders: Order[],
): CourierStats[] {
  const todayKey = new Date().toDateString();

  return couriers.map((c) => {
    const mine = orders.filter((o) => o.courier_id === c.id);
    const delivered = mine.filter((o) => o.status === "delivered");
    const rated = delivered.filter((o) => o.rating != null);
    const ratingSum = rated.reduce((s, o) => s + (o.rating ?? 0), 0);
    const active = mine.filter((o) => o.status === "delivering").length;

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      active,
      deliveredToday: delivered.filter(
        (o) => new Date(o.updated_at).toDateString() === todayKey,
      ).length,
      deliveredTotal: delivered.length,
      rating: rated.length ? ratingSum / rated.length : null,
      ratingCount: rated.length,
      online: active > 0,
    };
  });
}

export async function deleteStaff(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    demo.demoDeleteStaff(id);
    return;
  }
  const { error } = await supabase.rpc("admin_delete_staff", {
    p_user_id: id,
  });
  if (error) throw new Error(error.message);
}

export function subscribeReservations(cb: () => void): () => void {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoSubscribe("reservations", cb);
  const channel = supabase
    .channel("reservations-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "reservations" },
      cb,
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
