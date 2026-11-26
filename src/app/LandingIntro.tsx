import { Link } from "react-router-dom";
import { useLanguage } from "../core/i18n/i18n";
import type { Category } from "../features/categories/domain/Category";
import { categoryPhoto } from "../features/categories/presentation/categoryPhoto";
import type { Product } from "../features/products/domain/Product";
import {
  effectivePrice,
  formatMoney,
} from "../features/products/domain/pricing";

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
        src={
          photo || `${import.meta.env.BASE_URL}images/youkidzoo-joy-hero.png`
        }
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
        fetchPriority="high"
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
