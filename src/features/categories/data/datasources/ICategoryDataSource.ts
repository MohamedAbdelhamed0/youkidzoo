import type { CategoryDto } from "../models";
export interface ICategoryDataSource {
  getCategories(): Promise<CategoryDto[]>;
}
