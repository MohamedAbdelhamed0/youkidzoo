import { useCallback } from "react";
import { useAsyncQuery } from "../../../core/hooks/useAsyncQuery";
import { container } from "../../../app/di/container";
import type { Category } from "../domain/Category";
export function useCategoriesController() {
  const query = useAsyncQuery(
    useCallback(() => container.categoryRepository.list(), []),
    [] as Category[],
  );
  return { ...query, categories: query.data };
}
