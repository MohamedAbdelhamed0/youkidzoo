import type {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
} from "../../features/orders/domain/orders";
const orderLabels: Record<OrderStatus, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغى",
  refunded: "تم رد المبلغ",
};
const paymentLabels: Record<PaymentStatus, string> = {
  pending: "قيد الانتظار",
  paid: "مدفوع",
  failed: "فشل",
  refunded: "تم رد المبلغ",
};
const methodLabels: Record<PaymentMethod, [string, string]> = {
  cash_on_delivery: ["Cash on delivery", "الدفع عند الاستلام"],
  credit_card: ["Credit card", "بطاقة ائتمان"],
  apple_pay: ["Apple Pay", "Apple Pay"],
  wallet: ["Wallet", "محفظة"],
};
export const orderStatusLabel = (status: OrderStatus, ar: boolean) =>
  ar ? orderLabels[status] : status.charAt(0).toUpperCase() + status.slice(1);
export const paymentStatusLabel = (status: PaymentStatus, ar: boolean) =>
  ar ? paymentLabels[status] : status.charAt(0).toUpperCase() + status.slice(1);
export const paymentMethodLabel = (method: PaymentMethod, ar: boolean) =>
  methodLabels[method][ar ? 1 : 0];
export const ageLabel = (age: string, ar: boolean) =>
  ({
    "0-6m": ar ? "٠–٦ أشهر" : "0–6 months",
    "6-12m": ar ? "٦–١٢ شهرًا" : "6–12 months",
    "1-3y": ar ? "١–٣ سنوات" : "1–3 years",
    "4-6y": ar ? "٤–٦ سنوات" : "4–6 years",
    "7-9y": ar ? "٧–٩ سنوات" : "7–9 years",
    "10-12y": ar ? "١٠–١٢ سنة" : "10–12 years",
    "all-ages": ar ? "كل الأعمار" : "All ages",
  })[age] || age;
export const genderLabel = (gender: string, ar: boolean) =>
  ({
    boy: ar ? "أولاد" : "Boys",
    girl: ar ? "بنات" : "Girls",
    unisex: ar ? "للجميع" : "Everyone",
  })[gender] || gender;
