import demo from "../../../../shared/data/demo-data.json";
import type { IShopDataSource } from "./IShopDataSource";
export class DemoShopDataSource implements IShopDataSource {
  async getShops() {
    return demo.shops;
  }
  async getCategoryIds(shopId: string) {
    return [
      ...new Set(
        demo.products
          .filter((p) => p.shop_id === shopId)
          .map((p) => p.category_id),
      ),
    ];
  }
}
