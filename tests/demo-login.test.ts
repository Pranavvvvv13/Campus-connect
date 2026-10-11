import test from "node:test";
import assert from "node:assert/strict";
import { hostedDemoEnabled, demoPasswordVariable } from "../lib/demo-login.ts";
test("hosted demo requires explicit opt-in and a configured strong-length secret", () => {
  assert.equal(hostedDemoEnabled(undefined, undefined), false);
  assert.equal(hostedDemoEnabled("false", "a-long-demo-password"), false);
  assert.equal(hostedDemoEnabled("true", "123"), false);
  assert.equal(hostedDemoEnabled("true", "a-long-demo-password"), true);
});
test("each role has a separate configured password and unknown roles fail closed", () => {
  assert.equal(demoPasswordVariable("Student"), "DEMO_LOGIN_PASSWORD");
  assert.equal(demoPasswordVariable("Faculty"), "DEMO_FACULTY_PASSWORD");
  assert.equal(demoPasswordVariable("Admin"), "DEMO_ADMIN_PASSWORD");
  assert.equal(demoPasswordVariable("superadmin"), null);
});
