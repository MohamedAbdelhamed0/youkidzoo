import type { CategoryRepository } from "../domain/Category";
import type { ICategoryDataSource } from "./datasources/ICategoryDataSource";
import { mapCategory } from "./mappers";
import { orderCategories } from "../domain/tree";
export class CategoryRepositoryImpl implements CategoryRepository {
  constructor(private readonly source: ICategoryDataSource) {}
  async list() {
    return orderCategories(
      (await this.source.getCategories()).map(mapCategory),
    );
  }
}
