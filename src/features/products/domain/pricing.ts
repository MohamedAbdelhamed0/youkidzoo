import type { Product } from "./Product";
export const STORE_CURRENCY = "EGP";
export function isActiveDeal(product: Product, now = Date.now()) {
  return Boolean(
    product.isSpecialDeal &&
    product.specialDealEndsAt &&
    Date.parse(product.specialDealEndsAt) > now,
  );
}
export function effectivePrice(product: Product, now = Date.now()) {
  return product.discountPrice != null &&
    (!product.isSpecialDeal || isActiveDeal(product, now))
    ? product.discountPrice
    : product.price;
}
export function money(value: number, currency = "EGP", language = "en") {
  return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency,
  }).format(value);
}
export function formatMoney(
  value: number,
  ar: boolean,
  currency = STORE_CURRENCY,
) {
  return money(value, currency, ar ? "ar" : "en");
}
