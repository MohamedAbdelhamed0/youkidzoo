import { formatMoney } from "../../products/domain/pricing";
import { summarizeCart } from "../../cart/domain/cart";
import { ErrorText } from "../../../shared/components/ErrorText";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  orderStatusLabel,
  paymentStatusLabel,
  paymentMethodLabel,
} from "../../../core/i18n/labels";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useOrdersController,
  useCheckoutController,
} from "../controllers/useOrdersController";
import { useLanguage } from "../../../core/i18n/i18n";
import { useCartController } from "../../cart/controllers/useCartController";
import { useProductController } from "../../products/controllers/useProductController";
import type { Order } from "../domain/orders";
import { effectivePrice } from "../../products/domain/pricing";
export { effectivePrice } from "../../products/domain/pricing";
export function ShoppingBagPage({ wishlist = false }: { wishlist?: boolean }) {
  const { ar, t } = useLanguage();
  const { products, error, loading } = useProductController();
  const { cart, wishes, setCart, setWishes, add } = useCartController();
  const [message, setMessage] = useState("");
  const items = products.filter((p) =>
    wishlist ? wishes.includes(p.id) : Boolean(cart[p.id]),
  );
  const unavailable = (wishlist ? wishes : Object.keys(cart)).filter(
    (id) => !products.some((p) => p.id === id),
  );
  const total = summarizeCart(products, cart).subtotal;
  return (
    <section>
      <h1>
        {wishlist
          ? t("Saved with love", "محفوظة بحب")
          : t("Your little bag", "حقيبتك الصغيرة")}
      </h1>
      {error && (
        <p role="alert">
          <ErrorText message={error} />
        </p>
      )}
      {loading && (
        <p role="status">{t("Loading your bag…", "جارٍ تحميل الحقيبة…")}</p>
      )}
      {!loading &&
        !error &&
        unavailable.map((id) => (
          <div className="bag-row" key={id}>
            <p>
              {t(
                "This item is no longer available.",
                "هذا المنتج لم يعد متاحًا.",
              )}
            </p>
            <button
              onClick={() =>
                wishlist
                  ? setWishes((old) => old.filter((x) => x !== id))
                  : setCart((old) => {
                      const next = { ...old };
                      delete next[id];
                      return next;
                    })
              }
            >
              {t("Remove unavailable item", "حذف المنتج غير المتاح")}
            </button>
          </div>
        ))}
      {message && <p role="status">{message}</p>}
      {items.map((p) => (
        <div className="bag-row" key={p.id}>
          <Link
            className="bag-emoji"
            style={{ background: p.color }}
            to={`/products/${p.id}`}
          >
            {p.thumbnailUrl ? <img src={p.thumbnailUrl} alt="" /> : p.emoji}
          </Link>
          <div>
            <Link to={`/products/${p.id}`}>
              <strong>{ar ? p.name_ar : p.name}</strong>
            </Link>
            <p>{formatMoney(effectivePrice(p), ar, p.currency)}</p>
            {wishlist ? (
              <button
                className="pink-button"
                disabled={!p.stock}
                onClick={() => {
                  add(p.id, 1, p.stock);
                  setMessage(t("Added to your bag.", "تمت الإضافة للحقيبة."));
                }}
              >
                {t("Add to bag", "أضف للحقيبة")}
              </button>
            ) : (
              <label className="inline-label">
                {t("Quantity", "الكمية")}
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, p.stock)}
                  value={cart[p.id]}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isInteger(n) && n > 0 && n <= p.stock)
                      setCart((old) => ({ ...old, [p.id]: n }));
                  }}
                />
              </label>
            )}
            {!wishlist && cart[p.id] > p.stock && (
              <p role="alert">
                {t(
                  "Not enough stock. Reduce quantity or remove this item.",
                  "المخزون غير كافٍ. قلل الكمية أو احذف المنتج.",
                )}
              </p>
            )}
          </div>
          <button
            onClick={() =>
              wishlist
                ? setWishes((old) => old.filter((id) => id !== p.id))
                : setCart((old) => {
                    const next = { ...old };
                    delete next[p.id];
                    return next;
                  })
            }
          >
            {t("Remove", "حذف")}
          </button>
        </div>
      ))}
      {!items.length && !loading && !error ? (
        <div className="empty">
          <p>
            {t(
              "Your next little adventure is waiting.",
              "مغامرتك الصغيرة القادمة تنتظرك.",
            )}
          </p>
          <Link className="pink-button" to="/shop">
            {t("Explore the collection", "اكتشف المجموعة")}
          </Link>
        </div>
      ) : (
        !wishlist &&
        !loading &&
        !error &&
        items.length > 0 && (
          <div className="checkout-summary">
            <h2>
              {t("Subtotal", "المجموع")}: {formatMoney(total, ar)}
            </h2>
            <p>
              {t(
                "Free shipping over EGP 100. Otherwise EGP 7.",
                "شحن مجاني فوق ١٠٠ جنيه، وإلا ٧ جنيهات.",
              )}
            </p>
            <Link className="pink-button" to="/checkout">
              {t("Continue to checkout", "متابعة الدفع")}
            </Link>
          </div>
        )
      )}
    </section>
  );
}
const addressSchema = z.object({
  recipientName: z.string().trim().min(2).max(200),
  phone: z.string().trim().min(6).max(40),
  country: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  streetAddress: z.string().trim().min(5).max(300),
  postalCode: z.string().max(30),
  notes: z.string().max(2000),
});
type AddressForm = z.infer<typeof addressSchema>;
export function CheckoutPage() {
  const { ar, t } = useLanguage();
  const { products, error, loading } = useProductController();
  const { cart } = useCartController();
  const navigate = useNavigate();
  const { error: failure, placeOrder, submitting } = useCheckoutController();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "Egypt", postalCode: "", notes: "" },
  });
  const items = products.filter((p) => cart[p.id]);
  const { subtotal, shipping } = summarizeCart(products, cart);
  const unavailable =
    !loading &&
    Object.keys(cart).some((id) => !products.some((p) => p.id === id));
  const submit = handleSubmit(async (values) => {
    const { notes, ...address } = values;
    const order = await placeOrder({
      items: Object.entries(cart).map(([productId, quantity]) => ({
        productId,
        quantity,
      })),
      address,
      notes,
    });
    if (order) navigate("/orders", { replace: true, state: { placed: true } });
  });
  return (
    <section>
      <h1>{t("A little joy, on its way", "سعادة صغيرة في الطريق")}</h1>
      {!Object.keys(cart).length ? (
        <Link to="/shop">
          {t(
            "Your bag is empty. Explore the collection.",
            "حقيبتك فارغة. اكتشف المجموعة.",
          )}
        </Link>
      ) : (
        <div className="checkout-grid">
          <form className="stack panel-card" onSubmit={submit}>
            <h2>{t("Shipping details", "تفاصيل الشحن")}</h2>
            {(
              [
                "recipientName",
                "phone",
                "country",
                "city",
                "streetAddress",
                "postalCode",
              ] as const
            ).map((name, i) => (
              <label key={name}>
                {t(
                  [
                    "Recipient name",
                    "Phone",
                    "Country",
                    "City",
                    "Street address",
                    "Postal code (optional)",
                  ][i],
                  [
                    "اسم المستلم",
                    "الهاتف",
                    "الدولة",
                    "المدينة",
                    "عنوان الشارع",
                    "الرمز البريدي (اختياري)",
                  ][i],
                )}
                <input
                  {...register(name)}
                  type={name === "phone" ? "tel" : "text"}
                  autoComplete={
                    [
                      "name",
                      "tel",
                      "country-name",
                      "address-level2",
                      "street-address",
                      "postal-code",
                    ][i]
                  }
                />
                {errors[name] && (
                  <small className="form-error">{errors[name]?.message}</small>
                )}
              </label>
            ))}
            <label>
              {t("Order notes (optional)", "ملاحظات الطلب (اختياري)")}
              <textarea {...register("notes")} maxLength={2000} />
            </label>
            <fieldset>
              <legend>{t("Payment method", "طريقة الدفع")}</legend>
              <label className="radio-label">
                <input type="radio" checked readOnly />
                {t("Cash on delivery", "الدفع عند الاستلام")}
              </label>
              <small>
                {t("Pay when your order arrives.", "ادفع عند وصول طلبك.")}
              </small>
            </fieldset>
            {(failure || error) && (
              <p role="alert" className="form-error">
                <ErrorText message={failure || error} />
              </p>
            )}
            {unavailable && (
              <p role="alert">
                {t(
                  "Some items are no longer available. Remove them from your bag to continue.",
                  "بعض المنتجات لم تعد متاحة. احذفها من الحقيبة للمتابعة.",
                )}{" "}
                <Link to="/cart">{t("Review bag", "مراجعة الحقيبة")}</Link>
              </p>
            )}
            <button
              className="pink-button"
              disabled={
                isSubmitting ||
                submitting ||
                loading ||
                unavailable ||
                Boolean(error) ||
                !items.length ||
                items.some((p) => cart[p.id] > p.stock)
              }
            >
              {isSubmitting
                ? t("Placing your order…", "جارٍ تأكيد الطلب…")
                : t("Place order", "تأكيد الطلب")}
            </button>
          </form>
          <aside className="panel-card">
            <h2>{t("Your order", "طلبك")}</h2>
            {items.map((p) => (
              <p key={p.id}>
                {ar ? p.name_ar : p.name} × {cart[p.id]}{" "}
                <b>{formatMoney(effectivePrice(p) * cart[p.id], ar)}</b>
              </p>
            ))}
            <hr />
            <p>
              {t("Subtotal", "المجموع")}: {formatMoney(subtotal, ar)}
            </p>
            <p>
              {t("Shipping", "الشحن")}: {formatMoney(shipping, ar)}
            </p>
            <h3>
              {t("Total", "الإجمالي")}: {formatMoney(subtotal + shipping, ar)}
            </h3>
            <small>
              {t(
                "Final prices and availability are verified when you place your order.",
                "يتم التحقق من الأسعار والمخزون عند تأكيد الطلب.",
              )}
            </small>
          </aside>
        </div>
      )}
    </section>
  );
}
export function OrderDetails({
  order,
  print = false,
}: {
  order: Order;
  print?: boolean;
}) {
  const { ar, t } = useLanguage();
  return (
    <article className="panel-card order-card">
      <div className="order-title">
        <h2>{order.orderNumber}</h2>
        <span className="status-badge">
          {orderStatusLabel(order.status, ar)}
        </span>
      </div>
      <p>{new Date(order.createdAt).toLocaleString(ar ? "ar-EG" : "en-US")}</p>
      {order.items.map((item) => (
        <div className="invoice-line" key={item.id}>
          <span>
            {item.productName[ar ? "ar" : "en"]} × {item.quantity}
          </span>
          <strong>{formatMoney(item.subtotal, ar, order.currency)}</strong>
        </div>
      ))}
      <hr />
      <p>
        {t("Shipping", "الشحن")}:{" "}
        {formatMoney(order.shippingFee, ar, order.currency)}
      </p>
      <h3>
        {t("Total", "الإجمالي")}: {formatMoney(order.total, ar, order.currency)}
      </h3>
      {order.payments?.map((p) => (
        <p key={p.id}>
          {paymentMethodLabel(p.method, ar)} ·{" "}
          {paymentStatusLabel(p.status, ar)}
        </p>
      ))}
      <p>
        {order.shippingAddress.recipientName} · {order.shippingAddress.phone}
      </p>
      <p>
        {order.shippingAddress.streetAddress}, {order.shippingAddress.city},{" "}
        {order.shippingAddress.country} {order.shippingAddress.postalCode}
      </p>
      {order.notes && <p>{order.notes}</p>}
      {print && (
        <button className="pink-button" onClick={() => window.print()}>
          {t("Print invoice", "طباعة الفاتورة")}
        </button>
      )}
    </article>
  );
}
export function OrdersPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const { orders, error, loading } = useOrdersController();
  return (
    <section>
      <h1>{t("Your little adventures", "طلباتك")}</h1>
      {location.state?.placed && (
        <p role="status">
          {t(
            "Your order has been placed. Payment is due on delivery.",
            "تم استلام طلبك. الدفع عند الاستلام.",
          )}
        </p>
      )}
      {loading && (
        <p role="status">{t("Loading orders…", "جارٍ تحميل الطلبات…")}</p>
      )}
      {error && (
        <p role="alert">
          <ErrorText message={error} />
        </p>
      )}
      {orders.map((order) => (
        <OrderDetails key={order.id} order={order} />
      ))}
      {!loading && !error && !orders.length && (
        <p>
          {t(
            "No orders yet. Your next adventure is waiting.",
            "لا توجد طلبات بعد. مغامرتك القادمة تنتظرك.",
          )}
        </p>
      )}
    </section>
  );
}
