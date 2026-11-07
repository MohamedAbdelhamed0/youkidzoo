export type PaymentMethod =
  "cash_on_delivery" | "credit_card" | "apple_pay" | "wallet";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  providerTransactionId: string | null;
  paidAt: string | null;
  createdAt: string;
}
export interface PaymentRepository {
  list(): Promise<Payment[]>;
}
