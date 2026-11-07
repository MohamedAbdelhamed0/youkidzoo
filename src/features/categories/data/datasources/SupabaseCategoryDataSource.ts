import type { SupabaseClient } from "@supabase/supabase-js";
import { readPages } from "../../../../core/data/readPages";
import type { CategoryDto } from "../models";
import type { ICategoryDataSource } from "./ICategoryDataSource";
export class SupabaseCategoryDataSource implements ICategoryDataSource {
  constructor(private readonly client: SupabaseClient) {}
  getCategories() {
    return readPages<CategoryDto>((start, end) =>
      this.client
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order")
        .order("id")
        .range(start, end),
    );
  }
}
