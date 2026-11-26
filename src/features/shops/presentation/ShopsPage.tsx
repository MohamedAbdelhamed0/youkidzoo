import { ErrorText } from "../../../shared/components/ErrorText";
import { Link } from "react-router-dom";
import { useShopDirectoryController } from "../controllers/useShopsController";
import { useLanguage } from "../../../core/i18n/i18n";
export function ShopsPage() {
  const { ar, t } = useLanguage();
  const { shops, error, loading } = useShopDirectoryController();
  return (
    <section className="store-page">
      <h1>{t("Our shops", "متاجرنا")}</h1>
      {error && (
        <p role="alert">
          <ErrorText message={error} />
        </p>
      )}
      {loading && (
        <p role="status">{t("Loading shops…", "جارٍ تحميل المتاجر…")}</p>
      )}
      <div className="shop-grid">
        {shops.map((s) => (
          <Link className="panel-card" key={s.id} to={`/shops/${s.slug}`}>
            {s.coverBannerUrl ? (
              <img className="shop-cover" src={s.coverBannerUrl} alt="" />
            ) : (
              <div className="shop-placeholder">
                {s.logoUrl ? <img src={s.logoUrl} alt="" /> : "🏡"}
              </div>
            )}
            <div className="store-shop-copy">
              <h2>
                {s.name[ar ? "ar" : "en"]}{" "}
                {s.isVerified && (
                  <span role="img" aria-label={t("Verified", "متجر موثّق")}>
                    ✓
                  </span>
                )}
              </h2>
              <p>{s.description[ar ? "ar" : "en"]}</p>
              <span className="store-text-link">
                {t("Explore shop", "اكتشف المتجر")}
              </span>
            </div>
          </Link>
        ))}
      </div>
      {!shops.length && !error && !loading && (
        <p>
          {t("No shops available right now.", "لا توجد متاجر متاحة حاليًا.")}
        </p>
      )}
    </section>
  );
}
