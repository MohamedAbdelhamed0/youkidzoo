import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "../errors/AppError";
/** The load callback must be stable (useCallback) and capture the account scope. */
export function useAsyncQuery<T>(load: () => Promise<T>, initial: T) {
  const empty = useRef(initial);
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let current = true;
    setData(empty.current);
    setLoading(true);
    setError("");
    Promise.resolve()
      .then(load)
      .then((value) => {
        if (current) setData(value);
      })
      .catch((e) => {
        if (current) setError(errorMessage(e));
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [load, version]);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, loading, error, reload };
}
