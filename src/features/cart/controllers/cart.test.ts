// @vitest-environment jsdom
import { beforeEach, expect, it } from "vitest";
import { useCartController as store } from "./useCartController";
import {
  checkoutRequest,
  completeCheckout,
} from "../../orders/controllers/checkoutRequest";
const id = "10000000-0000-4000-8000-000000000001";
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  store.setState({ cart: {}, wishes: [] });
});
it("validates quantities and caps additions at available stock", () => {
  store.getState().add(id, 2, 3);
  store.getState().add(id, 5, 3);
  expect(store.getState().cart[id]).toBe(3);
  store.getState().add(id, -1);
  store.getState().add(id, 1.5);
  store.getState().add("broken-id");
  expect(store.getState().cart).toEqual({ [id]: 3 });
  store.getState().setCart({ [id]: -5 });
  expect(store.getState().cart[id]).toBe(3);
});
it("does not silently reduce an existing quantity when the stock cap drops", () => {
  store.getState().add(id, 5, 10);
  store.getState().add(id, 1, 3);
  expect(store.getState().cart[id]).toBe(5);
});
it("persists cart/wishlist and deduplicates saved products", async () => {
  store.getState().add(id);
  store.getState().setWishes([id, id]);
  await store.persist.rehydrate();
  expect(store.getState().cart).toEqual({ [id]: 1 });
  expect(store.getState().wishes).toEqual([id]);
});
it("discards corrupt persisted data without replacing controller methods", async () => {
  localStorage.setItem(
    "ykz-shopping",
    JSON.stringify({
      state: { cart: { [id]: "bad" }, wishes: [] },
      version: 0,
    }),
  );
  await store.persist.rehydrate();
  expect(store.getState().cart).toEqual({});
  expect(typeof store.getState().add).toBe("function");
});
it("retains checkout request IDs after retry/remount and changes them for a changed order", () => {
  const input = {
    items: [{ productId: id, quantity: 1 }],
    address: {
      recipientName: "Test Parent",
      phone: "01234567890",
      country: "Egypt",
      city: "Cairo",
      streetAddress: "123 Test Street",
    },
    notes: "",
  };
  const first = checkoutRequest("user", input);
  expect(checkoutRequest("user", input)).toBe(first);
  expect(checkoutRequest("other", input)).not.toBe(first);
  expect(checkoutRequest("user", { ...input, notes: "New note" })).not.toBe(
    first,
  );
  completeCheckout("user");
  expect(sessionStorage.getItem("ykz-checkout-user")).toBeNull();
});
