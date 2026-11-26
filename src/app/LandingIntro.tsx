import { Link } from "react-router-dom";
import { useLanguage } from "../core/i18n/i18n";
import type { Category } from "../features/categories/domain/Category";
import {
  categoryPhoto,
  categoryPhotoSrcSet,
} from "../features/categories/presentation/categoryPhoto";
import type { Product } from "../features/products/domain/Product";
import {
  effectivePrice,
  formatMoney,
} from "../features/products/domain/pricing";

// Keep the homepage preload in index.html aligned with these image candidates.
const heroAsset = `${import.meta.env.BASE_URL}images/youkidzoo-joy-hero`;
const heroSources = [640, 1024, 1536]
  .map((width) => `${heroAsset}-${width}.webp ${width}w`)
  .join(", ");
const heroSizes = "(max-width: 760px) 90vw, max(46vw, calc(150svh - 170px))";

export function LandingIntro({
  home,
  category,
}: {
  home: boolean;
  category?: Category;
}) {
  const { ar, t } = useLanguage();
  const language = ar ? "ar" : "en";
  const photo = category && categoryPhoto(category);
  const prioritize = home || Boolean(category);
  const description = category
    ? category.description[language]
    : t(
        "Kids’ clothing, learning toys, and gifts for growing up.",
        "ملابس للأطفال، وألعاب تعليمية، وهدايا لكل مرحلة.",
      );
  return (
    <div className={category ? "store-hero store-hero-category" : "store-hero"}>
      <div className="store-hero-copy">
        {home && (
          <h1>
            {t("Little things.", "كل حاجة صغيرة،")}{" "}
            <em>{t("Big smiles.", "وراها ضحكة كبيرة.")}</em>
          </h1>
        )}
        {category && (
          <strong className="store-category-hero-title">
            {category.name[language]}
          </strong>
        )}
        {description && <p>{description}</p>}
      </div>
      <img
        src={photo || `${heroAsset}-1024.webp`}
        srcSet={category && photo ? categoryPhotoSrcSet(category) : heroSources}
        sizes={heroSizes}
        alt={
          photo
            ? ""
            : t(
                "Two children playing with a wooden airplane and colorful blocks",
                "طفلان يلعبان بطائرة خشبية ومكعبات ملونة",
              )
        }
        width={photo ? undefined : 1536}
        height={photo ? undefined : 1024}
        loading={prioritize ? "eager" : "lazy"}
        fetchPriority={prioritize ? "high" : undefined}
      />
    </div>
  );
}

export function StoreOffers({
  product,
  now,
}: {
  product: Product;
  now: number;
}) {
  const { ar, t } = useLanguage();

  return (
    <section className="store-offers" aria-labelledby="store-offers-title">
      <div>
        <h2 id="store-offers-title">{t("Special offers", "عروض مميزة")}</h2>
        <p>
          {ar ? product.name_ar : product.name}
          {" · "}
          {formatMoney(effectivePrice(product, now), ar, product.currency)}
        </p>
      </div>
      <Link className="store-text-link" to="/shop?deals=true">
        {t("Shop the offers", "تسوّق العروض")}
      </Link>
    </section>
  );
}
