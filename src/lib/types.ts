export type Role = "customer" | "admin" | "kitchen" | "courier";

export type OrderStatus =
  | "new"
  | "cooking"
  | "ready"
  | "delivering"
  | "delivered"
  | "cancelled";

export type ReservationStatus = "new" | "confirmed" | "cancelled";

export type PaymentMethod = "cash" | "card" | "kaspi";

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
  total: number;
  address: string;
  phone: string;
  customer_name: string;
  payment_method: PaymentMethod;
  comment: string | null;
  /** Курьер, забравший заказ в доставку */
  courier_id: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface Reservation {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  establishment_id: string;
  status: ReservationStatus;
  created_at: string;
}

export interface Profile {
  id: string;
  role: Role;
  name: string | null;
  phone: string | null;
}

export interface NewOrderInput {
  address: string;
  phone: string;
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
