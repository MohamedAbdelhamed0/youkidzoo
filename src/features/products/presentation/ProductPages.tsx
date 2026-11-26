import { formatMoney } from "../domain/pricing";
import { ErrorText } from "../../../shared/components/ErrorText";
import { ProductCard } from "./ProductCard";
import { useEffect, useState } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useLanguage } from "../../../core/i18n/i18n";
import { useProductController } from "../controllers/useProductController";
import { useCartController } from "../../cart/controllers/useCartController";
import {
  useShopDirectoryController,
  useShopCategoryIds,
} from "../../shops/controllers/useShopsController";
import { effectivePrice } from "../domain/pricing";
import { filterProducts } from "../domain/filterProducts";
import { ageLabel, genderLabel } from "../../../core/i18n/labels";
import { useStoreCategories } from "../../../shared/layouts/StoreLayout";
import { StoreDialog } from "../../../shared/components/StoreDialog";
import { SlidersHorizontal } from "lucide-react";

const catalogFilterKeys = [
  "q",
  "category",
  "age",
  "max",
  "sort",
  "gender",
  "deals",
  "available",
];

export function CatalogPage() {
  const { slug } = useParams();
  const { ar, t } = useLanguage();
  const { products, error, loading } = useProductController();
  const [search, setSearch] = useSearchParams();
  const [draft, setDraft] = useState<URLSearchParams | null>(() =>
    search.get("filters") === "open" ? new URLSearchParams(search) : null,
  );
  const {
    categories,
    error: categoryError,
    loading: categoriesLoading,
  } = useStoreCategories();
  const {
    shops,
    error: shopError,
    loading: shopsLoading,
  } = useShopDirectoryController();
  const location = useLocation();
  const isShopRoute = location.pathname.startsWith("/shops/");
  const shop = isShopRoute ? shops.find((s) => s.slug === slug) : undefined;
  const selectedCategory = isShopRoute
    ? undefined
    : categories.find((c) => c.slug === slug);
  const { ids: adoptedCategoryIds, error: assignmentError } =
    useShopCategoryIds(shop?.id);
  const dataError = categoryError || shopError;
  const filtersLoading = categoriesLoading || shopsLoading;
  const unresolvedPage = Boolean(slug && !(shop || selectedCategory));
  const unknownPage =
    unresolvedPage &&
    !(isShopRoute
      ? shopsLoading || shopError
      : categoriesLoading || categoryError);
  const formValues = draft || search;
  const query = formValues.get("q") || "";
  const category = formValues.get("category") || selectedCategory?.id || "";
  const age = formValues.get("age") || "";
  const deals = formValues.get("deals") === "true";
  const sort = formValues.get("sort") || "";
  const update = (key: string, value: string) => {
    setDraft((old) => {
      if (!old) return old;
      const next = new URLSearchParams(old);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  };
  const closeFilters = () => {
    setDraft(null);
    if (search.has("filters")) {
      const next = new URLSearchParams(search);
      next.delete("filters");
      setSearch(next, { replace: true });
    }
  };
  const visible = unresolvedPage
    ? []
    : filterProducts(
        products,
        categories,
        search,
        shop?.id,
        selectedCategory?.id,
        ar ? "ar" : "en",
      );
  if (unknownPage)
    return (
      <section className="store-page">
        <h1>{t("Page not found", "الصفحة غير موجودة")}</h1>
        <Link to={isShopRoute ? "/shops" : "/shop"}>
          {t("Back to the store", "العودة للمتجر")}
        </Link>
      </section>
    );
  return (
    <section className="store-page">
      {slug && (
        <Link className="store-text-link" to={isShopRoute ? "/shops" : "/"}>
          {isShopRoute
            ? t("Back to shops", "العودة إلى المتاجر")
            : t("Back to categories", "العودة إلى الفئات")}
        </Link>
      )}
      {shop?.coverBannerUrl && (
        <img className="shop-cover" src={shop.coverBannerUrl} alt="" />
      )}
      <h1>
        {shop
          ? shop.name[ar ? "ar" : "en"]
          : selectedCategory
            ? selectedCategory.name[ar ? "ar" : "en"]
            : t("Shop all products", "تسوّق جميع المنتجات")}
      </h1>
      {shop && <p>{shop.description[ar ? "ar" : "en"]}</p>}
      <button
        type="button"
        aria-haspopup="dialog"
        className="store-secondary store-catalog-filter"
        onClick={() => setDraft(new URLSearchParams(search))}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        {t("Filter and sort", "التصفية والترتيب")}
      </button>
      {draft && (
        <StoreDialog
          title={t("Filter and sort", "التصفية والترتيب")}
          close={closeFilters}
        >
          <form
            className="catalog-filters"
            onSubmit={(event) => {
              event.preventDefault();
              const next = new URLSearchParams(draft);
              next.delete("filters");
              setDraft(null);
              setSearch(next, { replace: search.has("filters") });
            }}
          >
            <label>
              {t("Search", "بحث")}
              <input
                value={query}
                onChange={(e) => update("q", e.target.value)}
                placeholder={t(
                  "Search toys & essentials",
                  "ابحث عن الألعاب والأساسيات",
                )}
              />
            </label>
            <label>
              {t("Category", "الفئة")}
              <select
                value={category}
                onChange={(e) => update("category", e.target.value)}
              >
                <option value="">{t("All categories", "كل الفئات")}</option>
                {categories
                  .filter((c) =>
                    shop
                      ? c.shopId === shop.id ||
                        adoptedCategoryIds.includes(c.id) ||
                        products.some(
                          (p) => p.shopId === shop.id && p.categoryId === c.id,
                        )
                      : !c.shopId,
                  )
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name[ar ? "ar" : "en"]}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              {t("Age", "العمر")}
              <select
                value={age}
                onChange={(e) => update("age", e.target.value)}
              >
                <option value="">{t("Any age", "كل الأعمار")}</option>
                {[
                  "0-6m",
                  "6-12m",
                  "1-3y",
                  "4-6y",
                  "7-9y",
                  "10-12y",
                  "all-ages",
                ].map((a) => (
                  <option key={a} value={a}>
                    {ageLabel(a, ar)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("Max price", "أعلى سعر")}
              <input
                type="number"
                min="0"
                value={formValues.get("max") || ""}
                onChange={(e) => update("max", e.target.value)}
              />
            </label>
            <label>
              {t("Sort", "ترتيب")}
              <select
                value={sort}
                onChange={(e) => update("sort", e.target.value)}
              >
                <option value="">{t("Featured", "مميز")}</option>
                <option value="price-low">
                  {t("Price: low to high", "السعر: تصاعدي")}
                </option>
                <option value="price-high">
                  {t("Price: high to low", "السعر: تنازلي")}
                </option>
                <option value="newest">{t("Newest", "الأحدث")}</option>
                <option value="oldest">{t("Oldest", "الأقدم")}</option>
                <option value="name-asc">
                  {t("Name: A to Z", "الاسم: تصاعدي")}
                </option>
                <option value="name-desc">
                  {t("Name: Z to A", "الاسم: تنازلي")}
                </option>
              </select>
            </label>
            <label>
              {t("Designed for", "مخصص لـ")}
              <select
                value={formValues.get("gender") || ""}
                onChange={(e) => update("gender", e.target.value)}
              >
                <option value="">{t("Everyone", "الجميع")}</option>
                {["boy", "girl", "unisex"].map((value) => (
                  <option key={value} value={value}>
                    {genderLabel(value, ar)}
                  </option>
                ))}
              </select>
            </label>
            <label className="radio-label">
              <input
                type="checkbox"
                checked={deals}
                onChange={(e) =>
                  update("deals", e.target.checked ? "true" : "")
                }
              />
              {t("Special deals", "عروض مميزة")}
            </label>
            <label className="radio-label">
              <input
                type="checkbox"
                checked={formValues.get("available") === "true"}
                onChange={(event) =>
                  update("available", event.target.checked ? "true" : "")
                }
              />
              {t("In stock only", "المتوفر فقط")}
            </label>
            <div className="store-dialog-actions">
              <button
                className="store-text-link"
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(draft);
                  catalogFilterKeys.forEach((key) => next.delete(key));
                  setDraft(next);
                }}
              >
                {t("Clear filters", "مسح الفلاتر")}
              </button>
              <button className="store-primary" type="submit">
                {t("Show results", "عرض النتائج")}
              </button>
            </div>
          </form>
        </StoreDialog>
      )}
      {(error || dataError || assignmentError) && (
        <p role="alert">
          <ErrorText message={error || dataError || assignmentError} />
        </p>
      )}
      {(loading || filtersLoading) && (
        <p role="status">
          {t("Finding little wonders…", "جارٍ تحميل المنتجات…")}
        </p>
      )}
      {!loading && !filtersLoading && !error && !dataError && (
        <p className="store-result-count" role="status">
          {ar
            ? `${visible.length} منتج`
            : `${visible.length} ${visible.length === 1 ? "product" : "products"}`}
        </p>
      )}
      <div className="products">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {!visible.length &&
        !loading &&
        !filtersLoading &&
        !error &&
        !dataError && (
          <p>
            {t(
              "No products match your filters.",
              "لا توجد منتجات تطابق الفلاتر.",
            )}
          </p>
        )}
    </section>
  );
}
export function ProductPage() {
  const { id } = useParams();
  const { ar, t } = useLanguage();
  const { products, error, loading } = useProductController();
  const { add, wishes, setWishes, cart } = useCartController();
  const [quantity, setQuantity] = useState(1);
  const [photo, setPhoto] = useState("");
  const [message, setMessage] = useState("");
  const p = products.find((x) => x.id === id);
  useEffect(() => {
    setPhoto("");
    setQuantity(1);
    setMessage("");
  }, [id]);
  if (error)
    return (
      <p role="alert">
        <ErrorText message={error} />
      </p>
    );
  if (!p)
    return (
      <p role={loading ? "status" : undefined}>
        {loading
          ? t("Loading product…", "جارٍ تحميل المنتج…")
          : t("Product not found.", "المنتج غير موجود.")}
      </p>
    );
  const photos = [p.thumbnailUrl, ...(p.galleryUrls || [])].filter(
    Boolean,
  ) as string[];
  return (
    <section className="store-page">
      <Link className="store-text-link" to="/shop">
        {t("Back to all products", "العودة لجميع المنتجات")}
      </Link>
      <div className="product-detail">
        <div>
          <div className="detail-picture">
            {photo || p.thumbnailUrl ? (
              <img
                src={photo || p.thumbnailUrl}
                alt={ar ? p.name_ar : p.name}
              />
            ) : (
              <span>{p.emoji}</span>
            )}
          </div>
          <div className="gallery">
            {photos.map((url, i) => (
              <button
                key={url}
                onClick={() => setPhoto(url)}
                aria-label={t(`Photo ${i + 1}`, `صورة ${i + 1}`)}
                aria-pressed={(photo || p.thumbnailUrl) === url}
              >
                <img src={url} alt="" />
              </button>
            ))}
          </div>
        </div>
        <div className="stack">
          {(p.brand || p.category) && (
            <span className="store-product-category">
              {p.brand || (ar ? p.categoryNameAr || p.category : p.category)}
            </span>
          )}
          <h1>{ar ? p.name_ar : p.name}</h1>
          <h2>
            {formatMoney(effectivePrice(p), ar, p.currency)}{" "}
            {p.discountPrice != null && effectivePrice(p) < p.price && (
              <del>{formatMoney(p.price, ar, p.currency)}</del>
            )}
          </h2>
          <p>{p.description?.[ar ? "ar" : "en"]}</p>
          <dl>
            <dt>{t("Age group", "الفئة العمرية")}</dt>
            <dd>{ageLabel(p.ageGroup || "all-ages", ar)}</dd>
            <dt>{t("Designed for", "مخصص لـ")}</dt>
            <dd>{genderLabel(p.genderTarget, ar)}</dd>
            <dt>{t("Availability", "التوفر")}</dt>
            <dd>
              {p.stock} {t("in stock", "في المخزون")}
            </dd>
            <dt>SKU</dt>
            <dd>{p.sku}</dd>
            {p.dimensions && (
              <>
                <dt>{t("Dimensions / weight", "الأبعاد / الوزن")}</dt>
                <dd>
                  {p.dimensions.widthCm} × {p.dimensions.heightCm}{" "}
                  {t("cm", "سم")} · {p.dimensions.weightKg} {t("kg", "كجم")}
                </dd>
              </>
            )}
            {p.material?.[ar ? "ar" : "en"] && (
              <>
                <dt>{t("Material", "الخامة")}</dt>
                <dd>{p.material[ar ? "ar" : "en"]}</dd>
              </>
            )}
          </dl>
          {p.safetyWarnings?.[ar ? "ar" : "en"] && (
            <p className="safety-note">{p.safetyWarnings[ar ? "ar" : "en"]}</p>
          )}
          <label className="inline-label">
            {t("Quantity", "الكمية")}
            <input
              type="number"
              min={1}
              max={p.stock}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>
          <button
            className="store-primary"
            disabled={
              !p.stock ||
              !Number.isInteger(quantity) ||
              quantity < 1 ||
              quantity + (cart[p.id] || 0) > p.stock
            }
            onClick={() => {
              add(p.id, quantity, p.stock);
              setMessage(
                t("Added to your little bag.", "تمت الإضافة لحقيبتك."),
              );
            }}
          >
            {p.stock
              ? t("Add to bag", "أضف للحقيبة")
              : t("Sold out", "نفد المخزون")}
          </button>
          <button
            className="store-secondary"
            aria-pressed={wishes.includes(p.id)}
            onClick={() =>
              setWishes((old) =>
                old.includes(p.id)
                  ? old.filter((x) => x !== p.id)
                  : [...old, p.id],
              )
            }
          >
            {wishes.includes(p.id)
              ? t("Saved ♥", "محفوظ ♥")
              : t("Save to wishlist ♡", "حفظ في المفضلة ♡")}
          </button>
          {message && <p role="status">{message}</p>}
          <Link className="store-text-link" to="/cart">
            {t("View your bag", "عرض الحقيبة")}
          </Link>
        </div>
      </div>
      <h2>{t("More little wonders", "المزيد من العجائب الصغيرة")}</h2>
      <div className="products">
        {products
          .filter((x) => x.id !== p.id && x.category === p.category)
          .slice(0, 4)
          .map((x) => (
            <ProductCard key={x.id} product={x} />
          ))}
      </div>
    </section>
  );
}
