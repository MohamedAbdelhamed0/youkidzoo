import { z } from "zod";
import type { Resource } from "../domain/admin";
const text = z.string().trim().min(1).max(200);
const optionalText = z.string().trim().max(3000);
const url = z.union([
  z.literal(""),
  z.url().refine((u) => u.startsWith("https://"), "Use an HTTPS image URL."),
]);
const emptyId = z.union([z.literal(""), z.uuid()]).transform((v) => v || null);
const flag = z.boolean();
const number = z.coerce.number().min(0).max(99999999);
const base = {
  name_en: text,
  name_ar: text,
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  is_active: flag,
};
export const schemas = {
  shops: z.object({
    ...base,
    description_en: optionalText,
    description_ar: optionalText,
    logo_url: url,
    cover_banner_url: url,
    owner_id: emptyId,
    contact_email: z.union([z.literal(""), z.email()]),
    contact_phone: z.string().max(40),
    is_verified: flag,
  }),
  categories: z.object({
    ...base,
    description_en: optionalText,
    description_ar: optionalText,
    icon_url: z.string().min(1),
    banner_url: url,
    parent_id: emptyId,
    shop_id: emptyId,
    display_order: z.coerce.number().int().min(0).max(9999),
  }),
  products: z
    .object({
      name_en: text,
      name_ar: text,
      description_en: optionalText,
      description_ar: optionalText,
      sku: text,
      shop_id: z.uuid(),
      category_id: z.uuid(),
      price: number,
      discount_price: z.preprocess(
        (v) => (v === "" ? null : v),
        z.coerce.number().min(0).nullable(),
      ),
      currency: z.literal("EGP"),
      stock_quantity: z.coerce.number().int().min(0).max(999999),
      thumbnail_url: url,
      gallery_urls: z.array(url).max(12),
      age_group: z.enum([
        "0-6m",
        "6-12m",
        "1-3y",
        "4-6y",
        "7-9y",
        "10-12y",
        "all-ages",
      ]),
      gender_target: z.enum(["boy", "girl", "unisex"]),
      brand: optionalText,
      dimensions: z
        .object({ weightKg: number, widthCm: number, heightCm: number })
        .nullable()
        .optional(),
      material_en: optionalText,
      material_ar: optionalText,
      safety_warnings_en: optionalText,
      safety_warnings_ar: optionalText,
      emoji: z.string().max(20),
      color: z.string().regex(/^#[a-f0-9]{6}$/i),
      is_featured: flag,
      is_special_deal: flag,
      special_deal_ends_at: z.string().nullable(),
      is_active: flag,
    })
    .superRefine((v, ctx) => {
      if (v.discount_price !== null && v.discount_price > v.price)
        ctx.addIssue({
          code: "custom",
          path: ["discount_price"],
          message: "Discount cannot exceed the original price.",
        });
      if (
        v.is_special_deal &&
        (!v.special_deal_ends_at ||
          !Number.isFinite(Date.parse(v.special_deal_ends_at)) ||
          new Date(v.special_deal_ends_at) <= new Date())
      )
        ctx.addIssue({
          code: "custom",
          path: ["special_deal_ends_at"],
          message: "A special deal needs a future expiry.",
        });
    }),
};
export type Field = {
  name: string;
  en: string;
  ar: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "checkbox"
    | "datetime-local"
    | "color"
    | "select";
  options?: { value: string; label: string }[];
  optional?: boolean;
};
const descriptions: Field[] = [
  {
    name: "description_en",
    en: "Description (English)",
    ar: "الوصف بالإنجليزية",
    type: "textarea",
    optional: true,
  },
  {
    name: "description_ar",
    en: "Description (Arabic)",
    ar: "الوصف بالعربية",
    type: "textarea",
    optional: true,
  },
];
const names: Field[] = [
  { name: "name_en", en: "Name (English)", ar: "الاسم بالإنجليزية" },
  { name: "name_ar", en: "Name (Arabic)", ar: "الاسم بالعربية" },
];
const active: Field = {
  name: "is_active",
  en: "Active",
  ar: "نشط",
  type: "checkbox",
};
export function fieldsFor(resource: Resource): Field[] {
  if (resource === "shops")
    return [
      ...names,
      { name: "slug", en: "URL slug", ar: "رابط المتجر" },
      ...descriptions,
      {
        name: "owner_id",
        en: "Owner user ID (optional)",
        ar: "معرف المالك (اختياري)",
        optional: true,
      },
      { name: "logo_url", en: "Logo URL", ar: "رابط الشعار", optional: true },
      {
        name: "cover_banner_url",
        en: "Cover image URL",
        ar: "رابط الغلاف",
        optional: true,
      },
      {
        name: "contact_email",
        en: "Contact email",
        ar: "البريد الإلكتروني",
        optional: true,
      },
      {
        name: "contact_phone",
        en: "Contact phone",
        ar: "رقم الهاتف",
        optional: true,
      },
      {
        name: "is_verified",
        en: "Verified shop",
        ar: "متجر موثق",
        type: "checkbox",
      },
      active,
    ];
  if (resource === "categories")
    return [
      ...names,
      { name: "slug", en: "URL slug", ar: "رابط الفئة" },
      ...descriptions,
      { name: "icon_url", en: "Icon URL or emoji", ar: "رابط الأيقونة أو رمز" },
      {
        name: "banner_url",
        en: "Banner URL",
        ar: "رابط الغلاف",
        optional: true,
      },
      {
        name: "parent_id",
        en: "Parent category",
        ar: "الفئة الأم",
        type: "select",
        optional: true,
      },
      {
        name: "shop_id",
        en: "Shop (blank = global)",
        ar: "المتجر (فارغ = عام)",
        type: "select",
        optional: true,
      },
      {
        name: "display_order",
        en: "Display order",
        ar: "ترتيب العرض",
        type: "number",
      },
      active,
    ];
  return [
    ...names,
    ...descriptions,
    { name: "sku", en: "SKU", ar: "رمز المنتج" },
    { name: "shop_id", en: "Shop", ar: "المتجر", type: "select" },
    { name: "category_id", en: "Category", ar: "الفئة", type: "select" },
    {
      name: "price",
      en: "Price (EGP)",
      ar: "السعر بالجنيه المصري",
      type: "number",
    },
    {
      name: "discount_price",
      en: "Discount price (optional)",
      ar: "السعر المخفض (اختياري)",
      type: "number",
      optional: true,
    },
    {
      name: "stock_quantity",
      en: "Stock quantity",
      ar: "كمية المخزون",
      type: "number",
    },
    {
      name: "thumbnail_url",
      en: "Main image URL",
      ar: "رابط الصورة الرئيسية",
      optional: true,
    },
    {
      name: "age_group",
      en: "Age group",
      ar: "الفئة العمرية",
      type: "select",
      options: [
        "0-6m",
        "6-12m",
        "1-3y",
        "4-6y",
        "7-9y",
        "10-12y",
        "all-ages",
      ].map((value) => ({ value, label: value })),
    },
    {
      name: "gender_target",
      en: "Designed for",
      ar: "مخصص لـ",
      type: "select",
      options: ["boy", "girl", "unisex"].map((value) => ({
        value,
        label: value,
      })),
    },
    { name: "brand", en: "Brand", ar: "العلامة التجارية", optional: true },
    {
      name: "material_en",
      en: "Material (English)",
      ar: "الخامة بالإنجليزية",
      optional: true,
    },
    {
      name: "dimension_weightKg",
      en: "Weight (kg, optional)",
      ar: "الوزن بالكجم (اختياري)",
      type: "number",
      optional: true,
    },
    {
      name: "dimension_widthCm",
      en: "Width (cm, optional)",
      ar: "العرض بالسم (اختياري)",
      type: "number",
      optional: true,
    },
    {
      name: "dimension_heightCm",
      en: "Height (cm, optional)",
      ar: "الارتفاع بالسم (اختياري)",
      type: "number",
      optional: true,
    },
    {
      name: "material_ar",
      en: "Material (Arabic)",
      ar: "الخامة بالعربية",
      optional: true,
    },
    {
      name: "safety_warnings_en",
      en: "Safety warnings (English)",
      ar: "تحذيرات بالإنجليزية",
      type: "textarea",
      optional: true,
    },
    {
      name: "safety_warnings_ar",
      en: "Safety warnings (Arabic)",
      ar: "تحذيرات بالعربية",
      type: "textarea",
      optional: true,
    },
    {
      name: "emoji",
      en: "Placeholder illustration",
      ar: "رمز توضيحي",
      optional: true,
    },
    { name: "color", en: "Background color", ar: "لون الخلفية", type: "color" },
    {
      name: "is_featured",
      en: "Featured product",
      ar: "منتج مميز",
      type: "checkbox",
    },
    {
      name: "is_special_deal",
      en: "Special deal",
      ar: "عرض خاص",
      type: "checkbox",
    },
    {
      name: "special_deal_ends_at",
      en: "Deal expiry",
      ar: "نهاية العرض",
      type: "datetime-local",
      optional: true,
    },
    active,
  ];
}
