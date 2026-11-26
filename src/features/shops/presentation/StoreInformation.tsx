import { useState } from "react";
import { Mail, MessageSquare, Phone, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../../core/i18n/i18n";
import { ErrorText } from "../../../shared/components/ErrorText";
import { StoreDialog } from "../../../shared/components/StoreDialog";
import { useShopDirectoryController } from "../controllers/useShopsController";
import type { Shop } from "../domain/shops";

const emailAddress = /^[a-z0-9.!^_+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export function StoreInformation() {
  const { ar, t } = useLanguage();
  const { shops, error, loading, reload } = useShopDirectoryController();
  const [feedback, setFeedback] = useState(false);
  const language = ar ? "ar" : "en";
  const contactShops = shops.filter((shop) =>
    emailAddress.test(shop.contactEmail),
  );

  return (
    <section className="store-page store-information">
      <Link className="store-text-link" to="/">
        {t("Back to storefront", "العودة إلى المتجر")}
      </Link>
      <h1>{t("Store information", "معلومات المتجر")}</h1>
      <div className="store-info-intro">
        <img
          src={`${import.meta.env.BASE_URL}icon-192.png`}
          width={56}
          height={56}
          alt=""
        />
        <div>
          <h2>YouKidZoo</h2>
          <p>
            {t(
              "Kids’ clothing, learning toys, and gifts.",
              "ملابس للأطفال وألعاب تعليمية وهدايا.",
            )}
          </p>
        </div>
      </div>
      <section className="store-info-section" aria-labelledby="store-partners">
        <h2 id="store-partners">{t("Our shops", "متاجرنا")}</h2>
        {loading && (
          <p role="status">{t("Loading shops…", "جارٍ تحميل المتاجر…")}</p>
        )}
        {error && (
          <div role="alert">
            <ErrorText message={error} />{" "}
            <button className="store-text-link" onClick={reload}>
              {t("Try again", "حاول مجددًا")}
            </button>
          </div>
        )}
        {!loading && !error && !shops.length && (
          <p>{t("No shops available.", "لا توجد متاجر متاحة.")}</p>
        )}
        <div className="store-shop-contacts">
          {shops.map((shop) => {
            const telephone = shop.contactPhone.replace(/[^+0-9]/g, "");
            const hasPhone = /^\+?\d{5,}$/.test(telephone);
            const hasEmail = emailAddress.test(shop.contactEmail);
            return (
              <article key={shop.id} className="store-info-card">
                <h3>
                  <Link to={`/shops/${shop.slug}`}>
                    <Store size={17} />
                    {shop.name[language]}
                  </Link>
                </h3>
                {shop.reviewCount > 0 && (
                  <p>
                    {t(
                      `${shop.rating}/5 · ${shop.reviewCount} ratings`,
                      `${shop.rating}/٥ · ${shop.reviewCount} تقييم`,
                    )}
                  </p>
                )}
                {(hasPhone || hasEmail) && (
                  <div className="store-contact-links">
                    {hasPhone && (
                      <a href={`tel:${telephone}`}>
                        <Phone size={15} />
                        {t("Call shop", "اتصل بالمتجر")}
                      </a>
                    )}
                    {hasEmail && (
                      <a href={`mailto:${shop.contactEmail}`}>
                        <Mail size={15} />
                        {t("Email shop", "راسل المتجر")}
                      </a>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
      <section
        className="store-info-section"
        aria-labelledby="store-feedback-label"
      >
        <h2 id="store-feedback-label">{t("Feedback", "ملاحظاتك")}</h2>
        <button className="store-secondary" onClick={() => setFeedback(true)}>
          <MessageSquare size={17} /> {t("Write feedback", "اكتب ملاحظاتك")}
        </button>
      </section>
      {feedback && (
        <FeedbackDialog shops={contactShops} close={() => setFeedback(false)} />
      )}
    </section>
  );
}

function FeedbackDialog({
  shops,
  close,
}: {
  shops: Shop[];
  close: () => void;
}) {
  const { ar, t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState("");
  const ratings = [
    t("Very dissatisfied", "غير راضٍ جدًا"),
    t("Dissatisfied", "غير راضٍ"),
    t("Neutral", "محايد"),
    t("Satisfied", "راضٍ"),
    t("Very satisfied", "راضٍ جدًا"),
  ];
  return (
    <StoreDialog
      title={t("How was your experience?", "كيف كانت تجربتك؟")}
      close={close}
    >
      <form
        className="store-feedback-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!note.trim()) {
            setStatus(t("Enter your feedback.", "اكتب ملاحظاتك."));
            return;
          }
          const subject = t("YouKidZoo feedback", "ملاحظات حول YouKidZoo");
          const body = rating
            ? `${t("Rating", "التقييم")}: ${rating}/5\n\n${note.trim()}`
            : note.trim();
          if (recipient) {
            window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            return;
          }
          try {
            await navigator.clipboard.writeText(body);
            setStatus(t("Feedback copied.", "تم نسخ الملاحظات."));
          } catch {
            setStatus(
              t(
                "Copying failed. You can select and copy your message.",
                "تعذّر النسخ. يمكنك تحديد رسالتك ونسخها.",
              ),
            );
          }
        }}
      >
        <fieldset>
          <legend>{t("Rating (optional)", "التقييم (اختياري)")}</legend>
          <div className="store-rating">
            {ratings.map((label, index) => (
              <button
                key={label}
                type="button"
                className="store-secondary"
                aria-label={label}
                aria-pressed={rating === index + 1}
                onClick={() => setRating(rating === index + 1 ? 0 : index + 1)}
              >
                {new Intl.NumberFormat(ar ? "ar-EG" : "en").format(index + 1)}
              </button>
            ))}
          </div>
        </fieldset>
        {shops.length > 0 && (
          <label>
            {t("Shop recipient", "المتجر المستلم")}
            <select
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
            >
              <option value="">{t("Copy feedback", "نسخ الملاحظات")}</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.contactEmail}>
                  {shop.name[ar ? "ar" : "en"]}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          {t("Your feedback", "ملاحظاتك")}
          <textarea
            required
            rows={4}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <button className="store-primary" type="submit">
          {recipient
            ? t("Open email draft", "فتح مسودة البريد")
            : t("Copy feedback", "نسخ الملاحظات")}
        </button>
        {status && <p role="status">{status}</p>}
      </form>
    </StoreDialog>
  );
}
