import type { PaymentDto } from "../../payments/data/models";
import type { OrderStatus, ShippingAddress } from "../domain/orders";
export interface ItemDto {
  id: string;
  product_id: string | null;
  shop_id: string | null;
  product_name_en: string;
  product_name_ar: string;
  product_photo: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}
export interface OrderDto {
  id: string;
  currency?: string;
  order_number: string;
  user_id: string;
  subtotal_amount: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  status: OrderStatus;
  shipping_address: ShippingAddress;
  notes: string;
  created_at: string;
  updated_at: string;
  order_items: ItemDto[];
  payments?: PaymentDto[];
}
