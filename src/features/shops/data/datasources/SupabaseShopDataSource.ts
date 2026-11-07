import type { SupabaseClient } from "@supabase/supabase-js";
import { readPages } from "../../../../core/data/readPages";
import type { ShopDto } from "../models";
import type { IShopDataSource } from "./IShopDataSource";
export class SupabaseShopDataSource implements IShopDataSource {
  constructor(private readonly client: SupabaseClient) {}
  getShops() {
    return readPages<ShopDto>((start, end) =>
      this.client
        .from("shops")
        .select("*")
        .eq("is_active", true)
        .order("id")
        .range(start, end),
    );
  }
  async getCategoryIds(shopId: string) {
    return (
      await readPages<{ category_id: string }>((start, end) =>
        this.client
          .from("shop_categories")
          .select("category_id")
          .eq("shop_id", shopId)
          .order("category_id")
          .range(start, end),
      )
    ).map((c) => c.category_id);
  }
}
