import { supabase } from "../../core/config/supabaseClient";
import type { AuthRepository } from "../../features/auth/domain/auth";
import type { ProductRepository } from "../../features/products/domain/Product";
import type { OrderRepository } from "../../features/orders/domain/orders";
import type { ShopRepository } from "../../features/shops/domain/shops";
import type { AdminRepository } from "../../features/admin/domain/admin";
import { AuthRepositoryImpl } from "../../features/auth/data/AuthRepositoryImpl";
import { SupabaseAuthDataSource } from "../../features/auth/data/datasources/SupabaseAuthDataSource";
import { ProductRepositoryImpl } from "../../features/products/data/ProductRepositoryImpl";
import { SupabaseProductDataSource } from "../../features/products/data/datasources/SupabaseProductDataSource";
import { DemoProductDataSource } from "../../features/products/data/datasources/DemoProductDataSource";
import { OrderRepositoryImpl } from "../../features/orders/data/OrderRepositoryImpl";
import { SupabaseOrderDataSource } from "../../features/orders/data/datasources/SupabaseOrderDataSource";
import { ShopRepositoryImpl } from "../../features/shops/data/ShopRepositoryImpl";
import { SupabaseShopDataSource } from "../../features/shops/data/datasources/SupabaseShopDataSource";
import { DemoShopDataSource } from "../../features/shops/data/datasources/DemoShopDataSource";
import { AdminRepositoryImpl } from "../../features/admin/data/AdminRepositoryImpl";
import { SupabaseAdminDataSource } from "../../features/admin/data/datasources/SupabaseAdminDataSource";
import type { CategoryRepository } from "../../features/categories/domain/Category";
import { CategoryRepositoryImpl } from "../../features/categories/data/CategoryRepositoryImpl";
import { SupabaseCategoryDataSource } from "../../features/categories/data/datasources/SupabaseCategoryDataSource";
import { DemoCategoryDataSource } from "../../features/categories/data/datasources/DemoCategoryDataSource";
import type { PaymentRepository } from "../../features/payments/domain/Payment";
import { PaymentRepositoryImpl } from "../../features/payments/data/PaymentRepositoryImpl";
import { SupabasePaymentDataSource } from "../../features/payments/data/datasources/SupabasePaymentDataSource";
export interface Services {
  authRepository: AuthRepository;
  productRepository: ProductRepository;
  orderRepository: OrderRepository;
  shopRepository: ShopRepository;
  adminRepository: AdminRepository;
  categoryRepository: CategoryRepository;
  paymentRepository: PaymentRepository;
}
export const container: Services = {
  authRepository: new AuthRepositoryImpl(
    new SupabaseAuthDataSource(
      supabase,
      new URL(`${import.meta.env.BASE_URL}account`, window.location.origin)
        .href,
    ),
  ),
  productRepository: new ProductRepositoryImpl(
    supabase
      ? new SupabaseProductDataSource(supabase)
      : new DemoProductDataSource(),
  ),
  orderRepository: new OrderRepositoryImpl(
    new SupabaseOrderDataSource(supabase),
  ),
  shopRepository: new ShopRepositoryImpl(
    supabase ? new SupabaseShopDataSource(supabase) : new DemoShopDataSource(),
  ),
  categoryRepository: new CategoryRepositoryImpl(
    supabase
      ? new SupabaseCategoryDataSource(supabase)
      : new DemoCategoryDataSource(),
  ),
  paymentRepository: new PaymentRepositoryImpl(
    new SupabasePaymentDataSource(supabase),
  ),
  adminRepository: new AdminRepositoryImpl(
    new SupabaseAdminDataSource(supabase),
  ),
};
