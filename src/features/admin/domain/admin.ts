export interface AssignableUser {
  id: string;
  username: string;
  full_name: string | null;
  email: string;
}
export type Resource = "products" | "categories" | "shops";
export type AdminRow = Record<string, unknown> & { id: string };
export interface ImageUpload {
  name: string;
  mimeType: string;
  size: number;
  bytes: Uint8Array;
}
export interface AdminRepository {
  searchUsers(query: string): Promise<AssignableUser[]>;
  shopOwners(shopId: string): Promise<AssignableUser[]>;
  saveShop(
    payload: Record<string, unknown>,
    owners: string[],
    id?: string,
  ): Promise<void>;
  ownerRecords(resource: Resource): Promise<AdminRow[]>;
  saveOwnerProduct(
    payload: Record<string, unknown>,
    id?: string,
  ): Promise<void>;
  removeOwnerProduct(id: string): Promise<void>;

  list(resource: Resource): Promise<AdminRow[]>;
  save(
    resource: Resource,
    payload: Record<string, unknown>,
    id?: string,
  ): Promise<void>;
  remove(resource: Resource, id: string): Promise<void>;
  upload(file: ImageUpload, shopId?: string): Promise<string>;
  shopCategories(shopId: string): Promise<string[]>;
  setShopCategories(shopId: string, ids: string[]): Promise<void>;
}
