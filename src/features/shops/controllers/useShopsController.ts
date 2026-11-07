import { useCallback } from "react";
import { container } from "../../../app/di/container";
import { useAsyncQuery } from "../../../core/hooks/useAsyncQuery";
import { useCategoriesController } from "../../categories/controllers/useCategoriesController";
import type { Shop } from "../domain/shops";
export function useShopDirectoryController() {
  const query = useAsyncQuery(
    useCallback(() => container.shopRepository.list(), []),
    [] as Shop[],
  );
  return { ...query, shops: query.data };
}
export function useShopsController() {
  const shops = useShopDirectoryController(),
    categories = useCategoriesController();
  return {
    shops: shops.shops,
    categories: categories.categories,
    error: shops.error || categories.error,
    loading: shops.loading || categories.loading,
  };
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
