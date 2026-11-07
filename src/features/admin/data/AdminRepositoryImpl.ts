import type { AdminRepository, Resource, ImageUpload } from "../domain/admin";
import type { IAdminDataSource } from "./datasources/IAdminDataSource";
export class AdminRepositoryImpl implements AdminRepository {
  constructor(private readonly source: IAdminDataSource) {}
  list(resource: Resource) {
    return this.source.getRecords(resource);
  }
  save(resource: Resource, payload: Record<string, unknown>, id?: string) {
    return this.source.save(resource, payload, id);
  }
  remove(resource: Resource, id: string) {
    return this.source.remove(resource, id);
  }
  async upload(file: ImageUpload) {
    if (
      !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
        file.mimeType,
      ) ||
      file.size < 1 ||
      file.size > 5 * 1024 * 1024 ||
      file.bytes.byteLength !== file.size
    )
      throw new Error("Use JPEG, PNG, WebP, or AVIF images up to 5 MB.");
    return this.source.upload(file);
  }
  shopCategories(shopId: string) {
    return this.source.getShopCategories(shopId);
  }
  setShopCategories(shopId: string, ids: string[]) {
    return this.source.setShopCategories(shopId, ids);
  }
}
