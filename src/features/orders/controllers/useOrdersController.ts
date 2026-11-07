import { useCallback, useRef, useState } from "react";
import { container } from "../../../app/di/container";
import { useAsyncQuery } from "../../../core/hooks/useAsyncQuery";
import { errorMessage } from "../../../core/errors/AppError";
import { useAuthController } from "../../auth/controllers/useAuthController";
import { useCartController } from "../../cart/controllers/useCartController";
import type { Order, OrderStatus } from "../domain/orders";
import {
  checkoutRequest,
  completeCheckout,
  type CheckoutInput,
} from "./checkoutRequest";
export function useOrdersController() {
  const userId = useAuthController((s) => s.user?.id);
  const query = useAsyncQuery(
    useCallback(
      () => (userId ? container.orderRepository.list() : Promise.resolve([])),
      [userId],
    ),
    [] as Order[],
  );
  return { ...query, orders: query.data };
}
export function useCheckoutController() {
  const userId = useAuthController((s) => s.user?.id);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const pending = useRef(false);
  async function placeOrder(input: CheckoutInput): Promise<Order | null> {
    if (pending.current) return null;
    pending.current = true;
    setSubmitting(true);
    setError("");
    try {
      if (!userId) throw new Error("Please sign in again.");
      const order = await container.orderRepository.place({
        ...input,
        requestId: checkoutRequest(userId, input),
      });
      if (useAuthController.getState().user?.id !== userId)
        throw new Error(
          "Your account changed. Check your orders before trying again.",
        );
      completeCheckout(userId);
      // Preserve items added while the request was in flight.
      useCartController.getState().setCart((current) => {
        const next = { ...current };
        for (const item of input.items) {
          const remaining = (next[item.productId] || 0) - item.quantity;
          if (remaining > 0) next[item.productId] = remaining;
          else delete next[item.productId];
        }
        return next;
      });
      return order;
    } catch (e) {
      setError(errorMessage(e, "Unable to place order. Your bag is saved."));
      return null;
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  }
  return { placeOrder, error, submitting };
}
export function useAdminOrdersController() {
  const query = useOrdersController();
  const [mutationError, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  async function updateStatus(id: string, status: OrderStatus) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await container.orderRepository.updateStatus(id, status);
      query.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return { ...query, error: mutationError || query.error, busy, updateStatus };
}
