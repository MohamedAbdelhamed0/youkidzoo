import { formatMoney } from "../../products/domain/pricing";
import { ErrorText } from "../../../shared/components/ErrorText";
import { usePaymentsController } from "../../payments/controllers/usePaymentsController";
import { useResourceManagerController } from "../controllers/useResourceManagerController";
import { useAdminOverviewController } from "../controllers/useAdminOverviewController";
import { useAdminOrdersController } from "../../orders/controllers/useOrdersController";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useLanguage } from "../../../core/i18n/i18n";
import { fieldsFor } from "../controllers/adminForms";
import type { Resource } from "../domain/admin";
import type { Order, OrderStatus, Payment } from "../../orders/domain/orders";
import { OrderDetails } from "../../orders/presentation/OrderPages";
import { useDialogAccessibility } from "../../../shared/components/useDialogAccessibility";
import {
  orderStatusLabel,
  paymentStatusLabel,
  paymentMethodLabel,
  ageLabel,
  genderLabel,
} from "../../../core/i18n/labels";
const sections = [
  ["", "Overview", "نظرة عامة"],
  ["products", "Products", "المنتجات"],
  ["categories", "Categories", "الفئات"],
  ["shops", "Shops", "المتاجر"],
  ["orders", "Orders", "الطلبات"],
  ["payments", "Payments", "المدفوعات"],
];
export function AdminLayout() {
  const { t } = useLanguage();
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <span className="eyebrow">YOUKIDZOO ADMIN</span>
        <nav>
          {sections.map(([path, en, ar]) => (
            <NavLink end key={path} to={`/admin${path ? "/" + path : ""}`}>
              {t(en, ar)}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
}
export function AdminOverview() {
  const { ar, t } = useLanguage();
  const { data, error } = useAdminOverviewController();
  return (
    <>
      <h1>{t("A little overview", "نظرة عامة")}</h1>
      {error && (
        <p role="alert">
          <ErrorText message={error} />
        </p>
      )}
      {!data && !error && <p role="status">{t("Loading…", "جارٍ التحميل…")}</p>}
      {data && (
        <>
          <div className="stat-grid">
            {[
              [
                t("Collected revenue", "الإيرادات المحصلة"),
                formatMoney(data.collectedRevenue, ar),
              ],
              [t("Total orders", "إجمالي الطلبات"), data.totalOrders],
              [t("Active shops", "المتاجر النشطة"), data.activeShops],
              [
                t("Low-stock products", "منتجات قليلة المخزون"),
                data.lowStockProducts,
              ],
            ].map(([label, value]) => (
              <div className="panel-card" key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <h2>{t("Recent orders", "أحدث الطلبات")}</h2>
          {data.recentOrders.map((o) => (
            <OrderDetails key={o.id} order={o} />
          ))}
        </>
      )}
    </>
  );
}
export function ResourceManager({ resource }: { resource: Resource }) {
  const { ar, t } = useLanguage();
  const {
    rows,
    shops,
    categories,
    editing,
    setEditing,
    remove,
    setRemove,
    error,
    busy,
    loading,
    query,
    setQuery,
    photos,
    thumbnail,
    setThumbnail,
    removePhoto,
    selected,
    setSelected,
    assigning,
    setAssigning,
    open,
    save,
    deleteRecord,
    assignCategories,
    saveAssignments,
    uploadImages,
  } = useResourceManagerController(resource);
  useDialogAccessibility(
    editing !== undefined || Boolean(remove) || Boolean(assigning),
    () => {
      if (!busy) {
        setEditing(undefined);
        setRemove(null);
        setAssigning(null);
      }
    },
  );
  const labels = sections.find((s) => s[0] === resource)!;
  return (
    <>
      <div className="section-heading">
        <h1>{t(labels[1], labels[2])}</h1>
        <button className="pink-button" onClick={() => open(null)}>
          {t("Add new +", "إضافة +")}
        </button>
      </div>
      <input
        className="admin-search"
        aria-label={t("Search records", "بحث السجلات")}
        placeholder={t("Search name or SKU…", "ابحث بالاسم أو الرمز…")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {error && (
        <p className="form-error" role="alert">
          <ErrorText message={error} />
        </p>
      )}
      {loading && <p role="status">{t("Loading…", "جارٍ التحميل…")}</p>}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{t("Name", "الاسم")}</th>
              <th>
                {resource === "products"
                  ? t("Price / Stock", "السعر / المخزون")
                  : t("Slug", "الرابط")}
              </th>
              <th>{t("Status", "الحالة")}</th>
              <th>{t("Actions", "الإجراءات")}</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((r) =>
                `${r.name_en} ${r.name_ar} ${r.sku || ""}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((row) => (
                <tr key={row.id}>
                  <td>{String(row[ar ? "name_ar" : "name_en"])}</td>
                  <td>
                    {resource === "products"
                      ? `${formatMoney(Number(row.price), ar, String(row.currency || "EGP"))} / ${row.stock_quantity}`
                      : String(row.slug)}
                  </td>
                  <td>
                    {row.is_active ? t("Active", "نشط") : t("Hidden", "مخفي")}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button onClick={() => open(row)}>
                        {t("Edit", "تعديل")}
                      </button>
                      {resource === "shops" && (
                        <button onClick={() => void assignCategories(row)}>
                          {t("Categories", "الفئات")}
                        </button>
                      )}
                      <button onClick={() => setRemove(row)}>
                        {t("Delete", "حذف")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {!loading && !rows.length && (
        <p>
          {t(
            "No records yet. Add your first one above.",
            "لا توجد سجلات بعد. أضف أول سجل.",
          )}
        </p>
      )}
      {editing !== undefined && (
        <div className="overlay">
          <section
            className="dialog editor-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
          >
            <button
              className="icon close"
              disabled={busy}
              onClick={() => setEditing(undefined)}
              aria-label={t("Close", "إغلاق")}
            >
              ×
            </button>
            <h2 id="edit-title">
              {editing ? t("Edit", "تعديل") : t("Add", "إضافة")}{" "}
              {t(labels[1], labels[2])}
            </h2>
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                void save(Object.fromEntries(new FormData(e.currentTarget)));
              }}
            >
              {fieldsFor(resource).map((field) => {
                let options = field.options?.map((option) => ({
                  ...option,
                  label:
                    field.name === "age_group"
                      ? ageLabel(option.value, ar)
                      : field.name === "gender_target"
                        ? genderLabel(option.value, ar)
                        : option.label,
                }));
                if (
                  ["shop_id", "category_id", "parent_id"].includes(field.name)
                )
                  options = (
                    field.name === "shop_id"
                      ? shops
                      : categories.filter((c) => c.id !== editing?.id)
                  ).map((c) => ({
                    value: c.id,
                    label: String(c[ar ? "name_ar" : "name_en"]),
                  }));
                let value =
                  editing?.[field.name] ??
                  (field.type === "checkbox"
                    ? ["is_active"].includes(field.name)
                    : field.type === "number"
                      ? "0"
                      : field.name === "color"
                        ? "#fce7ed"
                        : field.name === "age_group"
                          ? "all-ages"
                          : field.name === "gender_target"
                            ? "unisex"
                            : "");
                if (field.name.startsWith("dimension_")) {
                  const dimensions = editing?.dimensions;
                  value =
                    dimensions && typeof dimensions === "object"
                      ? String(
                          (dimensions as Record<string, unknown>)[
                            field.name.slice(10)
                          ] ?? "",
                        )
                      : "";
                }
                if (
                  field.name === "discount_price" &&
                  editing?.discount_price == null
                )
                  value = "";
                if (field.type === "datetime-local" && value) {
                  const date = new Date(String(value));
                  value = new Date(
                    date.getTime() - date.getTimezoneOffset() * 60000,
                  )
                    .toISOString()
                    .slice(0, 16);
                }
                return (
                  <label
                    className={field.type === "checkbox" ? "radio-label" : ""}
                    key={field.name}
                  >
                    {t(field.en, field.ar)}
                    {field.type === "checkbox" ? (
                      <input
                        type="checkbox"
                        name={field.name}
                        defaultChecked={Boolean(value)}
                      />
                    ) : field.type === "textarea" ? (
                      <textarea
                        name={field.name}
                        defaultValue={String(value)}
                        required={!field.optional}
                      />
                    ) : field.type === "select" ? (
                      <select
                        name={field.name}
                        defaultValue={String(value)}
                        required={!field.optional}
                      >
                        <option value="">{t("Select…", "اختر…")}</option>
                        {options?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        name={field.name}
                        type={field.type || "text"}
                        defaultValue={
                          field.name === "thumbnail_url"
                            ? undefined
                            : String(value)
                        }
                        value={
                          field.name === "thumbnail_url" ? thumbnail : undefined
                        }
                        onChange={
                          field.name === "thumbnail_url"
                            ? (e) => setThumbnail(e.target.value)
                            : undefined
                        }
                        required={!field.optional}
                        min={field.type === "number" ? 0 : undefined}
                        step={
                          field.name.startsWith("dimension_")
                            ? "any"
                            : ["price", "discount_price"].includes(field.name)
                              ? ".01"
                              : undefined
                        }
                      />
                    )}
                  </label>
                );
              })}
              {resource === "products" && (
                <fieldset>
                  <legend>{t("Product gallery", "صور المنتج")}</legend>
                  <div className="gallery">
                    {photos.map((url) => (
                      <div key={url}>
                        <img
                          src={url}
                          alt={t("Product photo", "صورة المنتج")}
                        />
                        <button
                          type="button"
                          aria-pressed={thumbnail === url}
                          onClick={() => setThumbnail(url)}
                        >
                          {thumbnail === url
                            ? t("Cover ✓", "الغلاف ✓")
                            : t("Use as cover", "استخدم كغلاف")}
                        </button>
                        <button type="button" onClick={() => removePhoto(url)}>
                          {t("Remove", "حذف")}
                        </button>
                      </div>
                    ))}
                  </div>
                  <label>
                    {t("Upload images (max 12)", "رفع الصور (حتى ١٢)")}
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      disabled={busy}
                      onChange={async (e) => {
                        const input = e.currentTarget;
                        const files = Array.from(input.files || []);
                        await uploadImages(files);
                        input.value = "";
                      }}
                    />
                  </label>
                  <small>
                    {t(
                      "Choose a main photo from your gallery.",
                      "اختر صورة رئيسية من صور المنتج.",
                    )}
                  </small>
                </fieldset>
              )}
              {error && (
                <p role="alert" className="form-error">
                  <ErrorText message={error} />
                </p>
              )}
              <button disabled={busy} className="pink-button">
                {busy
                  ? t("Saving…", "جارٍ الحفظ…")
                  : t("Save changes", "حفظ التغييرات")}
              </button>
            </form>
          </section>
        </div>
      )}
      {remove && (
        <div className="overlay">
          <section
            className="dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">
              {t("Delete this record?", "حذف هذا السجل؟")}
            </h2>
            <p>{String(remove[ar ? "name_ar" : "name_en"])}</p>
            {error && (
              <p role="alert" className="form-error">
                <ErrorText message={error} />
              </p>
            )}
            <p>
              {t(
                "This permanently deletes the record. You can hide it by editing its Active setting instead.",
                "سيُحذف السجل نهائيًا. يمكنك إخفاؤه بتغيير إعداد نشط.",
              )}
            </p>
            <div className="table-actions">
              <button disabled={busy} onClick={() => setRemove(null)}>
                {t("Keep record", "احتفظ بالسجل")}
              </button>
              <button
                disabled={busy}
                className="pink-button"
                onClick={() => void deleteRecord()}
              >
                {t("Delete permanently", "حذف نهائي")}
              </button>
            </div>
          </section>
        </div>
      )}
      {assigning && (
        <div className="overlay">
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-title"
          >
            <h2 id="assign-title">{t("Shop categories", "فئات المتجر")}</h2>
            <div className="stack">
              {categories
                .filter((c) => !c.shop_id || c.shop_id === assigning.id)
                .map((c) => (
                  <label className="radio-label" key={c.id}>
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={(e) =>
                        setSelected((old) =>
                          e.target.checked
                            ? [...old, c.id]
                            : old.filter((id) => id !== c.id),
                        )
                      }
                    />
                    {String(c[ar ? "name_ar" : "name_en"])}
                  </label>
                ))}
              <button
                className="pink-button"
                disabled={busy}
                onClick={() => void saveAssignments()}
              >
                {t("Save categories", "حفظ الفئات")}
              </button>
              <button disabled={busy} onClick={() => setAssigning(null)}>
                {t("Cancel", "إلغاء")}
              </button>
              {error && (
                <p role="alert">
                  <ErrorText message={error} />
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "processing", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};
export function AdminOrders() {
  const { t, ar } = useLanguage();
  const { orders, error, busy, loading, updateStatus } =
    useAdminOrdersController();
  const [filter, setFilter] = useState("");
  const [details, setDetails] = useState<Order | null>(null);
  useDialogAccessibility(Boolean(details), () => setDetails(null));
  return (
    <>
      <h1>{t("Orders & fulfillment", "الطلبات والشحن")}</h1>
      {loading && (
        <p role="status">{t("Loading orders…", "جارٍ تحميل الطلبات…")}</p>
      )}
      <label>
        {t("Filter status", "تصفية الحالة")}{" "}
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">{t("All orders", "كل الطلبات")}</option>
          {Object.keys(transitions).map((s) => (
            <option key={s} value={s}>
              {orderStatusLabel(s as OrderStatus, ar)}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert">
          <ErrorText message={error} />
        </p>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{t("Order", "الطلب")}</th>
              <th>{t("Total", "الإجمالي")}</th>
              <th>{t("Status", "الحالة")}</th>
              <th>{t("Actions", "الإجراءات")}</th>
            </tr>
          </thead>
          <tbody>
            {orders
              .filter((o) => !filter || o.status === filter)
              .map((o) => (
                <tr key={o.id}>
                  <td>
                    {o.orderNumber}
                    <small>{o.shippingAddress.recipientName}</small>
                  </td>
                  <td>{formatMoney(o.total, ar, o.currency)}</td>
                  <td>{orderStatusLabel(o.status, ar)}</td>
                  <td>
                    <div className="table-actions">
                      <button onClick={() => setDetails(o)}>
                        {t("Details / invoice", "التفاصيل / الفاتورة")}
                      </button>
                      <select
                        aria-label={t(
                          "Update order status",
                          "تحديث حالة الطلب",
                        )}
                        disabled={busy || !transitions[o.status].length}
                        value=""
                        onChange={(e) => {
                          const status = e.target.value as OrderStatus;
                          if (status) void updateStatus(o.id, status);
                        }}
                      >
                        <option value="">
                          {t("Update status…", "تحديث الحالة…")}
                        </option>
                        {transitions[o.status].map((s) => (
                          <option key={s} value={s}>
                            {orderStatusLabel(s, ar)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {details && (
        <div className="overlay">
          <section
            className="dialog editor-dialog invoice-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-title"
          >
            <button
              className="icon close"
              aria-label={t("Close", "إغلاق")}
              onClick={() => setDetails(null)}
            >
              ×
            </button>
            <h2 id="invoice-title">{t("Order invoice", "فاتورة الطلب")}</h2>
            <OrderDetails order={details} print />
          </section>
        </div>
      )}
    </>
  );
}
export function AdminPayments() {
  const { t, ar } = useLanguage();
  const { payments, error, loading } = usePaymentsController();
  const [filter, setFilter] = useState("");
  return (
    <>
      <h1>{t("Payments ledger", "سجل المدفوعات")}</h1>
      {loading && (
        <p role="status">{t("Loading payments…", "جارٍ تحميل المدفوعات…")}</p>
      )}
      <label>
        {t("Payment status", "حالة الدفع")}{" "}
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">{t("All payments", "كل المدفوعات")}</option>
          {["paid", "pending", "failed", "refunded"].map((s) => (
            <option key={s} value={s}>
              {paymentStatusLabel(s as Payment["status"], ar)}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert">
          <ErrorText message={error} />
        </p>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{t("Date / Order", "التاريخ / الطلب")}</th>
              <th>{t("Amount", "المبلغ")}</th>
              <th>{t("Method", "الطريقة")}</th>
              <th>{t("Status", "الحالة")}</th>
              <th>{t("Transaction", "العملية")}</th>
            </tr>
          </thead>
          <tbody>
            {payments
              .filter((p) => !filter || p.status === filter)
              .map((p) => (
                <tr key={p.id}>
                  <td>
                    {new Date(p.createdAt).toLocaleDateString(
                      ar ? "ar-EG" : "en-US",
                    )}
                    <small>{p.orderId}</small>
                  </td>
                  <td>{formatMoney(p.amount, ar, p.currency)}</td>
                  <td>{paymentMethodLabel(p.method, ar)}</td>
                  <td>{paymentStatusLabel(p.status, ar)}</td>
                  <td>{p.providerTransactionId || "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
