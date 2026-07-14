"use client";

import { useSyncExternalStore } from "react";
import type { Order } from "./types";

const STORAGE_KEY = "lagman.last-order";

/**
 * Снимок последнего оформленного заказа в localStorage.
 * Гость (без регистрации) не может прочитать свой заказ из базы — RLS
 * отдаёт строку только владельцу и персоналу, — поэтому состав и сумму
 * показываем из снимка, а живой статус подтягиваем отдельно (order_status).
 * Как и корзина, читается через useSyncExternalStore: SSR-снимок пустой,
 * поэтому гидрация не расходится.
 */
let cachedRaw: string | null = null;
let cachedOrder: Order | null = null;

const listeners = new Set<() => void>();

function read(): Order | null {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cachedOrder;
  }
  if (raw === cachedRaw) return cachedOrder;
  cachedRaw = raw;
  try {
    cachedOrder = raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    cachedOrder = null;
  }
  return cachedOrder;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function saveLastOrder(order: Order): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    // приватный режим: держим снимок в памяти до перезагрузки
    cachedRaw = null;
    cachedOrder = order;
  }
  listeners.forEach((l) => l());
}

export function clearLastOrder(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    cachedRaw = null;
    cachedOrder = null;
  }
  listeners.forEach((l) => l());
}

export function useLastOrder(): Order | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
