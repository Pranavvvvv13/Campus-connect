import test from "node:test";
import assert from "node:assert/strict";
import { verifyTurnstile } from "../lib/turnstile.ts";
const reply = (data: object) => (async () => Response.json(data)) as typeof fetch;
test("CAPTCHA requires a token and secret", async () => {
  assert.equal(await verifyTurnstile("", "secret", "example.com", false), false);
  assert.equal(await verifyTurnstile("token", "", "example.com", false), false);
});
test("production verification requires success, expected hostname and login action", async () => {
  for (const result of [{success:false}, {success:true,hostname:"evil.com",action:"login"}, {success:true,hostname:"example.com",action:"other"}]) {
    assert.equal(await verifyTurnstile("token", "secret", "example.com", false, reply(result)), false);
  }
  assert.equal(await verifyTurnstile("token", "secret", "example.com", false, reply({success:true,hostname:"example.com",action:"login"})), true);
});
test("network failure and replay rejection fail closed", async () => {
  assert.equal(await verifyTurnstile("token", "secret", "example.com", false, (async () => { throw new Error("offline"); }) as typeof fetch), false);
  assert.equal(await verifyTurnstile("token", "secret", "example.com", false, reply({success:false,"error-codes":["timeout-or-duplicate"]})), false);
});
