import type { SupabaseClient } from "@supabase/supabase-js";
import { readPages } from "../../../../core/data/readPages";
import type { IAdminDataSource } from "./IAdminDataSource";
import type {
  AdminRow,
  Resource,
  ImageUpload,
  AssignableUser,
} from "../../domain/admin";
export class SupabaseAdminDataSource implements IAdminDataSource {
  constructor(private readonly client: SupabaseClient | null) {}
  private requireClient() {
    if (!this.client)
      throw new Error(
        "The store is not connected yet. Please connect Supabase.",
      );
    return this.client;
  }
  async searchUsers(query: string) {
    const safe = query.replace(/[^\p{L}\p{N}_@. -]/gu, "").trim();
    const { data, error } = await this.requireClient()
      .from("profiles")
      .select("id,username,full_name,email")
      .eq("is_active", true)
      .or(
        `username.ilike.%${safe}%,full_name.ilike.%${safe}%,email.ilike.%${safe}%`,
      )
      .order("username")
      .limit(30);
    if (error) throw error;
    return data as AssignableUser[];
  }
  async shopOwners(shopId: string) {
    const rows = await readPages<{ user_id: string }>((start, end) =>
      this.requireClient()
        .from("shop_owners")
        .select("user_id")
        .eq("shop_id", shopId)
        .order("user_id")
        .range(start, end),
    );
    if (!rows.length) return [];
    return readPages<AssignableUser>((start, end) =>
      this.requireClient()
        .from("profiles")
        .select("id,username,full_name,email")
        .in(
          "id",
          rows.map((r) => r.user_id),
        )
        .order("id")
        .range(start, end),
    );
  }
  async saveShop(
    payload: Record<string, unknown>,
    owners: string[],
    id?: string,
  ) {
    const { error } = await this.requireClient().rpc("save_shop_with_owners", {
      p_id: id ?? null,
      p_shop: payload,
      p_owners: owners,
    });
    if (error) throw error;
  }
  async ownerRecords(resource: Resource) {
    const { data: auth, error } = await this.requireClient().auth.getUser();
    if (error) throw error;
    if (!auth.user) throw new Error("Please sign in.");
    const assignments = await readPages<{ shop_id: string }>((start, end) =>
      this.requireClient()
        .from("shop_owners")
        .select("shop_id")
        .eq("user_id", auth.user!.id)
        .order("shop_id")
        .range(start, end),
    );
    const ids = assignments.map((a) => a.shop_id);
    if (!ids.length) return [];
    return readPages<AdminRow>((start, end) => {
      let q = this.requireClient().from(resource).select("*");
      if (resource === "shops") q = q.in("id", ids);
      else if (resource === "products") q = q.in("shop_id", ids);
      else
        q = q
          .eq("is_active", true)
          .or(`shop_id.is.null,shop_id.in.(${ids.join(",")})`);
      return q.order("id").range(start, end);
    });
  }
  saveOwnerProduct(payload: Record<string, unknown>, id?: string) {
    return this.save("products", payload, id);
  }
  removeOwnerProduct(id: string) {
    return this.remove("products", id);
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
  async upload(file: ImageUpload, shopId?: string) {
    const client = this.requireClient();
    const path = `${shopId ? `shops/${shopId}` : "products"}/${crypto.randomUUID()}.${file.mimeType.split("/")[1]}`;
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
