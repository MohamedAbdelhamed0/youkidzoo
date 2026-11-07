export const ageGroups = [
  "0-6m",
  "6-12m",
  "1-3y",
  "4-6y",
  "7-9y",
  "10-12y",
  "all-ages",
] as const;
export type AgeGroup = (typeof ageGroups)[number];
export type GenderTarget = "boy" | "girl" | "unisex";
export interface Product {
  id: string;
  name: string;
  name_ar: string;
  category: string;
  categoryNameAr?: string;
  price: number;
  emoji: string;
  color: string;
  stock: number;
  sku: string;
  shopId: string;
  categoryId: string;
  description: { en: string; ar: string };
  discountPrice?: number | null;
  currency: string;
  thumbnailUrl: string;
  galleryUrls: string[];
  ageGroup: AgeGroup;
  genderTarget: GenderTarget;
  brand?: string;
  material?: { en: string; ar: string };
  safetyWarnings?: { en: string; ar: string };
  dimensions?: { weightKg: number; widthCm: number; heightCm: number };
  isFeatured: boolean;
  isSpecialDeal: boolean;
  specialDealEndsAt?: string | null;
  ratingAverage: number;
  ratingCount: number;
  isActive: boolean;
  createdAt: string;
}
export interface ProductRepository {
  list(): Promise<Product[]>;
}
