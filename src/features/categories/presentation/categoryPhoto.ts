import type { Category } from "../domain/Category";

const categoryPhotos = import.meta.glob<string>(
  "../../../assets/categories/*.webp",
  { eager: true, import: "default", query: "?url" },
);
const categoryThumbnails = import.meta.glob<string>(
  "../../../assets/categories/small/*.webp",
  { eager: true, import: "default", query: "?url" },
);

export function categoryPhoto(category: Category) {
  return (
    category.bannerUrl ||
    categoryPhotos[`../../../assets/categories/${category.slug}.webp`]
  );
}

export function categoryPhotoSrcSet(category: Category) {
  if (category.bannerUrl) return;
  const thumbnail =
    categoryThumbnails[
      `../../../assets/categories/small/${category.slug}.webp`
    ];
  const full = categoryPhoto(category);
  if (thumbnail && full) return `${thumbnail} 480w, ${full} 1000w`;
}
