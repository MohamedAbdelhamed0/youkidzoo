export interface Category {
  id: string;
  name: { en: string; ar: string };
  slug: string;
  description: { en: string; ar: string };
  iconUrl: string;
  bannerUrl: string;
  parentId: string | null;
  shopId: string | null;
  displayOrder: number;
  isActive: boolean;
}
export interface CategoryRepository {
  list(): Promise<Category[]>;
}
