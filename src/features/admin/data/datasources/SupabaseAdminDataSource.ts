import type { SupabaseClient } from "@supabase/supabase-js";
import { readPages } from "../../../../core/data/readPages";
import type { IAdminDataSource } from "./IAdminDataSource";
import type { AdminRow, Resource, ImageUpload } from "../../domain/admin";
export class SupabaseAdminDataSource implements IAdminDataSource {
  constructor(private readonly client: SupabaseClient | null) {}
  private requireClient() {
    if (!this.client)
      throw new Error(
        "The store is not connected yet. Please connect Supabase.",
      );
    return this.client;
  }
  getRecords(resource: Resource) {
    return readPages<AdminRow>((start, end) =>
      this.requireClient()
        .from(resource)
        .select("*")
        .order("created_at", { ascending: false })
        .order("id")
        .range(start, end),
    );
  }
  async save(
    resource: Resource,
    payload: Record<string, unknown>,
    id?: string,
  ) {
    const client = this.requireClient();
    const result = id
      ? await client
          .from(resource)
          .update(payload)
          .eq("id", id)
          .select("id")
          .single()
      : await client.from(resource).insert(payload).select("id").single();
    if (result.error) throw result.error;
  }
  async remove(resource: Resource, id: string) {
    const { error } = await this.requireClient()
      .from(resource)
      .delete()
      .eq("id", id)
      .select("id")
      .single();
    if (error) throw error;
  }
  async upload(file: ImageUpload) {
    const client = this.requireClient();
    const path = `products/${crypto.randomUUID()}.${file.mimeType.split("/")[1]}`;
    const { error } = await client.storage
      .from("store-images")
      .upload(path, file.bytes, { upsert: false, contentType: file.mimeType });
    if (error) throw error;
    return client.storage.from("store-images").getPublicUrl(path).data
      .publicUrl;
  }
  async getShopCategories(shopId: string) {
    return (
      await readPages<{ category_id: string }>((start, end) =>
        this.requireClient()
          .from("shop_categories")
          .select("category_id")
          .eq("shop_id", shopId)
          .order("category_id")
          .range(start, end),
      )
    ).map((r) => r.category_id);
  }
  async setShopCategories(shopId: string, ids: string[]) {
    const { error } = await this.requireClient().rpc("set_shop_categories", {
      p_shop_id: shopId,
      p_category_ids: ids,
    });
    if (error) throw error;
  }
}
