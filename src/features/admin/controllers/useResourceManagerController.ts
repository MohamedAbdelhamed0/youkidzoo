import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { container } from "../../../app/di/container";
import { errorMessage } from "../../../core/errors/AppError";
import type { AdminRow, Resource } from "../domain/admin";
import { fieldsFor, schemas } from "./adminForms";
import { imageUpload } from "./imageUpload";

export function useResourceManagerController(resource: Resource) {
  const [rows, setRows] = useState<AdminRow[]>([]),
    [shops, setShops] = useState<AdminRow[]>([]),
    [categories, setCategories] = useState<AdminRow[]>([]);
  const [editing, setEditing] = useState<AdminRow | null | undefined>(
      undefined,
    ),
    [remove, setRemove] = useState<AdminRow | null>(null),
    [assigning, setAssigning] = useState<AdminRow | null>(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<string[]>([]),
    [selected, setSelected] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState("");
  const scope = useRef(resource);
  scope.current = resource;
  const request = useRef(0),
    pending = useRef(false);
  const load = useCallback(async () => {
    const version = ++request.current;
    setLoading(true);
    setError("");
    try {
      // Reuse the primary request when editing one of the dropdown resources.
      const primary = container.adminRepository.list(resource);
      const [r, s, c] = await Promise.all([
        primary,
        resource === "shops"
          ? primary
          : container.adminRepository.list("shops"),
        resource === "categories"
          ? primary
          : container.adminRepository.list("categories"),
      ]);
      if (version === request.current) {
        setRows(r);
        setShops(s);
        setCategories(c);
      }
    } catch (e) {
      if (version === request.current) setError(errorMessage(e));
    } finally {
      if (version === request.current) setLoading(false);
    }
  }, [resource]);
  useEffect(() => {
    setEditing(undefined);
    setRemove(null);
    setAssigning(null);
    setQuery("");
    setRows([]);
    setShops([]);
    setCategories([]);
    void load();
    return () => {
      request.current++;
    };
  }, [load]);
  const open = (row: AdminRow | null) => {
    if (pending.current) return;
    setError("");
    setEditing(row);
    setThumbnail(
      typeof row?.thumbnail_url === "string" ? row.thumbnail_url : "",
    );
    setPhotos(
      Array.isArray(row?.gallery_urls)
        ? row.gallery_urls.filter((v): v is string => typeof v === "string")
        : [],
    );
  };
  function removePhoto(url: string) {
    const remaining = photos.filter((photo) => photo !== url);
    setPhotos(remaining);
    setThumbnail((current) => (current === url ? remaining[0] || "" : current));
  }
  async function mutate(action: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      if (scope.current === resource)
        setError(
          e instanceof z.ZodError
            ? e.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join(" · ")
            : errorMessage(e),
        );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function save(values: Record<string, unknown>) {
    await mutate(async () => {
      const raw: Record<string, unknown> = {};
      for (const field of fieldsFor(resource))
        raw[field.name] =
          field.type === "checkbox"
            ? values[field.name] === true || values[field.name] === "on"
            : String(values[field.name] ?? "");
      if (resource === "products") {
        const keys = ["weightKg", "widthCm", "heightCm"];
        const sizes = keys.map((key) => String(raw[`dimension_${key}`] || ""));
        if (sizes.some(Boolean) && !sizes.every(Boolean))
          throw new Error(
            "Provide weight, width, and height together, or leave all three empty.",
          );
        raw.dimensions = sizes.every(Boolean)
          ? Object.fromEntries(keys.map((key, i) => [key, Number(sizes[i])]))
          : null;
        raw.currency = "EGP";
        raw.gallery_urls = photos;
        raw.special_deal_ends_at = raw.special_deal_ends_at
          ? new Date(String(raw.special_deal_ends_at)).toISOString()
          : null;
      }
      const payload = schemas[resource].parse(raw);
      if (
        resource === "categories" &&
        editing?.id &&
        "parent_id" in payload &&
        payload.parent_id === editing.id
      )
        throw new Error("A category cannot be its own parent.");
      await container.adminRepository.save(resource, payload, editing?.id);
      if (scope.current === resource) {
        setEditing(undefined);
        await load();
      }
    });
  }
  async function deleteRecord() {
    if (!remove) return;
    const id = remove.id;
    await mutate(async () => {
      await container.adminRepository.remove(resource, id);
      if (scope.current === resource) {
        setRemove(null);
        await load();
      }
    });
  }
  async function assignCategories(shop: AdminRow) {
    await mutate(async () => {
      const ids = await container.adminRepository.shopCategories(shop.id);
      if (scope.current === resource) {
        setSelected(ids);
        setAssigning(shop);
      }
    });
  }
  async function saveAssignments() {
    if (!assigning) return;
    await mutate(async () => {
      await container.adminRepository.setShopCategories(assigning.id, selected);
      if (scope.current === resource) setAssigning(null);
    });
  }
  async function uploadImages(files: File[]) {
    await mutate(async () => {
      if (files.length + photos.length > 12)
        throw new Error("Maximum 12 photos.");
      for (const file of files) {
        if (
          !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
            file.type,
          ) ||
          file.size < 1 ||
          file.size > 5 * 1024 * 1024
        )
          throw new Error("Use JPEG, PNG, WebP, or AVIF images up to 5 MB.");
        const url = await container.adminRepository.upload(
          await imageUpload(file),
        );
        if (scope.current === resource) {
          setPhotos((old) => [...old, url]);
          setThumbnail((current) => current || url);
        }
      }
    });
  }
  return {
    rows,
    shops,
    categories,
    editing,
    setEditing,
    remove,
    setRemove,
    assigning,
    setAssigning,
    error,
    busy,
    loading,
    query,
    setQuery,
    photos,
    thumbnail,
    setThumbnail,
    removePhoto,
    selected,
    setSelected,
    open,
    save,
    deleteRecord,
    assignCategories,
    saveAssignments,
    uploadImages,
    reload: load,
  };
}
