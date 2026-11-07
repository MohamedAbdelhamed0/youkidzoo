import type { Category } from "../domain/Category";
import type { CategoryDto } from "./models";
export const mapCategory = (c: CategoryDto): Category => ({
  id: c.id,
  name: { en: c.name_en, ar: c.name_ar },
  slug: c.slug,
  description: { en: c.description_en || "", ar: c.description_ar || "" },
  iconUrl: c.icon_url,
  bannerUrl: c.banner_url || "",
  parentId: c.parent_id,
  shopId: c.shop_id,
  displayOrder: c.display_order,
  isActive: c.is_active,
});
