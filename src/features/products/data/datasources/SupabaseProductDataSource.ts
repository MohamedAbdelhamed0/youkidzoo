import type { SupabaseClient } from "@supabase/supabase-js";
import { readPages } from "../../../../core/data/readPages";
import type { ProductDto } from "../models";
import type { IProductDataSource } from "./IProductDataSource";
export class SupabaseProductDataSource implements IProductDataSource {
  constructor(private readonly client: SupabaseClient) {}
  getProducts() {
    return readPages<ProductDto>((start, end) =>
      this.client
        .from("products")
        .select("*,categories(name_en,name_ar)")
        .eq("is_active", true)
        .order("id")
        .range(start, end),
    );
  }
}
