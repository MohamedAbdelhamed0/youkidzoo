import demo from "../../../../shared/data/demo-data.json";
import type { ICategoryDataSource } from "./ICategoryDataSource";
export class DemoCategoryDataSource implements ICategoryDataSource {
  async getCategories() {
    return demo.categories;
  }
}
