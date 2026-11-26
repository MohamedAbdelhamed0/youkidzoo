import { useCallback } from "react";
import { container } from "../../../app/di/container";
import { useAsyncQuery } from "../../../core/hooks/useAsyncQuery";
import type { Shop } from "../domain/shops";
export function useShopDirectoryController() {
  const query = useAsyncQuery(
    useCallback(() => container.shopRepository.list(), []),
    [] as Shop[],
  );
  return { ...query, shops: query.data };
}
export function useShopCategoryIds(shopId?: string) {
  const query = useAsyncQuery(
    useCallback(
      () =>
        shopId
          ? container.shopRepository.categoryIds(shopId)
          : Promise.resolve([]),
      [shopId],
    ),
    [] as string[],
  );
  return { ...query, ids: query.data };
}
