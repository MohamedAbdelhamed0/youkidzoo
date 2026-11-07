import type { PaymentDto } from "../models";
export interface IPaymentDataSource {
  getPayments(): Promise<PaymentDto[]>;
}
