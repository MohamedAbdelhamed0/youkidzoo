import { expect, it, vi } from "vitest";
import { readPages } from "./readPages";
it("reads past a server row cap smaller than the requested page size", async () => {
  const rows = Array.from({ length: 1205 }, (_, id) => ({ id }));
  const load = vi.fn(async (start: number, end: number) => ({
    data: rows.slice(start, Math.min(end + 1, start + 100)),
    error: null,
  }));
  expect(await readPages(load, 500)).toEqual(rows);
  expect(load.mock.calls.map(([start]) => start)).toEqual([
    0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1205,
  ]);
});
it("reports a later page failure instead of returning incomplete data", async () => {
  const error = { message: "Network unavailable" };
  const load = vi
    .fn()
    .mockResolvedValueOnce({ data: [{ id: 1 }], error: null })
    .mockResolvedValueOnce({ data: null, error });
  await expect(readPages(load)).rejects.toBe(error);
});
it("rejects invalid page sizes without sending a request", async () => {
  const load = vi.fn();
  await expect(readPages(load, 0)).rejects.toThrow("positive integer");
  expect(load).not.toHaveBeenCalled();
});
