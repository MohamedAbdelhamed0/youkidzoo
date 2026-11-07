import { expect, it, vi } from "vitest";
import { ProductRepositoryImpl } from "../features/products/data/ProductRepositoryImpl";
import { DemoProductDataSource } from "../features/products/data/datasources/DemoProductDataSource";
import { AuthRepositoryImpl } from "../features/auth/data/AuthRepositoryImpl";
import type { ProfileDto } from "../features/auth/data/models";
import type { IAuthDataSource } from "../features/auth/data/datasources/IAuthDataSource";
import { AdminRepositoryImpl } from "../features/admin/data/AdminRepositoryImpl";
import type { IAdminDataSource } from "../features/admin/data/datasources/IAdminDataSource";
import { OrderRepositoryImpl } from "../features/orders/data/OrderRepositoryImpl";
import type { OrderDto } from "../features/orders/data/models";
import type { IOrderDataSource } from "../features/orders/data/datasources/IOrderDataSource";
const profile: ProfileDto = {
  id: "customer",
  username: "parent",
  email: "parent@example.test",
  full_name: "Test Parent",
  phone: null,
  avatar_url: null,
  role: "user",
  preferred_language: "ar",
  is_active: true,
  created_at: "2026-11-07",
};
function authSource(): IAuthDataSource {
  return {
    getProfile: vi.fn(async () => profile),
    signIn: vi.fn(async () => {}),
    signUp: vi.fn(async () => ({ confirmationRequired: true })),
    signOut: vi.fn(async () => {}),
    updateProfile: vi.fn(async () => {}),
    onChange: vi.fn(() => () => {}),
  };
}
it("swaps the catalog source without React or Supabase and returns independent domain values", async () => {
  const dto = (await new DemoProductDataSource().getProducts())[0];
  dto.gallery_urls = ["https://example.test/toy.jpg"];
  const repository = new ProductRepositoryImpl({
    getProducts: async () => [{ ...dto, name_en: "Alternate backend toy" }],
  });
  const [product] = await repository.list();
  expect(product.name).toBe("Alternate backend toy");
  expect(product.shopId).toBe(dto.shop_id);
  expect(product.description.ar).toBe(dto.description_ar);
  product.galleryUrls.push("https://example.test/other.jpg");
  expect(dto.gallery_urls).toHaveLength(1);
});
it("refuses inactive accounts at the repository boundary even when sign-in succeeds", async () => {
  const source = authSource();
  vi.mocked(source.getProfile).mockResolvedValue({
    ...profile,
    is_active: false,
  });
  await expect(
    new AuthRepositoryImpl(source).signIn("parent", "password"),
  ).rejects.toThrow("inactive");
  expect(source.signOut).toHaveBeenCalledOnce();
});
it("does not treat a missing profile/session as successful sign-in", async () => {
  const source = authSource();
  vi.mocked(source.getProfile).mockResolvedValue(null);
  await expect(
    new AuthRepositoryImpl(source).signIn("parent", "password"),
  ).rejects.toThrow("Sign-in could not be completed");
});
it("maps profile fields and reloads the authoritative profile after a save", async () => {
  const source = authSource();
  const repo = new AuthRepositoryImpl(source);
  const user = await repo.updateProfile({
    fullName: "Test Parent",
    phone: "123456",
    preferredLanguage: "ar",
  });
  expect(source.updateProfile).toHaveBeenCalledOnce();
  expect(user.preferredLanguage).toBe("ar");
  expect(user.avatarUrl).toBeNull();
});
it("validates upload metadata before sending bytes to any backend", async () => {
  const source: IAdminDataSource = {
    getRecords: vi.fn(async () => []),
    save: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
    upload: vi.fn(async () => "https://example.test/image.png"),
    getShopCategories: vi.fn(async () => []),
    setShopCategories: vi.fn(async () => {}),
  };
  const repo = new AdminRepositoryImpl(source);
  await expect(
    repo.upload({
      name: "bad.svg",
      mimeType: "image/svg+xml",
      size: 1,
      bytes: new Uint8Array(1),
    }),
  ).rejects.toThrow("JPEG");
  await expect(
    repo.upload({
      name: "bad.png",
      mimeType: "image/png",
      size: 2,
      bytes: new Uint8Array(1),
    }),
  ).rejects.toThrow("JPEG");
  expect(source.upload).not.toHaveBeenCalled();
  await expect(
    repo.upload({
      name: "valid.png",
      mimeType: "image/png",
      size: 1,
      bytes: new Uint8Array(1),
    }),
  ).resolves.toBe("https://example.test/image.png");
});
it("preserves order snapshots without sharing mutable address state with the data source", async () => {
  const dto: OrderDto = {
    id: "order",
    order_number: "YKZ-1",
    user_id: "customer",
    subtotal_amount: 25,
    shipping_fee: 7,
    discount_amount: 0,
    total_amount: 32,
    status: "pending",
    shipping_address: {
      recipientName: "Test Parent",
      phone: "123456",
      country: "Egypt",
      city: "Cairo",
      streetAddress: "123 Test Street",
    },
    notes: "",
    created_at: "2026-11-07",
    updated_at: "2026-11-07",
    order_items: [
      {
        id: "line",
        product_id: null,
        shop_id: null,
        product_name_en: "Archived toy",
        product_name_ar: "لعبة مؤرشفة",
        product_photo: "",
        unit_price: 25,
        quantity: 1,
        subtotal: 25,
      },
    ],
  };
  const source: IOrderDataSource = {
    getOrders: async () => [dto],
    place: async () => dto,
    updateStatus: async () => {},
  };
  const [order] = await new OrderRepositoryImpl(source).list();
  dto.shipping_address.city = "Changed upstream";
  expect(order.shippingAddress.city).toBe("Cairo");
  expect(order.items[0].productName.en).toBe("Archived toy");
  expect(order.items[0].productId).toBeNull();
});
