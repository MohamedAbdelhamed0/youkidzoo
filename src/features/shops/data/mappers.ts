import type { Shop } from "../domain/shops";
import type { ShopDto } from "./models";
export const mapShop = (s: ShopDto): Shop => ({
  id: s.id,
  ownerId: s.owner_id ?? null,
  name: { en: s.name_en, ar: s.name_ar },
  slug: s.slug,
  description: { en: s.description_en || "", ar: s.description_ar || "" },
  logoUrl: s.logo_url,
  coverBannerUrl: s.cover_banner_url || "",
  rating: Number(s.rating),
  reviewCount: s.review_count,
  isVerified: s.is_verified,
  isActive: s.is_active,
  contactEmail: s.contact_email || "",
  contactPhone: s.contact_phone || "",
});
