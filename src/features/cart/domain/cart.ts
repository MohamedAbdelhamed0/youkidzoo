import type { Product } from "../../products/domain/Product";
import { effectivePrice } from "../../products/domain/pricing";
export type Cart = Record<string, number>;
export function summarizeCart(products: Product[], cart: Cart) {
  const index = new Map(products.map((product) => [product.id, product]));
  const items = products.filter((product) => Boolean(cart[product.id]));
  const subtotalCents = items.reduce(
    (sum, product) =>
      sum + Math.round(effectivePrice(product) * 100) * cart[product.id],
    0,
  );
  const shippingCents = subtotalCents >= 10000 || !items.length ? 0 : 700;
  return {
    items,
    subtotal: subtotalCents / 100,
    shipping: shippingCents / 100,
    total: (subtotalCents + shippingCents) / 100,
    unavailable: Object.keys(cart).filter((id) => !index.has(id)),
    insufficientStock: items
      .filter((product) => cart[product.id] > product.stock)
      .map((product) => product.id),
  };
}
