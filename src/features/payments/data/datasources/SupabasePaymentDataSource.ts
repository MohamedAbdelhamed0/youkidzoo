import type { SupabaseClient } from "@supabase/supabase-js";
import { readPages } from "../../../../core/data/readPages";
import type { PaymentDto } from "../models";
import type { IPaymentDataSource } from "./IPaymentDataSource";
export class SupabasePaymentDataSource implements IPaymentDataSource {
  constructor(private readonly client: SupabaseClient | null) {}
  getPayments() {
    if (!this.client)
      throw new Error(
        "The store is not connected yet. Please connect Supabase.",
      );
    const client = this.client;
    return readPages<PaymentDto>((start, end) =>
      client
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id")
        .range(start, end),
    );
  }
}
