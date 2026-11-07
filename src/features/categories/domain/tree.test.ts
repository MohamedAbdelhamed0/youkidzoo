import { expect, it } from "vitest";
import { categoryDepth, orderCategories } from "./tree";
import type { Category } from "./Category";
const category = (
  id: string,
  parentId: string | null,
  displayOrder = 0,
): Category => ({
  id,
  parentId,
  displayOrder,
  shopId: null,
  name: { en: id, ar: id },
  slug: id,
  description: { en: "", ar: "" },
  iconUrl: "",
  bannerUrl: "",
  isActive: true,
});
it("places children after their parents and calculates nested depth", () => {
  const categories = [
    category("grandchild", "child"),
    category("child", "root"),
    category("root", null, 1),
    category("other", null, 2),
  ];
  const sorted = orderCategories(categories);
  expect(sorted.map((c) => c.id)).toEqual([
    "root",
    "child",
    "grandchild",
    "other",
  ]);
  expect(categoryDepth(sorted[2], categories)).toBe(2);
});
it("terminates on malformed cyclic or missing-parent input without losing categories", () => {
  const categories = [
    category("a", "b"),
    category("b", "a"),
    category("orphan", "missing"),
  ];
  expect(orderCategories(categories)).toHaveLength(3);
  expect(categoryDepth(categories[0], categories)).toBe(1);
  expect(categoryDepth(categories[2], categories)).toBe(0);
});
