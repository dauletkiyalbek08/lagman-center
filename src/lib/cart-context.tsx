"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { CartItem, MenuItem } from "./types";

const STORAGE_KEY = "lagman.cart";
const EMPTY: CartItem[] = [];

/**
 * Корзина живёт в localStorage и раздаётся через useSyncExternalStore:
 * это безопасно для гидрации (SSR-снапшот — пустая корзина) и бесплатно
 * синхронизирует корзину между вкладками через событие storage.
 */
let cachedRaw: string | null = null;
let cachedItems: CartItem[] = EMPTY;

const listeners = new Set<() => void>();

function readItems(): CartItem[] {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cachedItems;
  }
  if (raw === cachedRaw) return cachedItems;
  cachedRaw = raw;
  try {
    cachedItems = raw ? (JSON.parse(raw) as CartItem[]) : EMPTY;
  } catch {
    cachedItems = EMPTY;
  }
  return cachedItems;
}

function writeItems(items: CartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage недоступен (private mode) — корзина проживёт до перезагрузки
    cachedRaw = null;
    cachedItems = items;
  }
  listeners.forEach((l) => l());
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

const getServerSnapshot = () => EMPTY;

interface CartContextValue {
  items: CartItem[];
  /** Суммарное количество позиций (для бейджа в шапке) */
  count: number;
  total: number;
  add: (item: MenuItem, quantity?: number) => void;
  remove: (itemId: string) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  clear: () => void;
  quantityOf: (itemId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, readItems, getServerSnapshot);

  const add = useCallback((item: MenuItem, quantity = 1) => {
    const current = readItems();
    const existing = current.find((ci) => ci.item.id === item.id);
    writeItems(
      existing
        ? current.map((ci) =>
            ci.item.id === item.id
              ? { ...ci, quantity: ci.quantity + quantity }
              : ci,
          )
        : [...current, { item, quantity }],
    );
  }, []);

  const remove = useCallback((itemId: string) => {
    writeItems(readItems().filter((ci) => ci.item.id !== itemId));
  }, []);

  const setQuantity = useCallback((itemId: string, quantity: number) => {
    const current = readItems();
    writeItems(
      quantity <= 0
        ? current.filter((ci) => ci.item.id !== itemId)
        : current.map((ci) =>
            ci.item.id === itemId ? { ...ci, quantity } : ci,
          ),
    );
  }, []);

  const clear = useCallback(() => writeItems([]), []);

  const quantityOf = useCallback(
    (itemId: string) =>
      items.find((ci) => ci.item.id === itemId)?.quantity ?? 0,
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((s, ci) => s + ci.quantity, 0),
      total: items.reduce((s, ci) => s + ci.item.price * ci.quantity, 0),
      add,
      remove,
      setQuantity,
      clear,
      quantityOf,
    }),
    [items, add, remove, setQuantity, clear, quantityOf],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
