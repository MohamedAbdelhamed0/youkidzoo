import demo from "../../../shared/data/demo-data.json";
import { mapProduct } from "./mappers";
export const seeds = demo.products.map((p) =>
  mapProduct({
    ...p,
    dimensions: undefined,
    categories: demo.categories.find((c) => c.id === p.category_id)!,
  }),
);
