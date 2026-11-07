import type { ShopDto } from "../models";
export interface IShopDataSource {
  getShops(): Promise<ShopDto[]>;
  getCategoryIds(shopId: string): Promise<string[]>;
}
