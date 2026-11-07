// @vitest-environment jsdom
import { act, renderHook, waitFor, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useAsyncQuery } from "./useAsyncQuery";
afterEach(cleanup);
it("ignores stale responses when the query/account scope changes", async () => {
  let resolveOld!: (data: string[]) => void,
    resolveNew!: (data: string[]) => void;
  const oldLoad = vi.fn(
    () =>
      new Promise<string[]>((r) => {
        resolveOld = r;
      }),
  );
  const newLoad = vi.fn(
    () =>
      new Promise<string[]>((r) => {
        resolveNew = r;
      }),
  );
  const { result, rerender } = renderHook(
    ({ load }) => useAsyncQuery(load, [] as string[]),
    { initialProps: { load: oldLoad } },
  );
  await waitFor(() => expect(oldLoad).toHaveBeenCalledOnce());
  rerender({ load: newLoad });
  await waitFor(() => expect(newLoad).toHaveBeenCalledOnce());
  await act(async () => resolveNew(["new account"]));
  expect(result.current.data).toEqual(["new account"]);
  await act(async () => resolveOld(["old account"]));
  expect(result.current.data).toEqual(["new account"]);
  expect(result.current.loading).toBe(false);
});
it("clears old data when starting a new scoped query and reports errors", async () => {
  const good = async () => ["private order"];
  const bad = async () => {
    throw { message: "Access denied" };
  };
  const { result, rerender } = renderHook(
    ({ load }) => useAsyncQuery(load, [] as string[]),
    { initialProps: { load: good } },
  );
  await waitFor(() => expect(result.current.data).toEqual(["private order"]));
  rerender({ load: bad });
  await waitFor(() => expect(result.current.error).toBe("Access denied"));
  expect(result.current.data).toEqual([]);
});
