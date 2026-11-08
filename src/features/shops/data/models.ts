export interface ShopDto {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  description_en: string | null;
  description_ar: string | null;
  logo_url: string;
  cover_banner_url: string | null;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_active: boolean;
  contact_email: string | null;
  contact_phone: string | null;
}
