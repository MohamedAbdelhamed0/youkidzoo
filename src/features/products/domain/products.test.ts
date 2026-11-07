import { CategoryRepositoryImpl } from "../../categories/data/CategoryRepositoryImpl";
import { DemoCategoryDataSource } from "../../categories/data/datasources/DemoCategoryDataSource";
import { describe, it, expect } from "vitest";
import { filterProducts, descendantIds } from "./filterProducts";
import { seeds } from "../data/demoCatalog";
import { ShopRepositoryImpl } from "../../shops/data/ShopRepositoryImpl";
import { DemoShopDataSource } from "../../shops/data/datasources/DemoShopDataSource";
import { effectivePrice, isActiveDeal, formatMoney } from "./pricing";
describe("catalog business rules", () => {
  it("formats Egyptian pounds in both interface languages", () => {
    expect(formatMoney(29, false)).toContain("EGP");
    expect(formatMoney(29, true)).toContain("ج.م");
    expect(seeds.every((p) => p.currency === "EGP")).toBe(true);
  });
  it("uses consistent shop/category identities in demo data", async () => {
    const repo = new ShopRepositoryImpl(new DemoShopDataSource());
    const shops = await repo.list();
    const categories = await new CategoryRepositoryImpl(
      new DemoCategoryDataSource(),
    ).list();
    for (const product of seeds) {
      expect(shops.some((s) => s.id === product.shopId)).toBe(true);
      expect(categories.some((c) => c.id === product.categoryId)).toBe(true);
      expect(
        (await repo.categoryIds(product.shopId!)).includes(product.categoryId!),
      ).toBe(true);
    }
  });
  it("filters by category, shop, Arabic query, price, and age", async () => {
    const categories = await new CategoryRepositoryImpl(
      new DemoCategoryDataSource(),
    ).list();
    const p = seeds[0];
    expect(
      filterProducts(
        seeds,
        categories,
        new URLSearchParams({
          category: p.categoryId!,
          q: "طائرة",
          max: "30",
          age: "all-ages",
        }),
        p.shopId,
      ),
    ).toEqual([p]);
    expect(
      filterProducts(
        seeds,
        categories,
        new URLSearchParams({ q: "no-such-toy" }),
      ),
    ).toEqual([]);
  });
  it("includes descendants and stops even if supplied a cyclic category graph", async () => {
    const categories = await new CategoryRepositoryImpl(
      new DemoCategoryDataSource(),
    ).list();
    const [parent, child] = categories;
    const tree = [
      { ...parent, parentId: child.id },
      { ...child, parentId: parent.id },
    ];
    expect([...descendantIds(parent.id, tree)].sort()).toEqual(
      [parent.id, child.id].sort(),
    );
  });
  it("expires special discounts without resetting and retains regular discounts", () => {
    const p = {
      ...seeds[0],
      price: 30,
      discountPrice: 20,
      isSpecialDeal: true,
      specialDealEndsAt: "2026-11-10T00:00:00Z",
    };
    expect(effectivePrice(p, Date.parse("2026-11-09"))).toBe(20);
    expect(isActiveDeal(p, Date.parse("2026-11-10"))).toBe(false);
    expect(effectivePrice(p, Date.parse("2026-11-10"))).toBe(30);
    expect(
      effectivePrice({ ...p, isSpecialDeal: false }, Date.parse("2026-11-11")),
    ).toBe(20);
  });
  it("orders prices numerically and respects an explicit zero-price limit", async () => {
    const categories = await new CategoryRepositoryImpl(
      new DemoCategoryDataSource(),
    ).list();
    const result = filterProducts(
      seeds,
      categories,
      new URLSearchParams({ sort: "price-low" }),
    );
    const prices = result.map((p) => effectivePrice(p));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(
      filterProducts(seeds, categories, new URLSearchParams({ max: "0" })),
    ).toEqual([]);
  });
});
