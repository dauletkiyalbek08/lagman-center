export type Role = "customer" | "admin" | "kitchen" | "courier";

export type OrderStatus =
  | "new"
  | "cooking"
  | "ready"
  | "delivering"
  | "delivered"
  | "cancelled";

/** `dine_in` — заказ за столом по QR-коду, `delivery` — доставка на адрес */
export type OrderType = "delivery" | "dine_in";

export type PaymentStatus = "unpaid" | "paid";

export type ReservationStatus = "new" | "confirmed" | "cancelled";

/** `counter` — оплата на кассе (заказ в зале) */
export type PaymentMethod = "cash" | "card" | "kaspi" | "counter";

/** Способы оплаты, которые клиент выбирает сам (только доставка) */
export type DeliveryPaymentMethod = Exclude<PaymentMethod, "counter">;

export interface Establishment {
  id: string;
  name: string;
  address: string;
  hours: string;
  tag: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface OrderItem {
  id: string;
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  status: OrderStatus;
  order_type: OrderType;
  /** Стол (только для заказа в зале) */
  table_id: string | null;
  /**
   * Номер стола копией в самом заказе: кухня и курьер не имеют прав
   * на таблицу столов, а номер им нужен.
   */
  table_number: number | null;
  /** Сумма с доставкой */
  total: number;
  delivery_fee: number;
  /** null у заказа в зале */
  address: string | null;
  phone: string | null;
  customer_name: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  comment: string | null;
  /** Курьер, забравший заказ в доставку */
  courier_id: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

/** Стол в зале (панель администратора) */
export interface Table {
  id: string;
  number: number;
  seats: number;
  zone: string | null;
  /** Код в QR-ссылке /t/<code> */
  code: string;
  is_active: boolean;
  /** Гости за столом — отмечает официант/админ или заказ по QR */
  is_occupied: boolean;
  created_at: string;
}

/** Что видит гость, отсканировавший QR-код стола */
export interface GuestTable {
  id: string;
  number: number;
  seats: number;
  zone: string | null;
}

/** Настройки доставки (одна строка в БД) */
export interface Settings {
  delivery_fee: number;
  /** 0 — бесплатной доставки нет */
  free_delivery_from: number;
  /** 0 — минимальной суммы нет */
  min_order: number;
}

export interface Reservation {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  establishment_id: string;
  table_id: string | null;
  status: ReservationStatus;
  created_at: string;
}

export interface Profile {
  id: string;
  role: Role;
  name: string | null;
  phone: string | null;
  address: string | null;
}

/** Сотрудник в панели администратора (профиль + email из auth) */
export interface StaffMember {
  id: string;
  email: string;
  role: Role;
  name: string | null;
  phone: string | null;
  created_at: string;
}

export interface NewStaffInput {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: Role;
}

export interface NewOrderInput {
  order_type: OrderType;
  /** Код стола из QR — обязателен для заказа в зале */
  table_code?: string;
  address?: string;
  phone?: string;
  customer_name: string;
  payment_method: PaymentMethod;
  comment?: string;
  items: CartItem[];
}

export interface NewReservationInput {
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  establishment_id: string;
}

export interface NewTableInput {
  number: number;
  seats: number;
  zone?: string;
}
