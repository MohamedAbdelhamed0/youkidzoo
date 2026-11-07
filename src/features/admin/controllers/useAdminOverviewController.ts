import { useCallback } from "react";
import { container } from "../../../app/di/container";
import { useAsyncQuery } from "../../../core/hooks/useAsyncQuery";
import { useAuthController } from "../../auth/controllers/useAuthController";
import type { Order } from "../../orders/domain/orders";
interface Overview {
  recentOrders: Order[];
  collectedRevenue: number;
  totalOrders: number;
  activeShops: number;
  lowStockProducts: number;
}
export function useAdminOverviewController() {
  const userId = useAuthController((s) => s.user?.id);
  return useAsyncQuery<Overview | null>(
    useCallback(async () => {
      if (!userId) return null;
      const [orders, payments, shops, products] = await Promise.all([
        container.orderRepository.list(),
        container.paymentRepository.list(),
        container.adminRepository.list("shops"),
        container.adminRepository.list("products"),
      ]);
      return {
        recentOrders: orders.slice(0, 5),
        collectedRevenue: payments
          .filter((p) => p.status === "paid" && p.currency === "EGP")
          .reduce((sum, p) => sum + p.amount, 0),
        totalOrders: orders.length,
        activeShops: shops.filter((s) => s.is_active).length,
        lowStockProducts: products.filter(
          (p) => p.is_active && Number(p.stock_quantity) < 5,
        ).length,
      };
    }, [userId]),
    null,
  );
}
