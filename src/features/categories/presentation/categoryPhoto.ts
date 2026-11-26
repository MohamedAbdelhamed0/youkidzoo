import type { Category } from "../domain/Category";

const categoryPhotos = import.meta.glob<string>(
  "../../../assets/categories/*.webp",
  { eager: true, import: "default", query: "?url" },
);

export function categoryPhoto(category: Category) {
  return (
    category.bannerUrl ||
    categoryPhotos[`../../../assets/categories/${category.slug}.webp`]
  );
}
