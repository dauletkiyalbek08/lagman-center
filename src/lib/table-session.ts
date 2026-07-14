"use client";

import { useSyncExternalStore } from "react";
import type { GuestTable } from "./types";

const STORAGE_KEY = "lagman.table";

/**
 * Сколько живёт «стол» после сканирования QR. Гость поел и ушёл — а браузер
 * помнит; поэтому режим зала сам выключается через несколько часов, чтобы
 * человек из дома случайно не заказал «за стол №5».
 */
const TTL_MS = 6 * 60 * 60 * 1000;

export interface TableSession extends GuestTable {
  /** Код из QR-ссылки — по нему база находит стол при оформлении заказа */
  code: string;
  savedAt: number;
}

/**
 * Стол, за которым сидит гость: сохраняется при переходе по /t/<code>.
 * Как корзина, читается через useSyncExternalStore — SSR-снимок пустой,
 * поэтому гидрация не расходится.
 */
let cachedRaw: string | null = null;
let cachedSession: TableSession | null = null;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function read(): TableSession | null {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cachedSession;
  }
  if (raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as TableSession) : null;
    cachedSession =
      parsed && Date.now() - parsed.savedAt < TTL_MS ? parsed : null;
  } catch {
    cachedSession = null;
  }
  return cachedSession;
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

export function saveTableSession(table: GuestTable, code: string): void {
  const session: TableSession = { ...table, code, savedAt: Date.now() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    cachedRaw = null;
    cachedSession = session;
  }
  notify();
}

export function clearTableSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    cachedRaw = null;
    cachedSession = null;
  }
  notify();
}

export function useTableSession(): TableSession | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
