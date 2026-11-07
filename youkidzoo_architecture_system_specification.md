# YouKidZoo — Scalable Kids E-Commerce Architecture & System Specification

## 1. Executive Summary & Project Overview
**YouKidZoo** is a modern, multi-shop kids and baby e-commerce web application built with **React (TypeScript)**. The platform is engineered using **Clean Architecture** combined with **Feature-Sliced Design (FSD)** to guarantee high scalability, maintainability, and strict separation of concerns.

### Core Architectural Goals
1. **Database-Agnostic Infrastructure:** Uses **Supabase** initially as the backend-as-a-service (BaaS), isolated behind a strict **DataSource + Repository Pattern** so the database can be swapped to a custom Node.js/NestJS API, Firebase, or GraphQL in the future without touching UI, State Controllers, or Business Logic.
2. **Feature-Isolated Modular Structure:** Every domain feature (`auth`, `products`, `categories`, `shops`, `orders`, `payments`, `admin`) resides in its own self-contained module.
3. **State Management Controllers:** Decouples React UI components from business workflows using dedicated State Controllers.
4. **Full Localization (`ar` & `en`):** Built-in bilingual support with automatic **RTL (Right-to-Left)** and **LTR (Left-to-Right)** layout switching and localized database content.
5. **Multi-Shop & Category Hierarchy:** Supports global categories, individual shops, shop-specific categories, and rich product models tailored for kids' retail.

---

## 2. UI/UX Design Specification (Based on Reference Design)

### 2.1 Color Palette & Visual Identity
| Token | Hex Code | Usage |
| :--- | :--- | :--- |
| **Brand Pink (Primary)** | `#FF4D8D` | Category header bar, primary CTA buttons ("Shop Now"), search icon button, badges |
| **Magical Lime (Hero BG)** | `#B4E33D` / `#F5B727` | Main center hero banner background with warm yellow cloud illustrations |
| **Adventure Pink (Card 1)** | `#F78CA2` | Top-right promotional card background |
| **Joyful Orange (Card 2)** | `#F39F5A` | Bottom-right promotional card background |
| **Sky Blue (Deals Banner)** | `#BCE6FF` | Full-width bottom "Specials Deals" countdown section |
| **Cream Topbar** | `#FDF8EE` | Top utility bar (Store Locations, Phone, Shipping promo, Support) |
| **Surface / Background** | `#FFFFFF` / `#F8F9FA` | Main page canvas, sidebar background, countdown timer boxes |
| **Typography Dark** | `#1E293B` | Headings, navigation links, category labels, countdown digits |

### 2.2 Landing Page Layout Breakdown
1. **Top Utility Strip:**
   - Left: Store Locations pin + Phone number.
   - Center: Promotional announcement (`Worldwide Shipping - Free Shipping On Orders Over $100`).
   - Right: Customer support contact (`Call Us If You Need Support`) + **Language Switcher (`EN | العربية`)**.
2. **Main Header:**
   - Left: Dropdown Navigation (`Home`, `Shop`, `Products`, `Pages`, `Blog`).
   - Center: Playful multicolor **YouKidZoo** logo (`Y-o-u-K-i-d-Z-o-o` in pastel/vibrant kids typography).
   - Right: Pill-shaped search bar with pink search button, User Account icon, Wishlist icon with counter badge, Cart icon with counter badge.
3. **Above-the-Fold Grid (3-Column Asymmetric Layout):**
   - **Left Sidebar (`280px` fixed on desktop, drawer on mobile):**
     - Pink header button (`Browse All Categories` with hamburger icon).
     - Vertical scrollable list with playful 3D/flat icons and chevron arrows:
       1. Babies
       2. Kids
       3. Parents
       4. Baby Bottles
       5. Pacifier
       6. Baby Strollers
       7. Car Seats
       8. Education Toys
       9. Book & Comic
       10. Gifts & Sets
       11. Home & Safety
       12. Memories & Keepsakes
   - **Center Hero Carousel (Main Banner):**
     - Headline: *"Discover Wonderful Magical World!"*
     - Subtext: *"Explore a magical collection that inspires creativity, wonder, and joy in every child!"*
     - CTA: Pink rounded pill button (`Shop Now ↗`).
     - Visuals: Floating 3D rocket, clouds, trophy, paint palette, and child holding toy airplane.
   - **Right Promo Stack (2 Vertical Cards):**
     - Top Card (Pink): *"Endless Adventures — Unleash imagination through thrilling experiences."*
     - Bottom Card (Orange): *"Joyful Discoveries — Explore fun and learning together!"*
4. **Full-Width "Specials Deals" Banner:**
   - Left side: Title (`Specials Deals`), urgency subtitle, live 4-box countdown timer (`DAYS : HOURS : MINUTES : SECONDS`), and `Shop Now ↗` CTA button.
   - Right side: Sky-blue radial rays with floating helicopter, hot air balloon, and jumping child visual.

---

## 3. Clean Architecture & Folder Structure

### 3.1 Architectural Layers Flow
Each feature follows a strict unidirectional dependency rule:

$$\text{UI Components} \longrightarrow \text{State Controller} \longrightarrow \text{Use Cases / Domain} \longrightarrow \text{Repository Interface} \longleftarrow \text{Repository Impl} \longrightarrow \text{DataSource Interface} \longleftarrow \text{SupabaseDataSource}$$

- **Domain Layer (`domain/`):** Pure TypeScript. Contains Entities (Models), Repository Interfaces (Contracts), and Business Use Cases. Zero dependency on React or Supabase.
- **Data Layer (`data/`):** Contains DTOs (Data Transfer Objects), DataSource Interfaces, Concrete DataSources (`SupabaseDataSource`), and Concrete Repositories that map DTOs to Domain Entities.
- **Controller / State Layer (`controllers/`):** Manages state (using Zustand or Redux Toolkit + TanStack Query), calls Repositories/Use Cases, handles loading/error states, and exposes clean hooks to the UI.
- **Presentation Layer (`presentation/`):** Pure React components, pages, and styles. Never calls Supabase or APIs directly.

### 3.2 Complete Project Directory Tree
```text
youkidzoo/
├── public/
│   ├── locales/
│   │   ├── en/
│   │   │   └── translation.json
│   │   └── ar/
│   │       └── translation.json
│   └── assets/
├── src/
│   ├── app/                                # App-level setup
│   │   ├── App.tsx
│   │   ├── routes/                         # Route definitions & RBAC Guards
│   │   │   ├── AppRouter.tsx
│   │   │   ├── ProtectedRoute.tsx          # Requires authenticated user
│   │   │   └── AdminRoute.tsx              # Requires role === 'admin'
│   │   ├── providers/                      # Global Providers (I18n, Theme, Query, Auth)
│   │   └── di/                             # Dependency Injection Container (Swap DB here!)
│   │       └── container.ts
│   │
│   ├── core/                               # Shared technical infrastructure
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   └── supabaseClient.ts           # Isolated Supabase client instance
│   │   ├── errors/
│   │   │   ├── AppError.ts
│   │   │   └── Failure.ts
│   │   ├── i18n/
│   │   │   ├── i18nConfig.ts
│   │   │   └── useDirection.ts             # Handles RTL (ar) & LTR (en) switching
│   │   └── utils/
│   │       ├── currencyFormatter.ts
│   │       └── countdownTimer.ts
│   │
│   ├── shared/                             # Reusable UI Kit & Layout components
│   │   ├── components/
│   │   │   ├── Button/
│   │   │   ├── Badge/
│   │   │   ├── CountdownTimer/
│   │   │   ├── SearchBar/
│   │   │   └── LanguageSwitcher/
│   │   └── layouts/
│   │       ├── MainStoreLayout.tsx         # Header + Left Category Sidebar + Footer
│   │       └── AdminDashboardLayout.tsx    # Admin Sidebar + Topbar + Content Area
│   │
│   └── features/                           # FEATURE-SLICED MODULES (Each feature isolated)
│       │
│       ├── auth/                           # 1. Authentication & User Roles Feature
│       │   ├── domain/
│       │   │   ├── entities/User.ts
│       │   │   └── repositories/IAuthRepository.ts
│       │   ├── data/
│       │   │   ├── datasources/IAuthDataSource.ts
│       │   │   ├── datasources/SupabaseAuthDataSource.ts
│       │   │   ├── models/UserDto.ts
│       │   │   └── repositories/AuthRepositoryImpl.ts
│       │   ├── controllers/
│       │   │   └── useAuthController.ts
│       │   └── presentation/
│       │       ├── pages/LoginPage.tsx
│       │       ├── pages/RegisterPage.tsx
│       │       └── components/AuthForm.tsx
│       │
│       ├── categories/                     # 2. Categories Feature (Left Sidebar & Shop Categories)
│       │   ├── domain/
│       │   │   ├── entities/Category.ts
│       │   │   └── repositories/ICategoryRepository.ts
│       │   ├── data/
│       │   │   ├── datasources/ICategoryDataSource.ts
│       │   │   ├── datasources/SupabaseCategoryDataSource.ts
│       │   │   ├── models/CategoryDto.ts
│       │   │   └── repositories/CategoryRepositoryImpl.ts
│       │   ├── controllers/
│       │   │   └── useCategoryController.ts
│       │   └── presentation/
│       │       ├── components/CategorySidebar.tsx
│       │       └── pages/CategoryProductsPage.tsx
│       │
│       ├── shops/                          # 3. Multi-Shop Feature
│       │   ├── domain/
│       │   │   ├── entities/Shop.ts
│       │   │   └── repositories/IShopRepository.ts
│       │   ├── data/
│       │   │   ├── datasources/IShopDataSource.ts
│       │   │   ├── datasources/SupabaseShopDataSource.ts
│       │   │   ├── models/ShopDto.ts
│       │   │   └── repositories/ShopRepositoryImpl.ts
│       │   ├── controllers/
│       │   │   └── useShopController.ts
│       │   └── presentation/
│       │       ├── pages/ShopsDirectoryPage.tsx
│       │       ├── pages/ShopDetailsPage.tsx
│       │       └── components/ShopCategoryTabs.tsx
│       │
│       ├── products/                       # 4. Products & Deals Feature
│       │   ├── domain/
│       │   │   ├── entities/Product.ts
│       │   │   └── repositories/IProductRepository.ts
│       │   ├── data/
│       │   │   ├── datasources/IProductDataSource.ts
│       │   │   ├── datasources/SupabaseProductDataSource.ts
│       │   │   ├── models/ProductDto.ts
│       │   │   └── repositories/ProductRepositoryImpl.ts
│       │   ├── controllers/
│       │   │   └── useProductController.ts
│       │   └── presentation/
│       │       ├── components/ProductCard.tsx
│       │       ├── components/SpecialDealsBanner.tsx
│       │       ├── pages/ProductListPage.tsx
│       │       └── pages/ProductDetailsPage.tsx
│       │
│       ├── cart/                           # 5. Shopping Cart & Wishlist Feature
│       │   ├── domain/
│       │   ├── data/
│       │   ├── controllers/useCartController.ts
│       │   └── presentation/
│       │
│       ├── orders/                         # 6. Orders & Checkout Feature
│       │   ├── domain/
│       │   │   ├── entities/Order.ts
│       │   │   └── repositories/IOrderRepository.ts
│       │   ├── data/
│       │   │   ├── datasources/IOrderDataSource.ts
│       │   │   ├── datasources/SupabaseOrderDataSource.ts
│       │   │   └── repositories/OrderRepositoryImpl.ts
│       │   ├── controllers/
│       │   │   └── useOrderController.ts
│       │   └── presentation/
│       │       ├── pages/CheckoutPage.tsx
│       │       └── pages/UserOrdersPage.tsx
│       │
│       ├── payments/                       # 7. Payments Feature
│       │   ├── domain/
│       │   │   ├── entities/Payment.ts
│       │   │   └── repositories/IPaymentRepository.ts
│       │   ├── data/
│       │   ├── controllers/usePaymentController.ts
│       │   └── presentation/
│       │
│       └── admin/                          # 8. Admin Dashboard Feature
│           ├── controllers/
│           │   └── useAdminDashboardController.ts
│           └── presentation/
│               ├── pages/AdminOverviewPage.tsx
│               ├── pages/AdminProductsManagerPage.tsx
│               ├── pages/AdminShopsManagerPage.tsx
│               ├── pages/AdminCategoriesManagerPage.tsx
│               ├── pages/AdminOrdersPage.tsx
│               └── pages/AdminPaymentsPage.tsx
```

---

## 4. Domain Models & Database Schema

Below are the comprehensive models tailored for **YouKidZoo**, including additional kids-specific e-commerce fields (such as age group, safety certifications, bilingual fields, and flash-deal timers).

### 4.1 Entity Definitions (TypeScript Domain Models)

```typescript
// 1. USER ENTITY
export type UserRole = 'user' | 'admin' | 'shop_manager';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  preferredLanguage: 'en' | 'ar';
  isActive: boolean;
  createdAt: string;
}

// 2. CATEGORY ENTITY
export interface Category {
  id: string;
  slug: string;
  name: {
    en: string;
    ar: string;
  };
  description?: {
    en: string;
    ar: string;
  };
  iconUrl: string;           // Icon shown in the left sidebar (e.g., Baby Bottle, Stroller)
  bannerUrl?: string;
  parentId?: string | null;  // Supports nested subcategories
  shopId?: string | null;    // Null = Global Category; Populated = Shop-Specific Category
  displayOrder: number;
  isActive: boolean;
}

// 3. SHOP ENTITY
export interface Shop {
  id: string;
  ownerId: string;
  slug: string;
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  logoUrl: string;
  coverBannerUrl: string;
  rating: number;
  reviewCount: number;
  contactEmail?: string;
  contactPhone?: string;
  isVerified: boolean;
  isActive: boolean;
  categories: Category[];    // Categories available inside this shop
  createdAt: string;
}

// 4. PRODUCT ENTITY (Enriched for Kids E-Commerce)
export type AgeGroup = '0-6m' | '6-12m' | '1-3y' | '4-6y' | '7-9y' | '10-12y' | 'all-ages';
export type GenderTarget = 'boy' | 'girl' | 'unisex';

export interface Product {
  id: string;
  sku: string;
  shopId: string;            // Belongs to a specific Shop
  categoryId: string;        // Belongs to a global/shop Category
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  price: number;
  discountPrice?: number | null;
  currency: string;          // e.g., 'USD', 'EGP', 'SAR'
  thumbnailUrl: string;      // Primary photo
  galleryUrls: string[];     // Additional photos
  stockQuantity: number;
  
  // Kids-specific attributes
  ageGroup: AgeGroup;
  genderTarget: GenderTarget;
  brand?: string;
  material?: { en: string; ar: string };
  safetyWarnings?: { en: string; ar: string }; // e.g., "Choking hazard - small parts"
  dimensions?: { weightKg: number; widthCm: number; heightCm: number };
  
  // Merchandising & Deals (Powers the Landing Page)
  isFeatured: boolean;
  isSpecialDeal: boolean;
  specialDealEndsAt?: string | null; // Powers the "Specials Deals" countdown timer!
  
  ratingAverage: number;
  ratingCount: number;
  isActive: boolean;
  createdAt: string;
}

// 5. ORDER ENTITY
export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'refunded';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  shopId: string;
  productNameSnapshot: { en: string; ar: string };
  productPhotoSnapshot: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  country: string;
  city: string;
  streetAddress: string;
  postalCode?: string;
}

export interface Order {
  id: string;
  orderNumber: string;       // e.g., "YKZ-2026-00941"
  userId: string;
  items: OrderItem[];
  subtotalAmount: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 6. PAYMENT ENTITY
export type PaymentMethod = 'credit_card' | 'cash_on_delivery' | 'apple_pay' | 'wallet';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  providerTransactionId?: string; // e.g., Stripe / Paymob / Moyasar ID
  paidAt?: string | null;
  createdAt: string;
}
```

---

### 4.2 Supabase PostgreSQL Schema Blueprint
You can run this SQL directly in your Supabase SQL Editor to initialize the database:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES / USERS TABLE (Links to Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'shop_manager')),
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'ar')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SHOPS TABLE
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  logo_url TEXT NOT NULL,
  cover_banner_url TEXT,
  rating NUMERIC(3,2) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  contact_email TEXT,
  contact_phone TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CATEGORIES TABLE (Supports Global & Shop-Specific Categories)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  icon_url TEXT NOT NULL,
  banner_url TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE, -- NULL means Global Category
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SHOP_CATEGORIES (Many-to-Many link so shops can also adopt Global Categories)
CREATE TABLE public.shop_categories (
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (shop_id, category_id)
);

-- 5. PRODUCTS TABLE
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  discount_price NUMERIC(10,2) CHECK (discount_price >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  thumbnail_url TEXT NOT NULL,
  gallery_urls TEXT[] DEFAULT '{}',
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  age_group TEXT DEFAULT 'all-ages',
  gender_target TEXT DEFAULT 'unisex' CHECK (gender_target IN ('boy', 'girl', 'unisex')),
  brand TEXT,
  safety_warnings_en TEXT,
  safety_warnings_ar TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_special_deal BOOLEAN DEFAULT false,
  special_deal_ends_at TIMESTAMPTZ,
  rating_average NUMERIC(3,2) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ORDERS TABLE
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  subtotal_amount NUMERIC(10,2) NOT NULL,
  shipping_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
  ),
  shipping_address JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ORDER ITEMS TABLE
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
  product_name_en TEXT NOT NULL,
  product_name_ar TEXT NOT NULL,
  product_photo TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(10,2) NOT NULL
);

-- 8. PAYMENTS TABLE
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  method TEXT NOT NULL CHECK (method IN ('credit_card', 'cash_on_delivery', 'apple_pay', 'wallet')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  provider_transaction_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 5. Clean Architecture Code Blueprint (How Database Swapping Works)

Below is the exact pattern used across every feature (`products`, `categories`, `shops`, `orders`, `auth`) so you can replace Supabase with any other backend in minutes.

### Step 1: DataSource Interface (`features/products/data/datasources/IProductDataSource.ts`)
```typescript
import { ProductDto } from '../models/ProductDto';

export interface ProductFilterParams {
  categoryId?: string;
  shopId?: string;
  searchQuery?: string;
  onlySpecialDeals?: boolean;
}

export interface IProductDataSource {
  getProducts(params?: ProductFilterParams): Promise<ProductDto[]>;
  getProductById(id: string): Promise<ProductDto | null>;
  createProduct(data: Omit<ProductDto, 'id' | 'created_at'>): Promise<ProductDto>;
  updateProduct(id: string, data: Partial<ProductDto>): Promise<ProductDto>;
  deleteProduct(id: string): Promise<void>;
}
```

### Step 2: Supabase DataSource Implementation (`features/products/data/datasources/SupabaseProductDataSource.ts`)
```typescript
import { supabase } from '@/core/config/supabaseClient';
import { IProductDataSource, ProductFilterParams } from './IProductDataSource';
import { ProductDto } from '../models/ProductDto';

export class SupabaseProductDataSource implements IProductDataSource {
  async getProducts(params?: ProductFilterParams): Promise<ProductDto[]> {
    let query = supabase.from('products').select('*').eq('is_active', true);

    if (params?.categoryId) {
      query = query.eq('category_id', params.categoryId);
    }
    if (params?.shopId) {
      query = query.eq('shop_id', params.shopId);
    }
    if (params?.onlySpecialDeals) {
      query = query.eq('is_special_deal', true);
    }
    if (params?.searchQuery) {
      query = query.or(
        `name_en.ilike.%${params.searchQuery}%,name_ar.ilike.%${params.searchQuery}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as ProductDto[];
  }

  async getProductById(id: string): Promise<ProductDto | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data as ProductDto;
  }

  async createProduct(payload: Omit<ProductDto, 'id' | 'created_at'>): Promise<ProductDto> {
    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ProductDto;
  }

  async updateProduct(id: string, payload: Partial<ProductDto>): Promise<ProductDto> {
    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ProductDto;
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
```

### Step 3: Repository Implementation (`features/products/data/repositories/ProductRepositoryImpl.ts`)
```typescript
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { IProductDataSource, ProductFilterParams } from '../datasources/IProductDataSource';
import { Product } from '../../domain/entities/Product';
import { ProductMapper } from '../models/ProductMapper';

export class ProductRepositoryImpl implements IProductRepository {
  constructor(private readonly dataSource: IProductDataSource) {}

  async getProducts(params?: ProductFilterParams): Promise<Product[]> {
    const dtos = await this.dataSource.getProducts(params);
    return dtos.map(ProductMapper.toDomain);
  }

  async getProductById(id: string): Promise<Product | null> {
    const dto = await this.dataSource.getProductById(id);
    return dto ? ProductMapper.toDomain(dto) : null;
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const dtoPayload = ProductMapper.toDto(product);
    const createdDto = await this.dataSource.createProduct(dtoPayload);
    return ProductMapper.toDomain(createdDto);
  }
}
```

### Step 4: State Management Controller (`features/products/controllers/useProductController.ts`)
```typescript
import { create } from 'zustand';
import { Product } from '../domain/entities/Product';
import { ProductFilterParams } from '../data/datasources/IProductDataSource';
import { diContainer } from '@/app/di/container';

interface ProductControllerState {
  products: Product[];
  specialDeals: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;

  // Controller Actions
  fetchProducts: (filters?: ProductFilterParams) => Promise<void>;
  fetchSpecialDeals: () => Promise<void>;
  addProductAsAdmin: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
}

export const useProductController = create<ProductControllerState>((set) => ({
  products: [],
  specialDeals: [],
  selectedProduct: null,
  isLoading: false,
  error: null,

  fetchProducts: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const items = await diContainer.productRepository.getProducts(filters);
      set({ products: items, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchSpecialDeals: async () => {
    try {
      const deals = await diContainer.productRepository.getProducts({ onlySpecialDeals: true });
      set({ specialDeals: deals });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  addProductAsAdmin: async (newProduct) => {
    set({ isLoading: true, error: null });
    try {
      const created = await diContainer.productRepository.createProduct(newProduct);
      set((state) => ({
        products: [created, ...state.products],
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
}));
```

### Step 5: Dependency Injection Container (`src/app/di/container.ts`)
When you decide to migrate from **Supabase** to **Node.js / NestJS / PostgreSQL / Firebase** in the future, you only swap **one line** here:

```typescript
import { SupabaseProductDataSource } from '@/features/products/data/datasources/SupabaseProductDataSource';
// In the future: import { RestApiProductDataSource } from '@/features/products/data/datasources/RestApiProductDataSource';
import { ProductRepositoryImpl } from '@/features/products/data/repositories/ProductRepositoryImpl';

// 1. Instantiate DataSources
const productDataSource = new SupabaseProductDataSource(); 
// Future swap: const productDataSource = new RestApiProductDataSource(axiosClient);

// 2. Inject DataSources into Repositories
export const diContainer = {
  productRepository: new ProductRepositoryImpl(productDataSource),
  // categoryRepository: new CategoryRepositoryImpl(categoryDataSource),
  // shopRepository: new ShopRepositoryImpl(shopDataSource),
  // orderRepository: new OrderRepositoryImpl(orderDataSource),
  // authRepository: new AuthRepositoryImpl(authDataSource),
};
```

---

## 6. Localization Architecture (`ar` & `en` + RTL/LTR)

### 6.1 Automatic Layout Direction (`RTL` / `LTR`)
When the user switches between English (`en`) and Arabic (`ar`):
1. `document.documentElement.dir` updates dynamically between `'ltr'` and `'rtl'`.
2. `document.documentElement.lang` updates between `'en'` and `'ar'`.
3. In **RTL (Arabic)** mode:
   - The **Browse All Categories** sidebar automatically moves to the **right** side of the screen using logical CSS properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*` in Tailwind CSS).
   - Arrow icons inside categories flip automatically (`rtl:rotate-180`).
   - Typography switches from `'Fredoka' / 'Nunito'` (English) to `'Cairo' / 'Tajawal'` (Arabic).

### 6.2 Localized Entity Helper
```typescript
// src/core/i18n/getLocalizedText.ts
export function getLocalizedText(
  field: { en: string; ar: string },
  currentLang: 'en' | 'ar'
): string {
  return field[currentLang] || field.en;
}

// Usage in ProductCard.tsx:
// <h3>{getLocalizedText(product.name, i18n.language)}</h3>
```

---

## 7. Authentication, User Roles & Admin Dashboard

### 7.1 Role Matrix
| Capability | Guest | Customer (`user`) | Admin (`admin`) |
| :--- | :---: | :---: | :---: |
| Browse Landing Page, Categories & Shops | ✅ | ✅ | ✅ |
| Filter Products by Category or Shop | ✅ | ✅ | ✅ |
| Switch Language (`AR` / `EN`) | ✅ | ✅ | ✅ |
| Login with Username/Email & Password | ✅ | ✅ | ✅ |
| Place Orders & Make Payments | ❌ | ✅ | ✅ |
| View Personal Order History | ❌ | ✅ | ✅ |
| Access `/admin` Dashboard | ❌ | ❌ | ✅ |
| Add / Edit / Delete Products & Photos | ❌ | ❌ | ✅ |
| Manage Shops & Shop Categories | ❌ | ❌ | ✅ |
| View All Customer Orders & Update Status | ❌ | ❌ | ✅ |
| Monitor Payments, Refunds & Revenue | ❌ | ❌ | ✅ |

### 7.2 Admin Dashboard Modules (`/admin/*`)
1. **Executive Overview (`/admin`):**
   - Total Revenue, Total Orders, Active Shops, Low-Stock Products, Recent Orders table.
2. **Products Management (`/admin/products`):**
   - Add/Edit Product modal with bilingual inputs (`Name EN`, `Name AR`, `Description EN`, `Description AR`), Supabase Storage multi-photo uploader, Shop selector, Category selector, Price, Stock, and "Special Deal" toggle with expiry date picker.
3. **Categories Management (`/admin/categories`):**
   - Manage sidebar icons, display order, global vs. shop-specific category assignment.
4. **Shops Management (`/admin/shops`):**
   - Create and verify partner shops, assign categories to each shop, manage shop banners.
5. **Orders & Fulfillment (`/admin/orders`):**
   - Filter orders by status (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`), inspect shipping details, print invoice.
6. **Payments Ledger (`/admin/payments`):**
   - Track payment transactions, payment methods (`Credit Card`, `COD`, `Wallet`), and payment status (`Paid`, `Pending`, `Failed`, `Refunded`).

---

## 8. Recommended Technology Stack

| Layer | Technology | Reason |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18+ with Vite & TypeScript | Fast builds, strict type safety for Clean Architecture interfaces |
| **Styling & RTL** | Tailwind CSS + `tailwindcss-rtl` | Built-in logical properties for seamless Arabic/English layout mirroring |
| **State Management (Controllers)** | Zustand | Clean, boilerplate-free controller stores outside React components |
| **Routing** | React Router v6 | Supports nested layouts (`MainStoreLayout` vs `AdminDashboardLayout`) and RBAC route guards |
| **Localization (i18n)** | `i18next` + `react-i18next` | Industry standard for JSON translations and language detection |
| **Icons** | `lucide-react` + Custom 3D SVG Kids Icons | Matches the colorful category icons in the reference screenshot |
| **Forms & Validation** | `react-hook-form` + `zod` | Type-safe validation for Login, Checkout, and Admin Product creation |
| **Current Backend / DB** | Supabase (PostgreSQL + Auth + Storage) | Rapid setup with Row-Level Security (RLS) and image storage buckets |

---

## 9. Step-by-Step Implementation Roadmap

1. **Phase 1: Core Setup & Design System**
   - Initialize Vite + React + TypeScript project.
   - Configure Tailwind CSS with YouKidZoo custom colors (`#FF4D8D`, `#B4E33D`, `#BCE6FF`, etc.) and RTL font families (`Fredoka` for EN, `Cairo` for AR).
   - Set up `i18next` and the `LanguageSwitcher` component.
2. **Phase 2: Clean Architecture & Supabase Integration**
   - Create `core/config/supabaseClient.ts` and `app/di/container.ts`.
   - Run the PostgreSQL schema script in Supabase.
   - Build DataSource interfaces, Supabase implementations, and Repositories for `categories`, `shops`, and `products`.
3. **Phase 3: Storefront UI (Matching Reference Image)**
   - Build `MainStoreLayout` with the Top Utility Bar, Colorful `YouKidZoo` Header, Search Bar, and Cart/Wishlist counters.
   - Build the `CategorySidebar` (Pink header + 12 kids categories with icons).
   - Build the Hero Grid (Green Magical World banner + Pink/Orange right promo cards) and the Sky-Blue `Specials Deals` live countdown banner.
   - Build Shop pages (showing shop-specific categories and products) and Category product listing pages.
4. **Phase 4: Authentication, Checkout & Admin Dashboard**
   - Implement Username/Password authentication with role checking (`user` vs `admin`).
   - Build Cart, Checkout, Order creation, and Payment recording.
   - Build the protected `/admin` Dashboard for managing products, categories, shops, orders, and payments.