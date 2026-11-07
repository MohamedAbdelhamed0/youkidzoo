export interface CategoryDto {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  description_en: string | null;
  description_ar: string | null;
  icon_url: string;
  banner_url: string | null;
  parent_id: string | null;
  shop_id: string | null;
  display_order: number;
  is_active: boolean;
}
