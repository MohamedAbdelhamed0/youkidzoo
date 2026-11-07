import type { AdminRow, Resource, ImageUpload } from "../../domain/admin";
export interface IAdminDataSource {
  getRecords(resource: Resource): Promise<AdminRow[]>;
  save(
    resource: Resource,
    payload: Record<string, unknown>,
    id?: string,
  ): Promise<void>;
  remove(resource: Resource, id: string): Promise<void>;
  upload(file: ImageUpload): Promise<string>;
  getShopCategories(shopId: string): Promise<string[]>;
  setShopCategories(shopId: string, ids: string[]): Promise<void>;
}
