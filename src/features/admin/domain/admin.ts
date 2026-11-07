export type Resource = "products" | "categories" | "shops";
export type AdminRow = Record<string, unknown> & { id: string };
export interface ImageUpload {
  name: string;
  mimeType: string;
  size: number;
  bytes: Uint8Array;
}
export interface AdminRepository {
  list(resource: Resource): Promise<AdminRow[]>;
  save(
    resource: Resource,
    payload: Record<string, unknown>,
    id?: string,
  ): Promise<void>;
  remove(resource: Resource, id: string): Promise<void>;
  upload(file: ImageUpload): Promise<string>;
  shopCategories(shopId: string): Promise<string[]>;
  setShopCategories(shopId: string, ids: string[]): Promise<void>;
}
