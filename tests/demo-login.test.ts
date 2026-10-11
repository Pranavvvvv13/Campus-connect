import test from "node:test";
import assert from "node:assert/strict";
import { hostedDemoEnabled } from "../lib/demo-login.ts";
test("hosted demo requires explicit opt-in and a configured strong-length secret", () => {
  assert.equal(hostedDemoEnabled(undefined, undefined), false);
  assert.equal(hostedDemoEnabled("false", "a-long-demo-password"), false);
  assert.equal(hostedDemoEnabled("true", "123"), false);
  assert.equal(hostedDemoEnabled("true", "a-long-demo-password"), true);
});
