import { useEffect, useState } from "react";
import type { Product } from "../domain/Product";
import { container } from "../../../app/di/container";
import { errorMessage } from "../../../core/errors/AppError";
export function useProductController() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    container.productRepository
      .list()
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((e) => {
        if (active)
          setError(
            errorMessage(
              e,
              "We could not load the collection. Please try again.",
            ),
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [version]);
  return { products, error, loading, reload: () => setVersion((v) => v + 1) };
}
