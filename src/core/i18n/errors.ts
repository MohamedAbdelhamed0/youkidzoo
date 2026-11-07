const messages: Record<string, string> = {
  "The store is not connected yet. Please connect Supabase.":
    "المتجر غير متصل حاليًا. يرجى المحاولة بعد تفعيل الخدمة.",
  "This account is inactive.": "هذا الحساب غير نشط.",
  "Invalid username or password.": "اسم المستخدم أو كلمة المرور غير صحيحة.",
  "Invalid login credentials": "بيانات تسجيل الدخول غير صحيحة.",
  "Email not confirmed": "يرجى تأكيد بريدك الإلكتروني أولًا.",
  "User already registered": "هذا البريد الإلكتروني مسجل بالفعل.",
  "Sign-in could not be completed.": "تعذر إكمال تسجيل الدخول.",
  "Please sign in again.": "يرجى تسجيل الدخول مجددًا.",
  "Please sign in.": "يرجى تسجيل الدخول.",
  "Please sign in to place your order.": "يرجى تسجيل الدخول لتأكيد الطلب.",
  "Unable to complete the request.": "تعذر إكمال الطلب. يرجى المحاولة مجددًا.",
  "Unable to load account.": "تعذر تحميل الحساب.",
  "Unable to place order. Your bag is saved.":
    "تعذر تأكيد الطلب. محتويات حقيبتك محفوظة.",
  "We could not load the collection. Please try again.":
    "تعذر تحميل المنتجات. يرجى المحاولة مجددًا.",
  "Provide weight, width, and height together, or leave all three empty.":
    "أدخل الوزن والعرض والارتفاع معًا، أو اتركها جميعًا فارغة.",
  "A category cannot be its own parent.": "لا يمكن أن تكون الفئة أبًا لنفسها.",
  "Maximum 12 photos.": "الحد الأقصى ١٢ صورة.",
  "Use JPEG, PNG, WebP, or AVIF images up to 5 MB.":
    "استخدم صور JPEG أو PNG أو WebP أو AVIF بحجم حتى ٥ ميجابايت.",
  "Discount cannot exceed the original price.":
    "لا يمكن أن يتجاوز السعر المخفض السعر الأصلي.",
  "A special deal needs a future expiry.":
    "يجب تحديد تاريخ انتهاء مستقبلي للعرض الخاص.",
  "Use an HTTPS image URL.": "استخدم رابط صورة آمنًا يبدأ بـ HTTPS.",
  "Administrator access required.": "يتطلب هذا الإجراء صلاحيات الإدارة.",
  "Invalid order status transition.": "لا يمكن تغيير حالة الطلب بهذه الطريقة.",
  "A product is no longer available.": "أحد المنتجات لم يعد متاحًا.",
  "Please complete the shipping address.": "يرجى إكمال عنوان الشحن.",
  "Invalid shipping address.": "عنوان الشحن غير صالح.",
  "Order notes are too long.": "ملاحظات الطلب أطول من الحد المسموح.",
  "Quantity must be a whole number from 1 to 999.":
    "يجب أن تكون الكمية عددًا صحيحًا بين ١ و٩٩٩.",
  "The selected category belongs to another shop.":
    "الفئة المحددة تنتمي إلى متجر آخر.",
  "The parent category belongs to another shop.":
    "الفئة الأم تنتمي إلى متجر آخر.",
  "A category cannot contain itself or one of its ancestors.":
    "لا يمكن أن تحتوي الفئة على نفسها أو إحدى الفئات الأم.",
  "Existing products belong to another shop.": "توجد منتجات مرتبطة بمتجر آخر.",
  "The category has children outside this shop.":
    "تحتوي الفئة على فئات فرعية خارج هذا المتجر.",
  "Your account changed. Check your orders before trying again.":
    "تم تغيير الحساب. تحقق من طلباتك قبل المحاولة مجددًا.",
};
const fields: Record<string, string> = {
  name_en: "الاسم بالإنجليزية",
  name_ar: "الاسم بالعربية",
  description_en: "الوصف بالإنجليزية",
  description_ar: "الوصف بالعربية",
  price: "السعر",
  discount_price: "السعر المخفض",
  stock_quantity: "المخزون",
  special_deal_ends_at: "انتهاء العرض",
  thumbnail_url: "الصورة الرئيسية",
  shop_id: "المتجر",
  category_id: "الفئة",
  fullName: "الاسم الكامل",
  identifier: "البريد الإلكتروني أو اسم المستخدم",
  username: "اسم المستخدم",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  slug: "الرابط",
  sku: "رمز المنتج",
};
export function localizeError(message: string, ar: boolean) {
  if (!ar) return message;
  return message
    .split(" · ")
    .map((part) => {
      if (messages[part]) return messages[part];
      const stock = part.match(/^Not enough stock for (.+)\.$/);
      if (stock) return `المخزون غير كافٍ للمنتج: ${stock[1]}.`;
      const field = part.match(/^([^:]+): (.+)$/);
      if (field)
        return `${fields[field[1]] || field[1]}: ${messages[field[2]] || field[2]}`;
      return part;
    })
    .join(" · ");
}
