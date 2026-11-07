import type { SupabaseClient } from "@supabase/supabase-js";
import { readPages } from "../../../../core/data/readPages";
import type { OrderRepository, OrderStatus } from "../../domain/orders";
import type { OrderDto } from "../models";
import type { IOrderDataSource } from "./IOrderDataSource";
export class SupabaseOrderDataSource implements IOrderDataSource {
  constructor(private readonly client: SupabaseClient | null) {}
  private requireClient() {
    if (!this.client)
      throw new Error(
        "The store is not connected yet. Please connect Supabase.",
      );
    return this.client;
  }
  getOrders() {
    return readPages<OrderDto>((start, end) =>
      this.requireClient()
        .from("orders")
        .select("*,order_items(*),payments(*)")
        .order("created_at", { ascending: false })
        .order("id")
        .range(start, end),
    );
  }
  async place(input: Parameters<OrderRepository["place"]>[0]) {
    const client = this.requireClient();
    const { data: id, error } = await client.rpc("place_order", {
      p_items: input.items,
      p_address: input.address,
      p_notes: input.notes,
      p_request_id: input.requestId,
    });
    if (error) throw error;
    const result = await client
      .from("orders")
      .select("*,order_items(*),payments(*)")
      .eq("id", id)
      .single();
    if (result.error) throw result.error;
    return result.data as OrderDto;
  }
  async updateStatus(id: string, status: OrderStatus) {
    const { error } = await this.requireClient().rpc("set_order_status", {
      p_order_id: id,
      p_status: status,
    });
    if (error) throw error;
  }
}
