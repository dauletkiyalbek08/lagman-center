"use client";

import { CartList } from "@/components/delivery/cart-list";
import { CheckoutForm } from "@/components/delivery/checkout-form";
import { EmptyCart } from "@/components/delivery/empty-cart";
import { OrderSuccess } from "@/components/delivery/order-success";
import { SectionHeading } from "@/components/section-heading";
import { useCart } from "@/lib/cart-context";
import { clearLastOrder, saveLastOrder, useLastOrder } from "@/lib/last-order";
import type { Order } from "@/lib/types";
import { useCallback } from "react";

export default function DeliveryPage() {
  const { items, clear } = useCart();
  const lastOrder = useLastOrder();

  const handleSuccess = useCallback(
    (created: Order) => {
      clear();
      saveLastOrder(created);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [clear],
  );

  const hasItems = items.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      {hasItems ? (
        <>
          <SectionHeading pre="ВАША" accent="КОРЗИНА" />
          <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
            <CartList />
            <CheckoutForm onSuccess={handleSuccess} />
          </div>
        </>
      ) : lastOrder ? (
        <OrderSuccess initialOrder={lastOrder} onDismiss={clearLastOrder} />
      ) : (
        <EmptyCart />
      )}
    </div>
  );
}
