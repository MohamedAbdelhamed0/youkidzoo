import demo from "../../../../shared/data/demo-data.json";
import { getDemoPhotoProducts } from "../demoPhotoProducts";
import type { ProductDto } from "../models";
import type { IProductDataSource } from "./IProductDataSource";
export class DemoProductDataSource implements IProductDataSource {
  async getProducts(): Promise<ProductDto[]> {
    const existing = demo.products.map((p) => ({
      ...p,
      dimensions: undefined,
      categories: demo.categories.find((c) => c.id === p.category_id)!,
    }));
    return [...getDemoPhotoProducts(), ...existing];
  }
}
