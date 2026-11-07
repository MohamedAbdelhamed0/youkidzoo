import { useCallback } from "react";
import { useAsyncQuery } from "../../../core/hooks/useAsyncQuery";
import { container } from "../../../app/di/container";
import { useAuthController } from "../../auth/controllers/useAuthController";
import type { Payment } from "../domain/Payment";
export function usePaymentsController() {
  const userId = useAuthController((s) => s.user?.id);
  const query = useAsyncQuery(
    useCallback(
      () => (userId ? container.paymentRepository.list() : Promise.resolve([])),
      [userId],
    ),
    [] as Payment[],
  );
  return { ...query, payments: query.data };
}
