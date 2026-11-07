import type { ProductDto } from "../models";
export interface IProductDataSource {
  getProducts(): Promise<ProductDto[]>;
}
