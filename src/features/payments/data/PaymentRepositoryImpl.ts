import type { PaymentRepository } from "../domain/Payment";
import type { IPaymentDataSource } from "./datasources/IPaymentDataSource";
import { mapPayment } from "./mappers";
export class PaymentRepositoryImpl implements PaymentRepository {
  constructor(private readonly source: IPaymentDataSource) {}
  async list() {
    return (await this.source.getPayments()).map(mapPayment);
  }
}
