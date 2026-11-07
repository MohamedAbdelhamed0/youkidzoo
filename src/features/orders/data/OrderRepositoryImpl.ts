import type { OrderRepository, OrderStatus } from "../domain/orders";
import type { IOrderDataSource } from "./datasources/IOrderDataSource";
import { mapOrder } from "./mappers";
export class OrderRepositoryImpl implements OrderRepository {
  constructor(private readonly source: IOrderDataSource) {}
  async list() {
    return (await this.source.getOrders()).map(mapOrder);
  }
  async place(input: Parameters<OrderRepository["place"]>[0]) {
    return mapOrder(await this.source.place(input));
  }
  updateStatus(id: string, status: OrderStatus) {
    return this.source.updateStatus(id, status);
  }
}
