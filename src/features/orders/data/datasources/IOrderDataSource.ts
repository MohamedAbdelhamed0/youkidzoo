import type { OrderRepository, OrderStatus } from "../../domain/orders";
import type { OrderDto } from "../models";
export interface IOrderDataSource {
  getOrders(): Promise<OrderDto[]>;
  place(input: Parameters<OrderRepository["place"]>[0]): Promise<OrderDto>;
  updateStatus(id: string, status: OrderStatus): Promise<void>;
}
