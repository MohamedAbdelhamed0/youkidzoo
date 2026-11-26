import demo from "../../../shared/data/demo-data.json";
import photoProducts from "./demo-photo-products.json";
import type { ProductDto } from "./models";

const photos = import.meta.glob<string>(
  "../../../assets/demo-products/*.webp",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
);

export function getDemoPhotoProducts(): ProductDto[] {
  const categoryBySlug = new Map(
    demo.categories.map((category) => [category.slug, category]),
  );
  const shopByCategory = new Map(
    demo.products.map((product) => [product.category_id, product.shop_id]),
  );
  return Object.entries(photoProducts).flatMap(([slug, product]) => {
    const category = categoryBySlug.get(slug);
    const photo = photos[`../../../assets/demo-products/${slug}.webp`];
    const shopId = category && shopByCategory.get(category.id);
    if (!category || !photo || !shopId) return [];
    return [
      {
        id: `demo-${slug}`,
        sku: `DEMO-${slug.toUpperCase()}`,
        name_en: product.name,
        name_ar: product.ar,
        description_en: product.desc,
        description_ar: product.descAr,
        category_id: category.id,
        categories: category,
        shop_id: shopId,
        price: product.price,
        discount_price: null,
        currency: "EGP",
        stock_quantity: 12,
        thumbnail_url: photo,
        gallery_urls: [],
        age_group: product.age,
        gender_target: "unisex",
        emoji: "",
        color: "#f1ebe5",
        brand: "",
        material_en: null,
        material_ar: null,
        safety_warnings_en: null,
        safety_warnings_ar: null,
        dimensions: null,
        is_featured: true,
        is_special_deal: false,
        special_deal_ends_at: null,
        rating_average: 0,
        rating_count: 0,
        is_active: true,
        created_at: "2026-11-26T00:00:00Z",
      },
    ];
  });
}
