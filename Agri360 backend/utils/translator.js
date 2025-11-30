const translations = {
  en: {
    name_email_password_required: "name, email and password are required",
    email_already_registered: "Email already registered",
    server_error: "Server error",
    email_password_required: "email and password required",
    invalid_credentials: "Invalid credentials",
    unauthorized: "Unauthorized",
    missing_field: "Missing field: {field}",
    not_found: "Not found",
    listing_not_found: "Listing not found",
    ai_error: "AI error",
    alert_negative_market: "⚠️ Negative market sentiment detected",
    alert_high_humidity: "⚠️ High humidity warning",
    alert_oil_spike: "⚠️ Oil price spike may affect input costs",
  },
  ar: {
    name_email_password_required:
      "الاسم والبريد الإلكتروني وكلمة المرور مطلوبة",
    email_already_registered: "البريد الإلكتروني مسجل بالفعل بالفعل",
    server_error: "حدث خطأ في الخادم",
    email_password_required: "البريد الإلكتروني وكلمة المرور مطلوبان",
    invalid_credentials: "بيانات اعتماد غير صحيحة",
    unauthorized: "غير مصرح",
    missing_field: "الحقل مفقود: {field}",
    not_found: "مش موجود",
    listing_not_found: "الإعلان مش موجود",
    ai_error: "خطأ في الذكاء الاصطناعي",
    alert_negative_market: "⚠️ في مشاعر سوقية سلبية",
    alert_high_humidity: "⚠️ تحذير: الرطوبة عالية قوي",
    alert_oil_spike: "⚠️ أسعار النفط طلعت وممكن تأثر على التكاليف",
  },
  "ar-EG": {
    name_email_password_required:
      "الاسم والبريد الإلكتروني وكلمة المرور مطلوبة",
    email_already_registered: "البريد الإلكتروني مسجل بالفعل بالفعل",
    server_error: "حدث خطأ في الخادم",
    email_password_required: "البريد الإلكتروني وكلمة المرور مطلوبان",
    invalid_credentials: "بيانات اعتماد غير صحيحة",
    unauthorized: "غير مصرح",
    missing_field: "الحقل مفقود: {field}",
    not_found: "مش موجود",
    listing_not_found: "الإعلان مش موجود",
    ai_error: "خطأ في الذكاء الاصطناعي",
    alert_negative_market: "⚠️ في سوقية سلبية",
    alert_high_humidity: "⚠️ تحذير: الرطوبة عالية قوي",
    alert_oil_spike: "⚠️ أسعار النفط طلعت وممكن تأثر على التكاليف",
  },
  "ar-SA": {
    name_email_password_required:
      "الاسم والبريد الإلكتروني وكلمة المرور مطلوبة",
    email_already_registered: "البريد الإلكتروني مسجل بالفعل",
    server_error: "حدث خطأ في الخادم",
    email_password_required: "البريد الإلكتروني وكلمة المرور مطلوبان",
    invalid_credentials: "بيانات غير صالحة",
    unauthorized: "غير مصرح",
    missing_field: "الحقل مفقود: {field}",
    not_found: "غير موجود",
    listing_not_found: "الإعلان غير موجود",
    ai_error: "خطأ في الذكاء الاصطناعي",
    alert_negative_market: "⚠️ اكتشاف  سوقية سلبية",
    alert_high_humidity: "⚠️ تحذير: رطوبة عالية",
    alert_oil_spike: "⚠️ ارتفاع أسعار النفط قد يؤثر على تكاليف المدخلات",
  },
};

export function t(lang = "en", key, vars = {}) {
  // Determine locale: try exact match, then fallback to regional code, then to 'ar-EG' (default Egyptian), then 'en'
  let locale = "en";
  if (lang) {
    if (translations[lang]) {
      locale = lang;
    } else if (lang.startsWith("ar")) {
      // For ar-EG, ar-SA, ar-something: try exact match first, then fallback to 'ar-EG' (default Egyptian)
      locale = translations[lang] ? lang : "ar-EG";
    }
  }

  const template =
    (translations[locale] && translations[locale][key]) ||
    translations.en[key] ||
    key;
  return template.replace(/\{(\w+)\}/g, (_, name) =>
    vars[name] !== undefined ? vars[name] : `{${name}}`
  );
}

export default { t };
