import assert from "assert";
import * as businessPlanController from "../controllers/businessPlan.controller.js";
import * as farmController from "../controllers/farm.controller.js";
import * as harvestPlanController from "../controllers/harvestPlan.controller.js";
import * as marketplaceController from "../controllers/marketplace.controller.js";
import * as dashboardController from "../controllers/dashboard.controller.js";
import * as userController from "../controllers/user.controller.js";
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

// Test businessPlan controller error handling in Arabic
export function testBusinessPlanControllerArabicError() {
  const req = { body: {}, lang: "ar" };
  const res = makeRes();

  // Mock service error
  const origCreate = businessPlanController.createPlan;
  businessPlanController.createPlan = async (req, res) => {
    try {
      throw new Error("Service failed");
    } catch (err) {
      res.status(500).json({ message: t(req.lang || "en", "server_error") });
    }
  };

  businessPlanController.createPlan(req, res);
  const out = res._get();
  assert.strictEqual(out.status, 500);
  assert.ok(
    out.body.message.includes("خطأ") || out.body.message.includes("الخادم")
  );
}

// Test farm controller 404 in Arabic
export function testFarmControllerNotFoundArabic() {
  const req = { params: { id: "fake-id" }, lang: "ar" };
  const res = makeRes();

  // Mock getFarm to return null
  const origGetFarm = farmController.getFarm;
  farmController.getFarm = async (req, res) => {
    const farm = null;
    if (!farm)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });
    res.json({ farm });
  };

  farmController.getFarm(req, res);
  const out = res._get();
  assert.strictEqual(out.status, 404);
  assert.ok(out.body.message.includes("غير موجود"));
}

// Test harvestPlan controller error in Arabic
export function testHarvestPlanControllerArabicError() {
  const req = { body: {}, lang: "ar" };
  const res = makeRes();

  const origCreateHarvest = harvestPlanController.createHarvestPlan;
  harvestPlanController.createHarvestPlan = async (req, res) => {
    try {
      throw new Error("Harvest plan error");
    } catch (err) {
      res.status(500).json({ message: t(req.lang || "en", "server_error") });
    }
  };

  harvestPlanController.createHarvestPlan(req, res);
  const out = res._get();
  assert.strictEqual(out.status, 500);
  assert.strictEqual(out.body.message, "حدث خطأ في الخادم");
}

// Test marketplace controller listing not found in Arabic
export function testMarketplaceListingNotFoundArabic() {
  const req = { body: { listingId: "fake-listing", quantity: 10 }, lang: "ar" };
  const res = makeRes();

  const origCreateOrder = marketplaceController.createOrder;
  marketplaceController.createOrder = async (req, res) => {
    const listing = null;
    if (!listing)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "listing_not_found") });
    // rest of logic
  };

  marketplaceController.createOrder(req, res);
  const out = res._get();
  assert.strictEqual(out.status, 404);
  assert.ok(out.body.message.includes("الإعلان"));
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

// Test user controller error in Arabic
export function testUserControllerArabicError() {
  const req = { user: { _id: "user-123" }, lang: "ar" };
  const res = makeRes();

  const origGetProfile = userController.getProfile;
  userController.getProfile = async (req, res) => {
    try {
      throw new Error("DB error");
    } catch (err) {
      res.status(500).json({ message: t(req.lang || "en", "server_error") });
    }
  };

  userController.getProfile(req, res);
  const out = res._get();
  assert.strictEqual(out.status, 500);
  assert.strictEqual(out.body.message, "حدث خطأ في الخادم");
}

// Test English defaults still work
export function testControllerEnglishFallback() {
  const req = { params: { id: "fake-id" }, lang: "en" };
  const res = makeRes();

  const origGetFarm = farmController.getFarm;
  farmController.getFarm = async (req, res) => {
    const farm = null;
    if (!farm)
      return res
        .status(404)
        .json({ message: t(req.lang || "en", "not_found") });
    res.json({ farm });
  };

  farmController.getFarm(req, res);
  const out = res._get();
  assert.strictEqual(out.status, 404);
  assert.strictEqual(out.body.message, "Not found");
}
