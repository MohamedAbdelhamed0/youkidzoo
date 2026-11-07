import { mapPayment } from "../../payments/data/mappers";
import type { Order } from "../domain/orders";
import type { OrderDto } from "./models";
import { STORE_CURRENCY } from "../../products/domain/pricing";
export const mapOrder = (o: OrderDto): Order => ({
  id: o.id,
  currency: o.currency || o.payments?.[0]?.currency || STORE_CURRENCY,
  orderNumber: o.order_number,
  userId: o.user_id,
  subtotal: Number(o.subtotal_amount),
  shippingFee: Number(o.shipping_fee),
  discount: Number(o.discount_amount),
  total: Number(o.total_amount),
  status: o.status,
  shippingAddress: { ...o.shipping_address },
  notes: o.notes || "",
  createdAt: o.created_at,
  updatedAt: o.updated_at,
  payments: o.payments?.map(mapPayment),
  items: o.order_items.map((i) => ({
    id: i.id,
    productId: i.product_id,
    shopId: i.shop_id,
    productName: { en: i.product_name_en, ar: i.product_name_ar },
    photo: i.product_photo,
    unitPrice: Number(i.unit_price),
    quantity: i.quantity,
    subtotal: Number(i.subtotal),
  })),
});
