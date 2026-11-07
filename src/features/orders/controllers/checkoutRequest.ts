import type { ShippingAddress } from "../domain/orders";
export interface CheckoutInput {
  items: { productId: string; quantity: number }[];
  address: ShippingAddress;
  notes: string;
}
export function checkoutRequest(userId: string, input: CheckoutInput): string {
  const key = `ykz-checkout-${userId}`;
  const fingerprint = JSON.stringify({
    ...input,
    items: [...input.items].sort((a, b) =>
      a.productId.localeCompare(b.productId),
    ),
  });
  try {
    const previous = JSON.parse(sessionStorage.getItem(key) || "null");
    if (
      previous?.fingerprint === fingerprint &&
      typeof previous.requestId === "string"
    )
      return previous.requestId;
  } catch {
    /* A corrupt saved request must not prevent a new checkout. */
  }
  const requestId = crypto.randomUUID();
  sessionStorage.setItem(key, JSON.stringify({ fingerprint, requestId }));
  return requestId;
}
export function completeCheckout(userId: string) {
  sessionStorage.removeItem(`ykz-checkout-${userId}`);
}
