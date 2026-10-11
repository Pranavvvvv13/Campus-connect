export async function turnstileConfig(local: boolean) {
  let bindings: Record<string, unknown> = {};
  try { bindings = (await import("cloudflare:workers")).env as unknown as Record<string, unknown>; } catch { /* Node development. */ }
  const siteKey = String(bindings.TURNSTILE_SITE_KEY || process.env.TURNSTILE_SITE_KEY || "");
  const secret = String(bindings.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY || "");
  if (siteKey && secret) return { siteKey, secret, testMode: false };
  if (local) return { siteKey: "1x00000000000000000000AA", secret: "1x0000000000000000000000000000000AA", testMode: true };
  return { siteKey: "", secret: "", testMode: false };
}

export async function verifyTurnstile(token: unknown, secret: string, hostname: string, testMode: boolean, fetcher: typeof fetch = fetch) {
  if (typeof token !== "string" || !token || token.length > 2048 || !secret) return false;
  try {
    const response = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body: new URLSearchParams({ secret, response: token }), signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean; hostname?: string; action?: string };
    return result.success === true && (testMode || (result.hostname === hostname && result.action === "login"));
  } catch { return false; }
}
