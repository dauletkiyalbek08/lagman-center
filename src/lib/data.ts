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
  MenuItem,
  NewOrderInput,
  NewReservationInput,
  Order,
  OrderStatus,
  Reservation,
  ReservationStatus,
} from "./types";

export { isSupabaseConfigured };

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapOrder(row: any): Order {
  return {
    id: row.id,
    order_number: row.order_number,
    customer_id: row.customer_id ?? null,
    status: row.status,
    total: row.total,
    address: row.address,
    phone: row.phone,
    customer_name: row.customer_name,
    payment_method: row.payment_method,
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
 * сумму по ценам из БД и пишет заказ вместе с позициями атомарно.
 */
export async function createOrder(input: NewOrderInput): Promise<Order> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return demo.demoCreateOrder(input);

  const { data, error } = await supabase.rpc("create_order", {
    p_address: input.address,
    p_phone: input.phone,
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
