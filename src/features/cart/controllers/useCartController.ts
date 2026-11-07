import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";
import type { Cart } from "../domain/cart";
type Updater<T> = T | ((old: T) => T);
const cartSchema = z.record(z.uuid(), z.number().int().min(1).max(999));
export const useCartController = create(
  persist<{
    cart: Cart;
    wishes: string[];
    setCart(value: Updater<Cart>): void;
    setWishes(value: Updater<string[]>): void;
    add(id: string, quantity?: number, maxStock?: number): void;
    clear(): void;
  }>(
    (set) => ({
      cart: {},
      wishes: [],
      setCart(value) {
        set((s) => {
          const cart = typeof value === "function" ? value(s.cart) : value;
          const result = cartSchema.safeParse(cart);
          return result.success ? { cart: result.data } : s;
        });
      },
      setWishes(value) {
        set((s) => {
          const result = z
            .array(z.uuid())
            .safeParse(typeof value === "function" ? value(s.wishes) : value);
          return result.success ? { wishes: [...new Set(result.data)] } : s;
        });
      },
      add(id, quantity = 1, maxStock = 999) {
        if (
          !z.uuid().safeParse(id).success ||
          !Number.isInteger(quantity) ||
          quantity < 1
        )
          return;
        if (!Number.isInteger(maxStock) || maxStock < 1) return;
        set((s) =>
          (s.cart[id] || 0) >= maxStock
            ? s
            : {
                cart: {
                  ...s.cart,
                  [id]: Math.min(999, maxStock, (s.cart[id] || 0) + quantity),
                },
              },
        );
      },
      clear() {
        set({ cart: {} });
      },
    }),
    {
      name: "ykz-shopping",
      partialize: (s) => ({ cart: s.cart, wishes: s.wishes }) as typeof s,
      merge: (saved, current) => {
        const parsed = z
          .object({ cart: cartSchema, wishes: z.array(z.uuid()) })
          .safeParse(saved);
        return {
          ...current,
          ...(parsed.success ? parsed.data : { cart: {}, wishes: [] }),
        };
      },
    },
  ),
);
