import type {
  DeliveryPaymentMethod,
  Establishment,
  OrderStatus,
  OrderType,
  PaymentMethod,
  ReservationStatus,
} from "./types";

export const SITE_NAME = "Lagman Center";

export const CONTACTS = {
  phone: "+7 707 917 9404",
  phoneHref: "tel:+77079179404",
  whatsapp: "https://wa.me/77079179404",
  instagram: "https://www.instagram.com/lagman_center_shchuchinsk",
  instagramHandle: "@lagman_center_shchuchinsk",
  vk: "https://vk.com/lagman_center_shchuchinsk",
  vkHandle: "lagman_center_shchuchinsk",
  hours: "10:00 – 23:00",
  hoursNote: "Ежедневно",
  city: "Щучинск",
};

export const ESTABLISHMENTS: Establishment[] = [
  {
    id: "shashlychny-dvor",
    name: "Шашлычный двор",
    address: "Летняя терраса в парке, Щучинск",
    hours: "10:00 – 23:00",
    tag: "Летняя терраса",
  },
  {
    id: "lagman-center",
    name: "Lagman Center",
    address: "Щучинск, Халал Кафе",
    hours: "10:00 – 23:00",
    tag: "Кафе",
  },
];

export const NAV_LINKS = [
  { href: "/", label: "Главная" },
  { href: "/menu", label: "Меню" },
  { href: "/delivery", label: "Доставка" },
  { href: "/booking", label: "Бронирование" },
  { href: "/about", label: "О нас" },
  { href: "/contacts", label: "Контакты" },
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Новая",
  cooking: "Готовится",
  ready: "Готов к выдаче",
  delivering: "В пути",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  delivery: "Доставка",
  dine_in: "В зале",
};

/** Заказ в зале не «доставляют», а подают — подпись статуса зависит от типа. */
export function orderStatusLabel(status: OrderStatus, type: OrderType): string {
  if (type === "dine_in") {
    if (status === "ready") return "Готов к подаче";
    if (status === "delivered") return "Подан";
  }
  return ORDER_STATUS_LABELS[status];
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  new: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  cooking: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  ready: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  delivering: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  delivered: "bg-white/10 text-white/70 border-white/20",
  cancelled: "bg-primary/15 text-primary border-primary/30",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Наличными",
  card: "Картой курьеру",
  kaspi: "Kaspi",
  counter: "На кассе",
};

/** Способы оплаты, которые клиент выбирает сам. В зале платят на кассе. */
export const DELIVERY_PAYMENT_METHODS: DeliveryPaymentMethod[] = [
  "cash",
  "card",
  "kaspi",
];

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  new: "Новая",
  confirmed: "Подтверждена",
  cancelled: "Отменена",
};

export const ROLE_LABELS = {
  customer: "Клиент",
  admin: "Администратор",
  kitchen: "Кухня",
  courier: "Курьер",
} as const;
