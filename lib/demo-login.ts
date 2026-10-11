export function hostedDemoEnabled(enabled: unknown, password: unknown) {
  return enabled === "true" && typeof password === "string" && password.length >= 12;
}
export async function demoLoginConfig() {
  let bindings: Record<string, unknown> = {};
  try { bindings = (await import("cloudflare:workers")).env as unknown as Record<string, unknown>; } catch { /* Local Node runtime. */ }
  const password = bindings.DEMO_LOGIN_PASSWORD || process.env.DEMO_LOGIN_PASSWORD;
  const enabled = bindings.ENABLE_DEMO_LOGIN || process.env.ENABLE_DEMO_LOGIN;
  return { enabled: hostedDemoEnabled(enabled, password), password: typeof password === "string" ? password : "" };
}
