import { formatMoney } from "../domain/pricing";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../../core/i18n/i18n";
import { useCartController } from "../../cart/controllers/useCartController";
import type { Product } from "../domain/Product";
import { effectivePrice } from "../domain/pricing";
export function ProductCard({ product: p }: { product: Product }) {
  const { ar, t } = useLanguage();
  const { add, wishes, setWishes, cart } = useCartController();
  const [added, setAdded] = useState(false);
  return (
    <article className="product">
      <div className="product-picture" style={{ background: p.color }}>
        <Link className="product-art-link" to={`/products/${p.id}`}>
          {p.thumbnailUrl ? (
            <img src={p.thumbnailUrl} alt={ar ? p.name_ar : p.name} />
          ) : (
            <span>{p.emoji}</span>
          )}
        </Link>
        <button
          className={`icon ${wishes.includes(p.id) ? "liked" : ""}`}
          aria-label={t("Save to wishlist", "حفظ في المفضلة")}
          aria-pressed={wishes.includes(p.id)}
          onClick={() =>
            setWishes((old) =>
              old.includes(p.id)
                ? old.filter((id) => id !== p.id)
                : [...old, p.id],
            )
          }
        >
          ♡
        </button>
      </div>
      <p>{ar ? p.categoryNameAr || p.category : p.category}</p>
      <h3>
        <Link to={`/products/${p.id}`}>{ar ? p.name_ar : p.name}</Link>
      </h3>
      <div className="product-bottom">
        <strong>{formatMoney(effectivePrice(p), ar, p.currency)}</strong>
        <button
          className="add-product"
          disabled={!p.stock || added || (cart[p.id] || 0) >= p.stock}
          onClick={() => {
            add(p.id, 1, p.stock);
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
          }}
        >
          {added
            ? t("Added ✓", "تمت الإضافة ✓")
            : p.stock
              ? t("Add +", "أضف +")
              : t("Sold out", "نفد المخزون")}
        </button>
      </div>
    </article>
  );
}
