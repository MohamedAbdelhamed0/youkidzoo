// @vitest-environment jsdom
import { act, renderHook, cleanup, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { useCheckoutController } from "./useOrdersController";
import { useCartController } from "../../cart/controllers/useCartController";
import { useAuthController } from "../../auth/controllers/useAuthController";
import { container } from "../../../app/di/container";
import type { User } from "../../auth/domain/auth";
import type { Order } from "../domain/orders";
const productId = "10000000-0000-4000-8000-000000000001",
  otherId = "10000000-0000-4000-8000-000000000002";
const customer: User = {
  id: "customer",
  username: "parent",
  email: "parent@example.test",
  fullName: "Parent",
  phone: null,
  avatarUrl: null,
  role: "user",
  preferredLanguage: "en",
  isActive: true,
  createdAt: "2026-11-07",
};
const address = {
  recipientName: "Parent",
  phone: "123456",
  country: "Egypt",
  city: "Cairo",
  streetAddress: "123 Test Street",
};
const order: Order = {
  id: "order",
  orderNumber: "YKZ-1",
  userId: "customer",
  items: [],
  subtotal: 25,
  shippingFee: 7,
  discount: 0,
  total: 32,
  status: "pending",
  shippingAddress: address,
  notes: "",
  createdAt: "2026-11-07",
  updatedAt: "2026-11-07",
};
const input = { items: [{ productId, quantity: 1 }], address, notes: "" };
beforeEach(() => {
  sessionStorage.clear();
  useAuthController.setState({ user: customer, loading: false, error: "" });
  useCartController.setState({ cart: { [productId]: 1 }, wishes: [] });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("coalesces duplicate submission and preserves products added while checkout is pending", async () => {
  let resolve!: (value: Order) => void;
  const place = vi.spyOn(container.orderRepository, "place").mockImplementation(
    () =>
      new Promise<Order>((r) => {
        resolve = r;
      }),
  );
  const { result } = renderHook(useCheckoutController);
  let first!: Promise<Order | null>, second!: Promise<Order | null>;
  await act(async () => {
    first = result.current.placeOrder(input);
    second = result.current.placeOrder(input);
  });
  await expect(second).resolves.toBeNull();
  expect(place).toHaveBeenCalledOnce();
  await act(async () => {
    useCartController.getState().add(productId);
    useCartController.getState().add(otherId);
    resolve(order);
  });
  await expect(first).resolves.toEqual(order);
  expect(useCartController.getState().cart).toEqual({
    [productId]: 1,
    [otherId]: 1,
  });
  expect(result.current.submitting).toBe(false);
});
it("does not apply an old account checkout result to a new account", async () => {
  let resolve!: (value: Order) => void;
  vi.spyOn(container.orderRepository, "place").mockImplementation(
    () =>
      new Promise<Order>((r) => {
        resolve = r;
      }),
  );
  const { result } = renderHook(useCheckoutController);
  let pending!: Promise<Order | null>;
  await act(async () => {
    pending = result.current.placeOrder(input);
  });
  await act(async () => {
    useAuthController.setState({ user: { ...customer, id: "other-customer" } });
    resolve(order);
  });
  await expect(pending).resolves.toBeNull();
  expect(useCartController.getState().cart).toEqual({ [productId]: 1 });
  await waitFor(() =>
    expect(result.current.error).toContain("account changed"),
  );
  expect(sessionStorage.getItem("ykz-checkout-customer")).not.toBeNull();
});
