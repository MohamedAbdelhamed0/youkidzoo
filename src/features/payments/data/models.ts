import type { Payment } from "../domain/Payment";
export interface PaymentDto {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  currency: string;
  method: Payment["method"];
  status: Payment["status"];
  provider_transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
}
