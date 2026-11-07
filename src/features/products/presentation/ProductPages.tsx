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
  useShopsController,
  useShopCategoryIds,
} from "../../shops/controllers/useShopsController";
import { effectivePrice } from "../domain/pricing";
import { filterProducts } from "../domain/filterProducts";
import { ageLabel, genderLabel } from "../../../core/i18n/labels";
export function CatalogPage() {
  const { slug } = useParams();
  const { ar, t } = useLanguage();
  const { products, error, loading } = useProductController();
  const [search, setSearch] = useSearchParams();
  const {
    categories,
    shops,
    error: dataError,
    loading: filtersLoading,
  } = useShopsController();
  const location = useLocation();
  const shop = shops.find((s) => s.slug === slug);
  const selectedCategory = categories.find((c) => c.slug === slug);
  const { ids: adoptedCategoryIds, error: assignmentError } =
    useShopCategoryIds(shop?.id);
  const isShopRoute = location.pathname.startsWith("/shops/");
  const unknownPage = Boolean(
    slug && !filtersLoading && !(isShopRoute ? shop : selectedCategory),
  );
  const query = search.get("q") || "";
  const category = search.get("category") || selectedCategory?.id || "";
  const age = search.get("age") || "";
  const deals = search.get("deals") === "true";
  const sort = search.get("sort") || "";
  const update = (key: string, value: string) => {
    setSearch((old) => {
      const next = new URLSearchParams(old);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  };
  const visible = unknownPage
    ? []
    : filterProducts(
        products,
        categories,
        search,
        shop?.id,
        selectedCategory?.id,
      );
  if (unknownPage)
    return (
      <section>
        <h1>{t("Page not found", "الصفحة غير موجودة")}</h1>
        <Link to={isShopRoute ? "/shops" : "/shop"}>
          {t("Back to the store", "العودة للمتجر")}
        </Link>
      </section>
    );
  return (
    <section>
      {shop?.coverBannerUrl && (
        <img className="shop-cover" src={shop.coverBannerUrl} alt="" />
      )}
      <span className="eyebrow">
        {t("A WORLD OF LITTLE WONDERS", "عالم من العجائب الصغيرة")}
      </span>
      <h1>
        {shop
          ? shop.name[ar ? "ar" : "en"]
          : selectedCategory
            ? selectedCategory.name[ar ? "ar" : "en"]
            : t("Find their next favorite", "اكتشف المفضل لديهم")}
      </h1>
      {shop && <p>{shop.description[ar ? "ar" : "en"]}</p>}
      <form className="catalog-filters" onSubmit={(e) => e.preventDefault()}>
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
          <select value={age} onChange={(e) => update("age", e.target.value)}>
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
            value={search.get("max") || ""}
            onChange={(e) => update("max", e.target.value)}
          />
        </label>
        <label>
          {t("Sort", "ترتيب")}
          <select value={sort} onChange={(e) => update("sort", e.target.value)}>
            <option value="">{t("Featured", "مميز")}</option>
            <option value="price-low">
              {t("Price: low to high", "السعر: تصاعدي")}
            </option>
            <option value="price-high">
              {t("Price: high to low", "السعر: تنازلي")}
            </option>
            <option value="newest">{t("Newest", "الأحدث")}</option>
          </select>
        </label>
        <label className="radio-label">
          {t("Designed for", "مخصص لـ")}
          <select
            value={search.get("gender") || ""}
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
            onChange={(e) => update("deals", e.target.checked ? "true" : "")}
          />
          {t("Special deals", "عروض مميزة")}
        </label>
      </form>
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
      <p>
        {visible.length} {t("little treasures", "منتج")}
      </p>
      <div className="products">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {!visible.length && !loading && !filtersLoading && (
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
      <p>
        {loading
          ? t("Loading product…", "جارٍ تحميل المنتج…")
          : t("Product not found.", "المنتج غير موجود.")}
      </p>
    );
  const photos = [p.thumbnailUrl, ...(p.galleryUrls || [])].filter(
    Boolean,
  ) as string[];
  return (
    <section>
      <Link to="/shop">← {t("Back to the collection", "العودة للمجموعة")}</Link>
      <div className="product-detail">
        <div>
          <div className="detail-picture" style={{ background: p.color }}>
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
              >
                <img src={url} alt="" />
              </button>
            ))}
          </div>
        </div>
        <div className="stack">
          <span className="eyebrow">{p.brand || p.category}</span>
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
            className="pink-button"
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
          <Link to="/cart">{t("View your bag", "عرض الحقيبة")}</Link>
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
