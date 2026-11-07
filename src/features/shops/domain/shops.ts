export interface Shop {
  id: string;
  ownerId: string | null;
  name: { en: string; ar: string };
  slug: string;
  description: { en: string; ar: string };
  logoUrl: string;
  coverBannerUrl: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isActive: boolean;
  contactEmail: string;
  contactPhone: string;
}
export interface ShopRepository {
  list(): Promise<Shop[]>;
  categoryIds(shopId: string): Promise<string[]>;
}
