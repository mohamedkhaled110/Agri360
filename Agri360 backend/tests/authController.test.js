import assert from "assert";
import { register, login } from "../controllers/auth.controller.js";

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
    },
    _get() {
      return { status: statusCode, body };
    },
  };
}

export function testRegisterMissingFieldsArabic() {
  const req = { body: { name: "Ali", email: "ali@example.com" }, lang: "ar" };
  const res = makeRes();
  register(req, res);
  const out = res._get();
  assert.strictEqual(out.status, 400);
  assert.ok(
    out.body.message.includes("الاسم") || out.body.message.includes("مطلوبة")
  );
}

export function testLoginMissingFieldsArabic() {
  const req = { body: { email: "" }, lang: "ar" };
  const res = makeRes();
  login(req, res);
  const out = res._get();
  assert.strictEqual(out.status, 400);
  assert.ok(
    out.body.message.includes("البريد الإلكتروني") ||
      out.body.message.includes("مطلوب")
  );
}
