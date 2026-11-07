import { ErrorText } from "../shared/components/ErrorText";
import { JournalPage } from "../shared/components/JournalPage";
import { useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  Link,
} from "react-router-dom";
import Storefront from "./Storefront";
import { PageLayout } from "../shared/layouts/PageLayout";
import {
  authRepository,
  useAuthController,
} from "../features/auth/controllers/useAuthController";
import { useLanguage } from "../core/i18n/i18n";
const AuthPage = lazy(() =>
  import("../features/auth/presentation/AuthPages").then((m) => ({
    default: m.AuthPage,
  })),
);
const AccountPage = lazy(() =>
  import("../features/auth/presentation/AuthPages").then((m) => ({
    default: m.AccountPage,
  })),
);
const ShoppingBagPage = lazy(() =>
  import("../features/orders/presentation/OrderPages").then((m) => ({
    default: m.ShoppingBagPage,
  })),
);
const CheckoutPage = lazy(() =>
  import("../features/orders/presentation/OrderPages").then((m) => ({
    default: m.CheckoutPage,
  })),
);
const OrdersPage = lazy(() =>
  import("../features/orders/presentation/OrderPages").then((m) => ({
    default: m.OrdersPage,
  })),
);
const CatalogPage = lazy(() =>
  import("../features/products/presentation/ProductPages").then((m) => ({
    default: m.CatalogPage,
  })),
);
const ProductPage = lazy(() =>
  import("../features/products/presentation/ProductPages").then((m) => ({
    default: m.ProductPage,
  })),
);
const ShopsPage = lazy(() =>
  import("../features/shops/presentation/ShopsPage").then((m) => ({
    default: m.ShopsPage,
  })),
);
const AdminLayout = lazy(() =>
  import("../features/admin/presentation/AdminPages").then((m) => ({
    default: m.AdminLayout,
  })),
);
const AdminOverview = lazy(() =>
  import("../features/admin/presentation/AdminPages").then((m) => ({
    default: m.AdminOverview,
  })),
);
const ResourceManager = lazy(() =>
  import("../features/admin/presentation/AdminPages").then((m) => ({
    default: m.ResourceManager,
  })),
);
const AdminOrders = lazy(() =>
  import("../features/admin/presentation/AdminPages").then((m) => ({
    default: m.AdminOrders,
  })),
);
const AdminPayments = lazy(() =>
  import("../features/admin/presentation/AdminPages").then((m) => ({
    default: m.AdminPayments,
  })),
);
function ProtectedRoute() {
  const { user, loading, error, refresh } = useAuthController();
  const location = useLocation();
  const { t } = useLanguage();
  if (loading)
    return (
      <p role="status">{t("Loading your account…", "جارٍ تحميل حسابك…")}</p>
    );
  if (error)
    return (
      <div role="alert">
        <p>
          <ErrorText message={error} />
        </p>
        <button onClick={() => void refresh()}>
          {t("Try again", "حاول مجددًا")}
        </button>
      </div>
    );
  return user ? (
    <Outlet />
  ) : (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname + location.search }}
    />
  );
}
export function AdminRoute() {
  const { user } = useAuthController();
  const { t } = useLanguage();
  return user?.role === "admin" ? (
    <Outlet />
  ) : (
    <div>
      <h1>{t("Access restricted", "الوصول مقيد")}</h1>
      <p>
        {t(
          "Administrator access is required.",
          "يتطلب الوصول صلاحيات الإدارة.",
        )}
      </p>
      <Link to="/">{t("Return to store", "العودة للمتجر")}</Link>
    </div>
  );
}
export default function App() {
  const { t } = useLanguage();
  const refresh = useAuthController((s) => s.refresh);
  useEffect(() => {
    void refresh();
    return authRepository.onChange(() => void refresh());
  }, [refresh]);
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense
        fallback={
          <p className="page-container" role="status">
            {t("Loading…", "جارٍ التحميل…")}
          </p>
        }
      >
        <Routes>
          <Route path="/" element={<Storefront />} />
          <Route element={<PageLayout />}>
            <Route path="journal" element={<JournalPage />} />
            <Route path="shop" element={<CatalogPage />} />
            <Route path="products/:id" element={<ProductPage />} />
            <Route path="categories/:slug" element={<CatalogPage />} />
            <Route path="shops" element={<ShopsPage />} />
            <Route path="shops/:slug" element={<CatalogPage />} />
            <Route path="cart" element={<ShoppingBagPage />} />
            <Route path="wishlist" element={<ShoppingBagPage wishlist />} />
            <Route path="login" element={<AuthPage />} />
            <Route path="register" element={<AuthPage register />} />
            <Route element={<ProtectedRoute />}>
              <Route path="account" element={<AccountPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route element={<AdminRoute />}>
                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<AdminOverview />} />
                  <Route
                    path="products"
                    element={<ResourceManager resource="products" />}
                  />
                  <Route
                    path="categories"
                    element={<ResourceManager resource="categories" />}
                  />
                  <Route
                    path="shops"
                    element={<ResourceManager resource="shops" />}
                  />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="payments" element={<AdminPayments />} />
                </Route>
              </Route>
            </Route>
            <Route
              path="*"
              element={
                <div>
                  <h1>{t("Page not found", "الصفحة غير موجودة")}</h1>
                  <Link to="/">{t("Back to home", "العودة للرئيسية")}</Link>
                </div>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
