// @vitest-environment jsdom
import { act, renderHook, waitFor, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { container } from "../../../app/di/container";
import { useResourceManagerController } from "./useResourceManagerController";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("keeps completed image uploads when a later image upload fails", async () => {
  vi.spyOn(container.adminRepository, "list").mockResolvedValue([]);
  const upload = vi
    .spyOn(container.adminRepository, "upload")
    .mockResolvedValueOnce("https://example.test/one.png")
    .mockRejectedValueOnce({ message: "Upload failed" });
  const { result } = renderHook(() => useResourceManagerController("products"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  const file = (name: string) =>
    Object.assign(new File([Uint8Array.of(1)], name, { type: "image/png" }), {
      arrayBuffer: async () => Uint8Array.of(1).buffer,
    });
  await act(async () => {
    await result.current.uploadImages([file("one.png"), file("two.png")]);
  });
  expect(upload).toHaveBeenCalledTimes(2);
  expect(result.current.photos).toEqual(["https://example.test/one.png"]);
  expect(result.current.thumbnail).toBe("https://example.test/one.png");
  expect(result.current.error).toBe("Upload failed");
  expect(result.current.busy).toBe(false);
  await act(async () =>
    result.current.removePhoto("https://example.test/one.png"),
  );
  expect(result.current.thumbnail).toBe("");
  expect(result.current.photos).toEqual([]);
});
it("shows a failed delete without closing the review dialog", async () => {
  vi.spyOn(container.adminRepository, "list").mockResolvedValue([]);
  vi.spyOn(container.adminRepository, "remove").mockRejectedValue({
    message: "This category still has products.",
  });
  const { result } = renderHook(() =>
    useResourceManagerController("categories"),
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () =>
    result.current.setRemove({ id: "category", name_en: "Category" }),
  );
  await act(async () => {
    await result.current.deleteRecord();
  });
  expect(result.current.remove?.id).toBe("category");
  expect(result.current.error).toBe("This category still has products.");
});
