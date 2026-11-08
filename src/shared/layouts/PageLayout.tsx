import { Link, Outlet } from "react-router-dom";
import { useLanguage } from "../../core/i18n/i18n";
import { useAuthController } from "../../features/auth/controllers/useAuthController";
import { useCartController } from "../../features/cart/controllers/useCartController";
export function PageLayout() {
  const { ar, t, setAr } = useLanguage();
  const user = useAuthController((s) => s.user);
  const count = useCartController((s) =>
    Object.values(s.cart).reduce((a, b) => a + b, 0),
  );
  return (
    <>
      <header className="page-header">
        <Link className="logo" to="/">
          You<span>Kid</span>Zoo
        </Link>
        <nav>
          <Link to="/shop">{t("Shop", "المتجر")}</Link>
          <Link to="/shops">{t("Our shops", "متاجرنا")}</Link>
          <Link to="/orders">{t("My orders", "طلباتي")}</Link>
          {user?.role === "admin" && (
            <Link to="/admin">{t("Dashboard", "لوحة التحكم")}</Link>
          )}
          {user?.role === "shop_owner" && user.isActive && (
            <Link to="/owner/products">
              {t("My shop products", "منتجات متاجري")}
            </Link>
          )}
          <Link to="/cart">
            {t("Bag", "الحقيبة")} ({count})
          </Link>
          <Link to="/account">{user?.fullName || t("Account", "حسابي")}</Link>
          <button onClick={() => setAr(!ar)}>
            {ar ? "English" : "العربية"}
          </button>
        </nav>
      </header>
      <div className="page-container">
        <Outlet />
      </div>
      <footer>
        <Link className="logo" to="/">
          YouKidZoo
        </Link>
        <p>
          {t(
            "A little world of wonder. A whole lot of love.",
            "عالم صغير من الدهشة، والكثير من الحب.",
          )}
        </p>
      </footer>
    </>
  );
}
