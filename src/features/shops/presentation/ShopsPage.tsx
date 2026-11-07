import { ErrorText } from "../../../shared/components/ErrorText";
import { Link } from "react-router-dom";
import { useShopDirectoryController } from "../controllers/useShopsController";
import { useLanguage } from "../../../core/i18n/i18n";
export function ShopsPage() {
  const { ar, t } = useLanguage();
  const { shops, error, loading } = useShopDirectoryController();
  return (
    <section>
      <span className="eyebrow">
        {t("LITTLE SHOPS, BIG HEARTS", "متاجر صغيرة، قلوب كبيرة")}
      </span>
      <h1>{t("Meet our shops", "اكتشف متاجرنا")}</h1>
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
            <h2>
              {s.name[ar ? "ar" : "en"]} {s.isVerified && "✓"}
            </h2>
            <p>{s.description[ar ? "ar" : "en"]}</p>
            <span>{t("Explore shop →", "اكتشف المتجر ←")}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
