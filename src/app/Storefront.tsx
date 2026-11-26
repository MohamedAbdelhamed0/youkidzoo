import { useEffect, useReducer } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../core/i18n/i18n";
import { useProductController } from "../features/products/controllers/useProductController";
import { categoryPhoto } from "../features/categories/presentation/categoryPhoto";
import { ProductCard } from "../features/products/presentation/ProductCard";
import {
  descendantIds,
  filterProducts,
} from "../features/products/domain/filterProducts";
import {
  effectivePrice,
  isActiveDeal,
} from "../features/products/domain/pricing";
import { ErrorText } from "../shared/components/ErrorText";
import { useStoreCategories } from "../shared/layouts/StoreLayout";
import { StoreOffers } from "./LandingIntro";

const categoryHighlights = [
  "kids-clothing",
  "education-toys",
  "babies",
  "gifts-sets",
];

export default function Storefront() {
  const { ar, t } = useLanguage();
  const { categories: allCategories } = useStoreCategories();
  const categories = allCategories.filter((category) => !category.shopId);
  const { products, error, loading, reload } = useProductController();
  const [priceRevision, refreshPrices] = useReducer(
    (revision: number) => revision + 1,
    0,
  );
  const now = Date.now();
  const deals = products.filter((product) => isActiveDeal(product, now));
  const featuredDeal = deals.find(
    (product) =>
      product.stock > 0 && effectivePrice(product, now) < product.price,
  );
  const deadline = Math.min(
    ...deals.map((product) => Date.parse(product.specialDealEndsAt!)),
  );
  useEffect(() => {
    if (!Number.isFinite(deadline)) return;
    const timer = window.setTimeout(
      refreshPrices,
      Math.max(0, Math.min(deadline - Date.now(), 2_147_483_647)),
    );
    return () => window.clearTimeout(timer);
  }, [deadline, priceRevision]);
  const shortcuts = categoryHighlights.flatMap((slug) =>
    categories.filter((category) => category.slug === slug),
  );
  const browseCategories = [
    ...shortcuts,
    ...categories.filter((category) => !shortcuts.includes(category)),
  ];
  const featuredProducts = filterProducts(
    products,
    categories,
    new URLSearchParams(),
  ).slice(0, 8);

  return (
    <>
      {browseCategories.length > 0 && (
        <section
          className="store-section"
          aria-labelledby="store-categories-title"
        >
          <div className="store-section-heading">
            <h2 id="store-categories-title">
              {t("Shop by category", "تسوّق حسب الفئة")}
            </h2>
            <Link className="store-secondary" to="/shop?filters=open">
              {t("Filter and sort", "التصفية والترتيب")}
            </Link>
          </div>
          <div className="store-shortcuts">
            {browseCategories.map((category) => {
              const banner = categoryPhoto(category);
              const ids = banner
                ? null
                : descendantIds(category.id, categories);
              const photo =
                banner ||
                products.find(
                  (product) =>
                    product.thumbnailUrl &&
                    product.categoryId &&
                    ids?.has(product.categoryId),
                )?.thumbnailUrl;
              const remoteIcon = category.iconUrl.startsWith("https://");
              return (
                <Link key={category.id} to={`/categories/${category.slug}`}>
                  <span className="store-category-art" aria-hidden="true">
                    {photo || remoteIcon ? (
                      <img
                        src={photo || category.iconUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        data-banner={Boolean(banner)}
                      />
                    ) : (
                      category.iconUrl || "✦"
                    )}
                  </span>
                  <span className="store-category-label">
                    {category.name[ar ? "ar" : "en"]}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
      <section className="store-section" aria-labelledby="store-featured-title">
        <div className="store-section-heading">
          <h2 id="store-featured-title">
            {t("Featured products", "منتجات مميزة")}
          </h2>
          <Link className="store-text-link" to="/shop">
            {t("View all products", "عرض جميع المنتجات")}
          </Link>
        </div>
        {loading && (
          <p role="status">{t("Loading products…", "جارٍ تحميل المنتجات…")}</p>
        )}
        {error && (
          <div className="store-feedback" role="alert">
            <p>
              <ErrorText message={error} />
            </p>
            <button className="store-text-link" onClick={reload}>
              {t("Try again", "حاول مجددًا")}
            </button>
          </div>
        )}
        {featuredProducts.length > 0 && (
          <div className="products">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        {!loading && !error && !featuredProducts.length && (
          <p>
            {t(
              "No products available right now.",
              "لا توجد منتجات متاحة حاليًا.",
            )}
          </p>
        )}
      </section>
      {featuredDeal && <StoreOffers product={featuredDeal} now={now} />}
    </>
  );
}
