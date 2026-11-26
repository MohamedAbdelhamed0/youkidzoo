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
  language: "ar" | "en" = "en",
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
      (params.get("available") !== "true" || p.stock > 0) &&
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
  else if (sort === "newest" || sort === "oldest")
    productsToShow = [...productsToShow].sort(
      (a, b) =>
        (sort === "newest" ? -1 : 1) *
        (a.createdAt || "").localeCompare(b.createdAt || ""),
    );
  else if (sort === "name-asc" || sort === "name-desc")
    productsToShow = [...productsToShow].sort(
      (a, b) =>
        (sort === "name-asc" ? 1 : -1) *
        (language === "ar" ? a.name_ar : a.name).localeCompare(
          language === "ar" ? b.name_ar : b.name,
          language,
        ),
    );
  else
    productsToShow = [...productsToShow].sort(
      (a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)),
    );
  return productsToShow;
}
