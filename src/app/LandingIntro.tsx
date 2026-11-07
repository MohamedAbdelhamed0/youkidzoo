import {
  ArrowUpRight,
  Banknote,
  Sparkles,
  Truck,
  Shirt,
  Blocks,
  Gift,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../core/i18n/i18n";
import type { Product } from "../features/products/domain/Product";
import {
  effectivePrice,
  formatMoney,
} from "../features/products/domain/pricing";

interface Props {
  products: Product[];
  deals: Product[];
  seconds: number;
  browseCategory(name: string): void;
}

export function LandingIntro({
  products,
  deals,
  seconds,
  browseCategory,
}: Props) {
  const { ar, t } = useLanguage();
  const clothing = products.filter(
    (p) => p.category === "Kids Clothing" && p.stock > 0,
  );
  const clothingPrice = clothing.length
    ? Math.min(...clothing.map((p) => effectivePrice(p)))
    : null;
  const deal = deals.find((p) => p.stock > 0 && effectivePrice(p) < p.price);
  return (
    <div className="landing-content">
      <section className="joy-hero" aria-labelledby="joy-heading">
        <div className="joy-copy">
          <span className="joy-kicker">
            <Sparkles size={15} />
            {t("SMALL FINDS. BIG HAPPY.", "حاجات صغيرة، فرحة كبيرة")}
          </span>
          <h1
            id="joy-heading"
            aria-label={t(
              "Little things. Big smiles.",
              "كل حاجة صغيرة، وراها ضحكة كبيرة.",
            )}
          >
            {t("Little things.", "كل حاجة صغيرة،")}
            <br />
            <em>{t("Big smiles.", "وراها ضحكة كبيرة.")}</em>
          </h1>
          <p>
            {t(
              "Comfy outfits, curious toys, and gifts they’ll love. Find a little joy for every part of growing up.",
              "لبس مريح، ألعاب تفتح الخيال، وهدايا تفرّحهم. اختيارات حلوة لكل يوم في حكاية طفلك.",
            )}
          </p>
          <div className="joy-actions">
            <Link className="joy-primary" to="/shop">
              {t("Find their next favorite", "اختار فرحتهم الجاية")}
              <ArrowUpRight size={19} />
            </Link>
            <button
              className="joy-secondary"
              onClick={() => browseCategory("Kids Clothing")}
            >
              {t("Explore kids clothing", "اكتشف ملابس الأطفال")}
              <Shirt size={17} />
            </button>
          </div>
          <div className="joy-reassurance">
            <span>
              <Banknote size={17} />
              {t("Pay cash on delivery", "ادفع عند الاستلام")}
            </span>
            <span>
              <Truck size={17} />
              {t("Free shipping over EGP 100", "شحن مجاني فوق ١٠٠ جنيه")}
            </span>
          </div>
        </div>
        <div className="joy-visual">
          <img
            src={`${import.meta.env.BASE_URL}images/youkidzoo-joy-hero.png`}
            alt={t(
              "Two smiling children playing with a wooden airplane and colorful blocks",
              "طفلان سعيدان يلعبان بطائرة خشبية ومكعبات ملونة",
            )}
            width="1536"
            height="1024"
            fetchPriority="high"
          />
          <span className="joy-photo-note">
            <Sparkles size={17} />
            {t("A little more everyday magic", "كل يوم فيه فرحة جديدة")}
          </span>
          <span className="joy-sun" aria-hidden="true">
            ✳
          </span>
        </div>
      </section>
      <div className="joy-discover">
        <button
          className="discover-card discover-clothes"
          onClick={() => browseCategory("Kids Clothing")}
        >
          <span className="discover-icon">
            <Shirt size={31} strokeWidth={1.6} />
          </span>
          <span>
            <small>{t("READY, SET, PLAY", "لبس على قد شقاوتهم")}</small>
            <strong>
              {t("Made for little adventures", "راحة في كل حركة")}
            </strong>
            <span>
              {clothingPrice !== null
                ? t(
                    `Kids clothing from ${formatMoney(clothingPrice, false)}`,
                    `ملابس أطفال تبدأ من ${formatMoney(clothingPrice, true)}`,
                  )
                : t("Explore everyday outfits", "اكتشف ملابس كل يوم")}
            </span>
          </span>
          <ArrowUpRight className="discover-arrow" size={21} />
        </button>
        <button
          className="discover-card discover-toys"
          onClick={() => browseCategory("Education Toys")}
        >
          <span className="discover-icon">
            <Blocks size={31} strokeWidth={1.6} />
          </span>
          <span>
            <small>{t("LET CURIOSITY LEAD", "اللعب بداية الحكاية")}</small>
            <strong>
              {t("Big ideas start with play", "خيالهم ملوش حدود")}
            </strong>
            <span>{t("Discover learning toys", "اكتشف ألعاب التعلّم")}</span>
          </span>
          <ArrowUpRight className="discover-arrow" size={21} />
        </button>
      </div>
      <section className="joy-offer" aria-labelledby="joy-offer-heading">
        <span className="offer-icon" aria-hidden="true">
          <Gift size={32} strokeWidth={1.6} />
        </span>
        <div className="offer-copy">
          <span className="joy-kicker">
            {t("A LITTLE EXTRA JOY", "فرحة أكتر بسعر أحلى")}
          </span>
          <h2 id="joy-offer-heading">
            {deal
              ? t(
                  "Little favorites. Lovely prices.",
                  "حاجات يحبوها، بأسعار تحبّها.",
                )
              : t(
                  "Their next happy discovery awaits.",
                  "فرحتهم الجاية مستنياك.",
                )}
          </h2>
          <p>
            {deal
              ? t(
                  `${deal.name} — now ${formatMoney(effectivePrice(deal), false, deal.currency)}`,
                  `${deal.name_ar} — الآن ${formatMoney(effectivePrice(deal), true, deal.currency)}`,
                )
              : t(
                  "Explore outfits, toys, and thoughtful little gifts.",
                  "اكتشف الملابس والألعاب والهدايا الحلوة.",
                )}
          </p>
        </div>
        {deal && (
          <div className="offer-countdown">
            <small>
              {t("Current offers end in", "العروض الحالية تنتهي خلال")}
            </small>
            <div
              className="joy-clock"
              dir="ltr"
              aria-label={t("Time remaining", "الوقت المتبقي")}
            >
              {[
                Math.floor(seconds / 86400),
                Math.floor(seconds / 3600) % 24,
                Math.floor(seconds / 60) % 60,
                seconds % 60,
              ].map((n, i) => (
                <span key={i}>
                  <b>{String(n).padStart(2, "0")}</b>
                  <small>
                    {
                      (ar
                        ? ["يوم", "ساعة", "دقيقة", "ثانية"]
                        : ["DAYS", "HRS", "MIN", "SEC"])[i]
                    }
                  </small>
                </span>
              ))}
            </div>
          </div>
        )}
        <Link
          className="joy-primary offer-link"
          to={deal ? "/shop?deals=true" : "/shop"}
        >
          {deal
            ? t("Shop the offers", "تسوّق العروض")
            : t("Explore the collection", "اكتشف المجموعة")}
          <ArrowUpRight size={18} />
        </Link>
      </section>
    </div>
  );
}
