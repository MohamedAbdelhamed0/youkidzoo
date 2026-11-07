import { LandingIntro } from "./LandingIntro";
import { CategorySidebar } from "../features/categories/presentation/CategorySidebar";
import { ErrorText } from "../shared/components/ErrorText";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  UserRound,
  Heart,
  ShoppingBag,
  MapPin,
  Headphones,
  ChevronDown,
  ArrowUpRight,
  Menu,
  Truck,
  ShieldCheck,
  Gift,
} from "lucide-react";
import { useLanguage } from "../core/i18n/i18n";
import { useProductController } from "../features/products/controllers/useProductController";
import { useCartController } from "../features/cart/controllers/useCartController";
import { useCategoriesController } from "../features/categories/controllers/useCategoriesController";
import { ProductCard } from "../features/products/presentation/ProductCard";
import { isActiveDeal } from "../features/products/domain/pricing";

export default function Storefront() {
  const navigate = useNavigate();
  const { ar, setAr, t } = useLanguage();
  const { cart, wishes } = useCartController();
  const { products, error, loading, reload } = useProductController();
  const { categories: allCategories, error: categoryError } =
    useCategoriesController();
  const categories = allCategories.filter((c) => !c.shopId);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [mobile, setMobile] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const deals = products.filter((p) => isActiveDeal(p, now));
  const expiry = Math.min(
    ...deals.map((p) => Date.parse(p.specialDealEndsAt!)),
  );
  const seconds = Number.isFinite(expiry)
    ? Math.max(0, Math.floor((expiry - now) / 1000))
    : 0;
  const count = Object.values(cart).reduce((sum, n) => sum + n, 0);
  const selected = categories.find((c) => c.id === category);
  const filtered = products.filter(
    (p) =>
      (!category || p.categoryId === category) &&
      `${p.name} ${p.name_ar}`.toLowerCase().includes(query.toLowerCase()),
  );
  const browse = (id = "") => {
    setCategory(id);
    setMobile(false);
    document
      .getElementById("collection")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  const categoryByName = (name: string) =>
    categories.find((c) => c.name.en === name)?.id || "";
  const services = [
    {
      Icon: Truck,
      title: t("A little joy, delivered", "سعادة تصل إلى بابك"),
      text: t("Free shipping over EGP 100", "شحن مجاني فوق ١٠٠ جنيه"),
    },
    {
      Icon: ShieldCheck,
      title: t("Made for little ones", "صنع للصغار"),
      text: t("Thoughtfully selected & loved", "اختيارات بعناية وحب"),
    },
    {
      Icon: Gift,
      title: t("Gifts that spark wonder", "هدايا تلهم الخيال"),
      text: t("For every little milestone", "لكل لحظة مميزة"),
    },
  ];
  return (
    <>
      <header className="header">
        <nav
          className="nav"
          aria-label={t("Main navigation", "التنقل الرئيسي")}
        >
          <button
            className="mobile-menu icon"
            onClick={() => setMobile(!mobile)}
            aria-label={t("Toggle categories", "عرض الفئات")}
            aria-expanded={mobile}
          >
            <Menu size={20} />
          </button>
          {[
            [t("Home", "الرئيسية"), "/"],
            [t("Shop", "المتجر"), "/shop"],
            [t("Products", "المنتجات"), "/shop"],
            [t("Pages", "الصفحات"), "/shops"],
            [t("Blog", "المدونة"), "/journal"],
          ].map(([name, path]) => (
            <Link key={name} to={path}>
              {name}
              <ChevronDown size={11} />
            </Link>
          ))}
        </nav>
        <Link className="logo" to="/" aria-label="YouKidZoo">
          {"YouKidZoo".split("").map((c, i) => (
            <span
              key={i}
              style={{
                color: ["#6fd0dc", "#f9ce61", "#b6d86d", "#ff8bb3"][i % 4],
              }}
            >
              {c}
            </span>
          ))}
        </Link>
        <div className="header-actions">
          <form
            className="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/shop?q=${encodeURIComponent(query)}`);
            }}
          >
            <input
              aria-label={t("Search products", "بحث المنتجات")}
              placeholder={t("Search your little joys…", "ابحث عن السعادة…")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button aria-label={t("Search", "بحث")}>
              <Search size={17} />
            </button>
          </form>
          <Link
            className="icon"
            aria-label={t("Account", "حسابي")}
            to="/account"
          >
            <UserRound size={19} />
          </Link>
          <Link
            className="icon counter"
            aria-label={t("Wishlist", "المفضلة")}
            to="/wishlist"
          >
            <Heart size={19} />
            <b>{wishes.length}</b>
          </Link>
          <Link
            className="icon counter"
            aria-label={t("Shopping bag", "حقيبة التسوق")}
            to="/cart"
          >
            <ShoppingBag size={19} />
            <b>{count}</b>
          </Link>
        </div>
      </header>
      <div className="utility">
        <div>
          <Link to="/shops">
            <MapPin size={13} />
            {t("Our Shops", "متاجرنا")}
          </Link>
        </div>
        <p>
          {t(
            "Cash on Delivery • Free Shipping On Orders Over EGP 100",
            "الدفع عند الاستلام • شحن مجاني للطلبات فوق ١٠٠ جنيه",
          )}
        </p>
        <div>
          <span>
            <Headphones size={14} />
            {t("A little help? We’re here for you", "نحن هنا لمساعدتك")}
          </span>
          <button onClick={() => setAr(!ar)}>
            {ar ? "English" : "العربية"}
          </button>
        </div>
      </div>
      <main>
        <section className="landing-layout">
          <CategorySidebar
            categories={categories}
            error={categoryError}
            open={mobile}
            onToggle={() => setMobile(!mobile)}
            onSelect={browse}
          />
          <LandingIntro
            products={products}
            deals={deals}
            seconds={seconds}
            browseCategory={(name) => browse(categoryByName(name))}
          />
        </section>
        <section className="benefits">
          {services.map(({ Icon, title, text }) => (
            <div key={title}>
              <Icon size={27} />
              <span>
                <strong>{title}</strong>
                <small>{text}</small>
              </span>
            </div>
          ))}
        </section>
        <section id="collection" className="collection">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {t("A WORLD OF LITTLE WONDERS", "عالم من العجائب الصغيرة")}
              </span>
              <h2>
                {selected
                  ? selected.name[ar ? "ar" : "en"]
                  : t("Their next favorite thing", "أشياؤهم المفضلة القادمة")}
              </h2>
            </div>
            <Link to="/shop">
              {t("View all treasures", "عرض جميع المنتجات")}
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="filters">
            <button
              className={!category ? "selected" : ""}
              onClick={() => setCategory("")}
            >
              {t("All the good stuff", "كل المنتجات")}
            </button>
            {categories
              .filter((c) =>
                [
                  "Kids Clothing",
                  "Babies",
                  "Kids",
                  "Education Toys",
                  "Gifts & Sets",
                ].includes(c.name.en),
              )
              .map((c) => (
                <button
                  key={c.id}
                  className={category === c.id ? "selected" : ""}
                  onClick={() => setCategory(c.id)}
                >
                  {c.name[ar ? "ar" : "en"]}
                </button>
              ))}
          </div>
          {loading && (
            <p role="status">
              {t("Finding little wonders…", "جارٍ تحميل المنتجات…")}
            </p>
          )}
          {error && (
            <div role="alert">
              <p>
                <ErrorText message={error} />
              </p>
              <button onClick={reload}>{t("Try again", "حاول مجددًا")}</button>
            </div>
          )}
          <div className="products">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {!filtered.length && !error && !loading && (
            <div className="empty">
              {t(
                "No little treasures found. Try another search.",
                "لا توجد نتائج. جرب بحثًا آخر.",
              )}
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("");
                }}
              >
                {t("Clear filters", "مسح الفلاتر")}
              </button>
            </div>
          )}
        </section>
      </main>
      <footer>
        <Link className="logo" to="/">
          YouKidZoo<span>✳</span>
        </Link>
        <p>
          {t(
            "A little world of wonder. A whole lot of love.",
            "عالم صغير من الدهشة، والكثير من الحب.",
          )}
        </p>
        <small>© {new Date().getFullYear()} YouKidZoo</small>
      </footer>
    </>
  );
}
