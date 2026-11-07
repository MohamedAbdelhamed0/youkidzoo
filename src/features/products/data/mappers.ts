import type { Product } from "../domain/Product";
import { ageGroups } from "../domain/Product";
import type { ProductDto } from "./models";
export function mapProduct(p: ProductDto): Product {
  return {
    id: p.id,
    name: p.name_en,
    name_ar: p.name_ar,
    category: p.categories?.name_en || "",
    categoryNameAr: p.categories?.name_ar || "",
    categoryId: p.category_id,
    shopId: p.shop_id,
    price: Number(p.price),
    stock: p.stock_quantity,
    emoji: p.emoji,
    color: p.color,
    sku: p.sku,
    description: { en: p.description_en, ar: p.description_ar },
    discountPrice: p.discount_price === null ? null : Number(p.discount_price),
    currency: p.currency,
    thumbnailUrl: p.thumbnail_url,
    galleryUrls: [...(p.gallery_urls || [])],
    ageGroup: ageGroups.find((a) => a === p.age_group) || "all-ages",
    genderTarget:
      p.gender_target === "boy" || p.gender_target === "girl"
        ? p.gender_target
        : "unisex",
    brand: p.brand,
    material: { en: p.material_en || "", ar: p.material_ar || "" },
    safetyWarnings: {
      en: p.safety_warnings_en || "",
      ar: p.safety_warnings_ar || "",
    },
    dimensions: p.dimensions ? { ...p.dimensions } : undefined,
    isFeatured: p.is_featured,
    isSpecialDeal: p.is_special_deal,
    specialDealEndsAt: p.special_deal_ends_at,
    ratingAverage: Number(p.rating_average),
    ratingCount: p.rating_count,
    isActive: p.is_active,
    createdAt: p.created_at,
  };
}
