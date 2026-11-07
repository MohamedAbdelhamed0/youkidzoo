import type { Product } from "./Product";
import type { Category } from "../../categories/domain/Category";
import { effectivePrice, isActiveDeal } from "./pricing";
export function descendantIds(id: string, categories: Category[]): Set<string> {
  const ids = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of categories) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        changed = true;
      }
    }
  }
  return ids;
}
export function filterProducts(
  products: Product[],
  categories: Category[],
  params: URLSearchParams,
  shopId?: string,
  categoryId?: string,
): Product[] {
  const query = (params.get("q") || "").trim().toLocaleLowerCase();
  const selected = params.get("category") || categoryId;
  const ids = selected ? descendantIds(selected, categories) : null;
  const maxParam = params.get("max");
  const max =
    maxParam === null || maxParam === "" ? Infinity : Number(maxParam);
  const age = params.get("age");
  const sort = params.get("sort");
  const gender = params.get("gender");
  let productsToShow = products.filter(
    (p) =>
      (!shopId || p.shopId === shopId) &&
      (!ids || Boolean(p.categoryId && ids.has(p.categoryId))) &&
      (!age || p.ageGroup === age) &&
      (!gender || p.genderTarget === gender) &&
      effectivePrice(p) <= max &&
      (params.get("deals") !== "true" || isActiveDeal(p)) &&
      `${p.name} ${p.name_ar} ${p.brand || ""}`
        .toLocaleLowerCase()
        .includes(query),
  );
  if (sort === "price-low")
    productsToShow = [...productsToShow].sort(
      (a, b) => effectivePrice(a) - effectivePrice(b),
    );
  else if (sort === "price-high")
    productsToShow = [...productsToShow].sort(
      (a, b) => effectivePrice(b) - effectivePrice(a),
    );
  else if (sort === "newest")
    productsToShow = [...productsToShow].sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || ""),
    );
  else
    productsToShow = [...productsToShow].sort(
      (a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)),
    );
  return productsToShow;
}
