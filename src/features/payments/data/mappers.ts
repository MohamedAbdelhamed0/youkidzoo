import type { Payment } from "../domain/Payment";
import type { PaymentDto } from "./models";
export const mapPayment = (p: PaymentDto): Payment => ({
  id: p.id,
  orderId: p.order_id,
  userId: p.user_id,
  amount: Number(p.amount),
  currency: p.currency,
  method: p.method,
  status: p.status,
  providerTransactionId: p.provider_transaction_id,
  paidAt: p.paid_at,
  createdAt: p.created_at,
});
