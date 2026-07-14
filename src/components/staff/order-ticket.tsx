import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatPrice, formatTime } from "@/lib/format";
import type { Order } from "@/lib/types";
import {
  Clock,
  MapPin,
  MessageSquare,
  Phone,
  User,
  UtensilsCrossed,
} from "lucide-react";
import type { ReactNode } from "react";

/** tel:-ссылка без пробелов и скобок */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

interface OrderTicketProps {
  order: Order;
  /** Крупный список позиций (режим кухни) */
  largeItems?: boolean;
  /** Жёлтая плашка с комментарием клиента (если он есть) */
  showComment?: boolean;
  /** Итого + бейдж способа оплаты */
  showTotal?: boolean;
  /** Имя, адрес и телефон клиента */
  showContacts?: boolean;
  /** Элемент справа в шапке чека (напр., «12 мин в работе») */
  meta?: ReactNode;
  /** Кнопки действий внизу чека */
  children?: ReactNode;
  className?: string;
}

/** Карточка-«чек» заказа для панелей персонала (кухня, курьер). */
export function OrderTicket({
  order,
  largeItems = false,
  showComment = false,
  showTotal = false,
  showContacts = false,
  meta,
  children,
  className,
}: OrderTicketProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardBody className="flex flex-1 flex-col gap-4">
        {/* Шапка чека: номер + время (+ стол, если заказ в зале) */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-heading text-2xl font-extrabold tracking-tight">
                {order.order_number}
              </span>
              {order.order_type === "dine_in" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-0.5 text-sm font-bold text-primary">
                  <UtensilsCrossed className="size-3.5" aria-hidden />
                  Стол №{order.table_number}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <Clock className="size-4" aria-hidden />
              {formatTime(order.created_at)}
            </div>
          </div>
          {meta}
        </div>

        {/* Состав заказа */}
        <ul className="divide-y divide-line border-y border-line">
          {order.items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "py-2 font-semibold",
                largeItems ? "text-lg" : "text-sm",
              )}
            >
              {item.quantity} × {item.name_snapshot}
            </li>
          ))}
        </ul>

        {/* Комментарий клиента */}
        {showComment && order.comment && (
          <div className="flex items-start gap-2 rounded-btn border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-300">
            <MessageSquare className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{order.comment}</span>
          </div>
        )}

        {/* Итого + способ оплаты */}
        {showTotal && (
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted">
                Итого
              </div>
              <div className="font-heading text-2xl font-extrabold">
                {formatPrice(order.total)}
              </div>
            </div>
            <Badge
              className={cn(
                order.payment_method === "kaspi" &&
                  "border-primary/40 bg-primary/15 text-primary",
              )}
            >
              {PAYMENT_METHOD_LABELS[order.payment_method]}
            </Badge>
          </div>
        )}

        {/* Контакты клиента (у заказа в зале их может не быть) */}
        {showContacts && (
          <div className="space-y-2 text-sm">
            {order.address && (
              <div className="flex items-start gap-2">
                <MapPin
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden
                />
                <span>{order.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <User className="size-4 shrink-0 text-muted" aria-hidden />
              <span>{order.customer_name || "Гость"}</span>
            </div>
            {order.phone && (
              <div className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-muted" aria-hidden />
                <a
                  href={telHref(order.phone)}
                  className="transition-colors hover:text-primary"
                >
                  {order.phone}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Действия */}
        {children && <div className="mt-auto space-y-2 pt-1">{children}</div>}
      </CardBody>
    </Card>
  );
}
