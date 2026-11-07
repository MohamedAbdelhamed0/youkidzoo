import { expect, it } from "vitest";
import { summarizeCart } from "./cart";
import { seeds } from "../../products/data/demoCatalog";
it("uses integer cents at the free-shipping threshold", () => {
  const products = Array.from({ length: 100 }, (_, i) => ({
    ...seeds[0],
    id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    price: i === 99 ? 71.29 : 0.29,
    discountPrice: null,
    isSpecialDeal: false,
  }));
  const cart = Object.fromEntries(products.map((p) => [p.id, 1]));
  expect(products.reduce((sum, p) => sum + p.price, 0)).toBeLessThan(100);
  const summary = summarizeCart(products, cart);
  expect(summary.subtotal).toBe(100);
  expect(summary.shipping).toBe(0);
  expect(summary.total).toBe(100);
});
it("reports unavailable and insufficient-stock items without inventing prices", () => {
  const product = { ...seeds[0], stock: 1 };
  const summary = summarizeCart([product], { [product.id]: 2, unavailable: 1 });
  expect(summary.unavailable).toEqual(["unavailable"]);
  expect(summary.insufficientStock).toEqual([product.id]);
  expect(summary.items).toEqual([product]);
});
it("does not charge shipping for an empty bag", () => {
  expect(summarizeCart([], {}).total).toBe(0);
});
