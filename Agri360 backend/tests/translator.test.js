import assert from "assert";
import { t } from "../utils/translator.js";

export function testTranslatorArabic() {
  const en = t("en", "name_email_password_required");
  const ar = t("ar", "name_email_password_required");
  assert.strictEqual(
    en,
    "name, email and password are required",
    "EN translation should match"
  );
  assert.strictEqual(
    ar,
    "الاسم والبريد الإلكتروني وكلمة المرور مطلوبة",
    "AR translation should match"
  );
}

export function testTemplateSubstitution() {
  const msg = t("ar", "missing_field", { field: "email" });
  assert.strictEqual(msg, "الحقل مفقود: email", "Template substitution works");
}
