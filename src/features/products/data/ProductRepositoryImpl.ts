import type { ProductRepository } from "../domain/Product";
import type { IProductDataSource } from "./datasources/IProductDataSource";
import { mapProduct } from "./mappers";
export class ProductRepositoryImpl implements ProductRepository {
  constructor(private readonly source: IProductDataSource) {}
  async list() {
    return (await this.source.getProducts()).map(mapProduct);
  }
}
