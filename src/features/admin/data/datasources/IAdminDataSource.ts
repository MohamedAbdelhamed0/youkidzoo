import type {
  AdminRow,
  Resource,
  ImageUpload,
  AssignableUser,
} from "../../domain/admin";
export interface IAdminDataSource {
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

  getRecords(resource: Resource): Promise<AdminRow[]>;
  save(
    resource: Resource,
    payload: Record<string, unknown>,
    id?: string,
  ): Promise<void>;
  remove(resource: Resource, id: string): Promise<void>;
  upload(file: ImageUpload, shopId?: string): Promise<string>;
  getShopCategories(shopId: string): Promise<string[]>;
  setShopCategories(shopId: string, ids: string[]): Promise<void>;
}
