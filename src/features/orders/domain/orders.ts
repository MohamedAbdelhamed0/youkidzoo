import type { Payment } from "../../payments/domain/Payment";
export type {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from "../../payments/domain/Payment";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
export interface ShippingAddress {
  recipientName: string;
  phone: string;
  country: string;
  city: string;
  streetAddress: string;
  postalCode?: string;
}
export interface OrderItem {
  id: string;
  productId: string | null;
  shopId: string | null;
  productName: { en: string; ar: string };
  photo: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}
export interface Order {
  id: string;
  currency?: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  notes: string;
  createdAt: string;
  updatedAt: string;
  payments?: Payment[];
}
export interface OrderRepository {
  list(): Promise<Order[]>;
  place(input: {
    items: { productId: string; quantity: number }[];
    address: ShippingAddress;
    notes: string;
    requestId: string;
  }): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<void>;
}
