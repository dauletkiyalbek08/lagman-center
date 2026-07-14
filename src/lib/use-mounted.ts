"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * true после гидрации на клиенте, false в SSR-снапшоте.
 * Нужен для UI, зависящего от localStorage (бейдж корзины и т.п.).
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
