import { useLayoutEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useLanguage } from "../../core/i18n/i18n";
import { useCartController } from "../../features/cart/controllers/useCartController";
import { useCategoriesController } from "../../features/categories/controllers/useCategoriesController";
import { categoryDepth } from "../../features/categories/domain/tree";
import { ErrorText } from "../components/ErrorText";
import { LandingIntro } from "../../app/LandingIntro";

export function useStoreCategories() {
  return useOutletContext<ReturnType<typeof useCategoriesController>>();
}

export function StoreLayout() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const categoryRoute = useMatch("/categories/:slug");
  const path = location.pathname.replace(/\/$/, "") || "/";
  const home = path === "/";
  const browsing =
    home ||
    path === "/shop" ||
    path.startsWith("/categories/") ||
    path.startsWith("/shops/");
  const split = browsing || path === "/contact";
  const main = useRef<HTMLElement>(null);
  const previousPath = useRef(location.pathname);
  const categoryQuery = useCategoriesController();
  const selectedCategory = categoryQuery.categories.find(
    (category) => category.slug === categoryRoute?.params.slug,
  );
  const categories = categoryQuery.categories.filter(
    (category) => !category.shopId,
  );
  const count = useCartController((state) =>
    Object.values(state.cart).reduce((total, quantity) => total + quantity, 0),
  );
  const wishes = useCartController((state) => state.wishes.length);

  useLayoutEffect(() => {
    if (previousPath.current !== location.pathname) {
      document.documentElement.scrollTop = 0;
      main.current?.focus({ preventScroll: true });
      previousPath.current = location.pathname;
    }
  }, [location.pathname]);

  return (
    <div className="store">
      <a className="store-skip" href="#store-main">
        {t("Skip to content", "انتقل إلى المحتوى")}
      </a>
      <p className="store-announcement">
        {t("Cash on delivery", "الدفع عند الاستلام")}{" "}
        <span aria-hidden="true">·</span>{" "}
        {t(
          "Free shipping on orders over EGP 100",
          "شحن مجاني للطلبات فوق ١٠٠ جنيه",
        )}
      </p>
      <StoreHeader
        key={location.key}
        categories={categories}
        categoryError={categoryQuery.error}
        categoriesLoading={categoryQuery.loading}
        reloadCategories={categoryQuery.reload}
        count={count}
        wishes={wishes}
        initialQuery={new URLSearchParams(location.search).get("q") || ""}
        onSearch={(query) =>
          navigate(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop")
        }
      />
      <main
        className={`store-frame store-main${split ? " store-split" : ""}`}
        id="store-main"
        tabIndex={-1}
        ref={main}
      >
        {split &&
          (!categoryRoute || !categoryQuery.loading || selectedCategory) && (
            <LandingIntro home={home} category={selectedCategory} />
          )}
        <div className={split ? "store-browse-pane" : undefined}>
          <Outlet context={categoryQuery} />
          {browsing && (
            <div className="store-order-bar">
              <Link
                className="store-primary"
                to={count ? "/cart" : home ? "/shop" : "/cart"}
              >
                {count
                  ? t(`View bag (${count})`, `عرض الحقيبة (${count})`)
                  : home
                    ? t("Start shopping", "ابدأ التسوّق")
                    : t("View bag", "عرض الحقيبة")}
              </Link>
            </div>
          )}
        </div>
      </main>
      <footer className="store-footer">
        <div className="store-frame">
          <Wordmark />
          <nav aria-label={t("Footer navigation", "روابط التذييل")}>
            <Link to="/shops">{t("Our shops", "متاجرنا")}</Link>
            <Link to="/journal">{t("Journal", "المدونة")}</Link>
            <Link to="/orders">{t("My orders", "طلباتي")}</Link>
            <Link to="/contact">
              {t("Store information", "معلومات المتجر")}
            </Link>
          </nav>
          <small>© {new Date().getFullYear()} YouKidZoo</small>
        </div>
      </footer>
    </div>
  );
}

export function Wordmark() {
  return (
    <Link className="store-wordmark" to="/" aria-label="YouKidZoo" dir="ltr">
      You<span>Kid</span>Zoo
      <span className="store-wordmark-dot" aria-hidden="true">
        .
      </span>
    </Link>
  );
}

type HeaderProps = {
  categories: ReturnType<typeof useCategoriesController>["categories"];
  categoryError: string;
  categoriesLoading: boolean;
  reloadCategories: () => void;
  count: number;
  wishes: number;
  initialQuery: string;
  onSearch: (query: string) => void;
};

function StoreHeader({
  categories,
  categoryError,
  categoriesLoading,
  reloadCategories,
  count,
  wishes,
  initialQuery,
  onSearch,
}: HeaderProps) {
  const { ar, setAr, t } = useLanguage();
  const [panel, setPanel] = useState<"menu" | "search" | null>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const firstMenuLink = useRef<HTMLAnchorElement>(null);

  function closePanel() {
    (panel === "menu" ? menuTrigger : searchTrigger).current?.focus();
    setPanel(null);
  }

  useLayoutEffect(() => {
    if (panel === "search") searchInput.current?.focus();
    if (panel === "menu") firstMenuLink.current?.focus();
  }, [panel]);

  return (
    <header
      className="store-header"
      onKeyDown={(event) => {
        if (event.key === "Escape" && panel) closePanel();
      }}
    >
      <div className="store-frame store-header-row">
        <nav
          className="store-header-nav"
          aria-label={t("Main navigation", "التنقل الرئيسي")}
        >
          <button
            className="store-icon"
            ref={menuTrigger}
            aria-label={t("Browse categories and links", "عرض الفئات والروابط")}
            aria-expanded={panel === "menu"}
            aria-controls="store-menu"
            onClick={() => setPanel(panel === "menu" ? null : "menu")}
          >
            {panel === "menu" ? <X /> : <Menu />}
          </button>
          <NavLink to="/shop">{t("Shop", "المتجر")}</NavLink>
          <NavLink to="/shops">{t("Our shops", "متاجرنا")}</NavLink>
          <NavLink to="/contact">{t("Contact", "تواصل معنا")}</NavLink>
        </nav>
        <Wordmark />
        <div className="store-header-actions">
          <button
            className="store-icon"
            ref={searchTrigger}
            aria-label={t("Open search", "فتح البحث")}
            aria-expanded={panel === "search"}
            aria-controls="store-search"
            onClick={() => setPanel(panel === "search" ? null : "search")}
          >
            {panel === "search" ? <X /> : <Search />}
          </button>
          <Link
            className="store-icon store-account"
            to="/account"
            aria-label={t("Account", "حسابي")}
          >
            <UserRound />
          </Link>
          <Link
            className="store-icon"
            to="/wishlist"
            aria-label={t(`Wishlist (${wishes})`, `المفضلة (${wishes})`)}
          >
            <Heart />
            {wishes > 0 && <b aria-hidden="true">{wishes}</b>}
          </Link>
          <Link
            className="store-icon"
            to="/cart"
            aria-label={t(`Bag (${count})`, `الحقيبة (${count})`)}
          >
            <ShoppingBag />
            {count > 0 && <b aria-hidden="true">{count}</b>}
          </Link>
          <button className="store-language" onClick={() => setAr(!ar)}>
            {ar ? "English" : "العربية"}
          </button>
        </div>
      </div>
      <nav
        className="store-panel"
        id="store-menu"
        hidden={panel !== "menu"}
        aria-label={t("Browse the store", "تصفح المتجر")}
      >
        <div className="store-frame store-menu-grid">
          <div>
            <p>{t("Store", "المتجر")}</p>
            <Link to="/shop" ref={firstMenuLink}>
              {t("All products", "جميع المنتجات")}
            </Link>
            <Link to="/shops">{t("Our shops", "متاجرنا")}</Link>
            <Link to="/account">{t("Account", "حسابي")}</Link>
            <Link to="/journal">{t("Journal", "المدونة")}</Link>
            <Link to="/contact">
              {t("Store information", "معلومات المتجر")}
            </Link>
            <button
              className="store-text-link store-menu-language"
              onClick={() => setAr(!ar)}
            >
              {ar ? "English" : "العربية"}
            </button>
          </div>
          <div>
            <p>{t("Categories", "الفئات")}</p>
            {categoriesLoading && (
              <p role="status">
                {t("Loading categories…", "جارٍ تحميل الفئات…")}
              </p>
            )}
            {categoryError && (
              <div role="alert">
                <ErrorText message={categoryError} />{" "}
                <button className="store-text-link" onClick={reloadCategories}>
                  {t("Try again", "حاول مجددًا")}
                </button>
              </div>
            )}
            <ul>
              {categories.map((category) => (
                <li
                  key={category.id}
                  style={{
                    paddingInlineStart:
                      Math.min(categoryDepth(category, categories), 4) * 12,
                  }}
                >
                  <Link to={`/categories/${category.slug}`}>
                    {category.name[ar ? "ar" : "en"]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
      <div
        className="store-panel"
        id="store-search"
        hidden={panel !== "search"}
      >
        <form
          className="store-frame store-search-form"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(searchInput.current?.value.trim() || "");
          }}
        >
          <input
            ref={searchInput}
            type="search"
            name="q"
            aria-label={t("Search products", "بحث المنتجات")}
            placeholder={t("Search products", "ابحث عن المنتجات")}
            defaultValue={initialQuery}
          />
          <button className="store-primary" type="submit">
            {t("Search", "بحث")}
          </button>
        </form>
      </div>
    </header>
  );
}
