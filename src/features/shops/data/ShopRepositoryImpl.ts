import type { ShopRepository } from "../domain/shops";
import type { IShopDataSource } from "./datasources/IShopDataSource";
import { mapShop } from "./mappers";
export class ShopRepositoryImpl implements ShopRepository {
  constructor(private readonly source: IShopDataSource) {}
  async list() {
    return (await this.source.getShops()).map(mapShop);
  }
  categoryIds(shopId: string) {
    return this.source.getCategoryIds(shopId);
  }
}
