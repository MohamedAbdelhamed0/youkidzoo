import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { container } from "../../../app/di/container";
import { errorMessage } from "../../../core/errors/AppError";
import type { AdminRow, Resource, AssignableUser } from "../domain/admin";
import { fieldsFor, schemas } from "./adminForms";
import { imageUpload } from "./imageUpload";

export function useResourceManagerController(
  resource: Resource,
  owner = false,
) {
  const [ownerUsers, setOwnerUsers] = useState<AssignableUser[]>([]);
  const [ownerResults, setOwnerResults] = useState<AssignableUser[]>([]);
  const [ownerQuery, setOwnerQuery] = useState("");
  const [productShop, setProductShop] = useState("");
  const [shopCategoryIds, setShopCategoryIds] = useState<string[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const categoryRequest = useRef(0);
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
      const list = (r: Resource) =>
        owner
          ? container.adminRepository.ownerRecords(r)
          : container.adminRepository.list(r);
      const primary = list(resource);
      const [r, s, c] = await Promise.all([
        primary,
        resource === "shops" ? primary : list("shops"),
        resource === "categories" ? primary : list("categories"),
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
  }, [resource, owner]);
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
  useEffect(() => {
    if (resource !== "shops" || editing === undefined) return;
    let active = true;
    const timer = setTimeout(() => {
      container.adminRepository
        .searchUsers(ownerQuery)
        .then((users) => {
          if (active) setOwnerResults(users);
        })
        .catch((e) => {
          if (active) setError(errorMessage(e));
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [ownerQuery, resource, editing]);
  useEffect(() => {
    const version = ++categoryRequest.current;
    setShopCategoryIds([]);
    if (resource !== "products" || !productShop) {
      setCategoryLoading(false);
      return;
    }
    setCategoryLoading(true);
    container.adminRepository
      .shopCategories(productShop)
      .then((ids) => {
        if (version === categoryRequest.current) setShopCategoryIds(ids);
      })
      .catch((e) => {
        if (version === categoryRequest.current) setError(errorMessage(e));
      })
      .finally(() => {
        if (version === categoryRequest.current) setCategoryLoading(false);
      });
    return () => {
      categoryRequest.current++;
    };
  }, [productShop, resource]);
  const availableCategories = categories.filter(
    (c) =>
      c.is_active &&
      (c.shop_id === productShop ||
        (!c.shop_id && shopCategoryIds.includes(c.id))),
  );
  const open = async (row: AdminRow | null) => {
    if (pending.current) return;
    setError("");
    setOwnerUsers([]);
    setOwnerQuery("");
    setOwnerResults([]);
    setProductShop(
      String(row?.shop_id ?? (shops.length === 1 ? shops[0].id : "")),
    );
    if (resource === "shops" && row) {
      await mutate(async () => {
        const users = await container.adminRepository.shopOwners(row.id);
        if (scope.current === resource) {
          setOwnerUsers(users);
          setEditing(row);
        }
      });
      return;
    }
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
      const payload: Record<string, unknown> = schemas[resource].parse(raw);
      if (
        resource === "categories" &&
        editing?.id &&
        "parent_id" in payload &&
        payload.parent_id === editing.id
      )
        throw new Error("A category cannot be its own parent.");
      if (resource === "products") {
        if (
          !availableCategories.some(
            (c) =>
              c.id === payload.category_id &&
              String(payload.shop_id) === productShop,
          )
        )
          throw new Error("Choose an active category available in this shop.");
        if (owner && !shops.some((s) => s.id === payload.shop_id))
          throw new Error("Choose an assigned shop.");
      }
      if (resource === "shops")
        await container.adminRepository.saveShop(
          payload,
          ownerUsers.map((u) => u.id),
          editing?.id,
        );
      else if (owner)
        await container.adminRepository.saveOwnerProduct(payload, editing?.id);
      else await container.adminRepository.save(resource, payload, editing?.id);
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
      if (owner) await container.adminRepository.removeOwnerProduct(id);
      else await container.adminRepository.remove(resource, id);
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
      if (owner && !productShop)
        throw new Error("Choose an assigned shop before uploading images.");
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
          owner ? productShop : undefined,
        );
        if (scope.current === resource) {
          setPhotos((old) => [...old, url]);
          setThumbnail((current) => current || url);
        }
      }
    });
  }
  return {
    ownerUsers,
    setOwnerUsers,
    ownerResults,
    ownerQuery,
    setOwnerQuery,
    productShop,
    setProductShop,
    availableCategories,
    categoryLoading,
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
