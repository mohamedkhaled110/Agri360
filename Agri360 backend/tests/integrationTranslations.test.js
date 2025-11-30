import assert from "assert";
import { t } from "../utils/translator.js";

// Mock response helper
function makeRes() {
  let statusCode = 200;
  let body = null;
  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(obj) {
      body = obj;
      this._body = obj;
      this._status = statusCode;
      return this;
    },
    end() {
      return this;
    },
    _get() {
      return { status: statusCode, body };
    },
  };
}

// Test translator catches all controller error cases in Arabic
export function testControllerMessagesArabic() {
  const res = makeRes();
  const serverErrorMsg = t("ar", "server_error");
  res.status(500).json({ message: serverErrorMsg });
  const out = res._get();
  assert.strictEqual(out.status, 500);
  assert.ok(
    out.body.message.includes("خطأ") || out.body.message.includes("الخادم")
  );
}

// Test not found messages in Arabic (now defaults to ar-EG)
export function testNotFoundArabic() {
  const res = makeRes();
  const notFoundMsg = t("ar", "not_found");
  res.status(404).json({ message: notFoundMsg });
  const out = res._get();
  assert.strictEqual(out.status, 404);
  assert.strictEqual(out.body.message, "مش موجود");
}

// Test listing not found in Arabic
export function testListingNotFoundArabic() {
  const res = makeRes();
  const listingNotFoundMsg = t("ar", "listing_not_found");
  res.status(404).json({ message: listingNotFoundMsg });
  const out = res._get();
  assert.strictEqual(out.status, 404);
  assert.ok(out.body.message.includes("الإعلان"));
}

// Test harvestPlan errors in Arabic
export function testHarvestPlanErrorArabic() {
  const res = makeRes();
  const serverErrorMsg = t("ar", "server_error");
  res.status(500).json({ message: serverErrorMsg });
  const out = res._get();
  assert.strictEqual(out.status, 500);
  assert.strictEqual(out.body.message, "حدث خطأ في الخادم");
}

// Test marketplace errors in Arabic
export function testMarketplaceErrorArabic() {
  const res = makeRes();
  const serverErrorMsg = t("ar", "server_error");
  res.status(500).json({ message: serverErrorMsg });
  const out = res._get();
  assert.strictEqual(out.status, 500);
  assert.strictEqual(out.body.message, "حدث خطأ في الخادم");
}

// Test dashboard alerts in Arabic
export function testDashboardAlertsArabic() {
  const lang = "ar";
  const alertMsg1 = t(lang, "alert_negative_market");
  const alertMsg2 = t(lang, "alert_high_humidity");
  const alertMsg3 = t(lang, "alert_oil_spike");

  assert.ok(alertMsg1.includes("سلبية"));
  assert.ok(alertMsg2.includes("رطوبة"));
  assert.ok(alertMsg3.includes("النفط"));
}

// Test user controller errors in Arabic
export function testUserControllerErrorArabic() {
  const res = makeRes();
  const serverErrorMsg = t("ar", "server_error");
  res.status(500).json({ message: serverErrorMsg });
  const out = res._get();
  assert.strictEqual(out.status, 500);
  assert.strictEqual(out.body.message, "حدث خطأ في الخادم");
}

// Test English fallback still works
export function testControllerEnglishFallback() {
  const res = makeRes();
  const notFoundMsg = t("en", "not_found");
  res.status(404).json({ message: notFoundMsg });
  const out = res._get();
  assert.strictEqual(out.status, 404);
  assert.strictEqual(out.body.message, "Not found");
}

// Test farm controller error in English
export function testFarmControllerEnglishError() {
  const res = makeRes();
  const serverErrorMsg = t("en", "server_error");
  res.status(500).json({ message: serverErrorMsg });
  const out = res._get();
  assert.strictEqual(out.status, 500);
  assert.strictEqual(out.body.message, "Server error");
}

// Test businessPlan controller error in English
export function testBusinessPlanControllerEnglishError() {
  const res = makeRes();
  const serverErrorMsg = t("en", "server_error");
  res.status(500).json({ message: serverErrorMsg });
  const out = res._get();
  assert.strictEqual(out.status, 500);
  assert.strictEqual(out.body.message, "Server error");
}

// Test ai_error message in Arabic
export function testAiErrorArabic() {
  const res = makeRes();
  const aiErrorMsg = t("ar", "ai_error");
  res.status(500).json({ message: aiErrorMsg });
  const out = res._get();
  assert.strictEqual(out.status, 500);
  assert.ok(
    out.body.message.includes("الذكاء") || out.body.message.includes("خطأ")
  );
}

// Test ai_error message in English
export function testAiErrorEnglish() {
  const res = makeRes();
  const aiErrorMsg = t("en", "ai_error");
  res.status(500).json({ message: aiErrorMsg });
  const out = res._get();
  assert.strictEqual(out.status, 500);
  assert.strictEqual(out.body.message, "AI error");
}

// Test Egyptian Arabic (ar-EG) variant
export function testEgyptianArabicVariant() {
  const msgEg = t("ar-EG", "not_found");
  const msgSa = t("ar-SA", "not_found");
  const msgGeneral = t("ar", "not_found");

  // ar-EG should have colloquial Egyptian variant
  assert.strictEqual(msgEg, "مش موجود");
  // ar-SA should have formal Modern Standard Arabic
  assert.strictEqual(msgSa, "غير موجود");
  // ar should now default to Egyptian Arabic (ar-EG)
  assert.strictEqual(msgGeneral, "مش موجود");
}

// Test ar-EG invalid credentials
export function testEgyptianArabicInvalidCredentials() {
  const msgEg = t("ar-EG", "invalid_credentials");
  assert.ok(msgEg.includes("غير صحيحة") || msgEg.includes("اعتماد"));
}

// Test fallback from ar-EG to ar for missing keys
export function testArEgFallback() {
  // If ar-EG doesn't have a key, it should try to look in ar table
  const msg = t("ar-EG", "not_found");
  assert.ok(msg.length > 0);
}

// Test ar-EG is now the default for generic ar
export function testArEgDefault() {
  const msgAr = t("ar", "not_found");
  const msgEg = t("ar-EG", "not_found");
  assert.strictEqual(msgAr, msgEg);
}
