export function hostedDemoEnabled(enabled: unknown, password: unknown) {
  return enabled === "true" && typeof password === "string" && password.length >= 12;
}
export function demoPasswordVariable(role: string) {
  return role === "Student" ? "DEMO_LOGIN_PASSWORD" : role === "Faculty" ? "DEMO_FACULTY_PASSWORD" : role === "Admin" ? "DEMO_ADMIN_PASSWORD" : null;
}
export async function demoLoginConfig(role: string) {
  let bindings: Record<string, unknown> = {};
  try { bindings = (await import("cloudflare:workers")).env as unknown as Record<string, unknown>; } catch { /* Local Node runtime. */ }
  const variable = demoPasswordVariable(role);
  const password = variable ? bindings[variable] || process.env[variable] : undefined;
  const enabled = bindings.ENABLE_DEMO_LOGIN || process.env.ENABLE_DEMO_LOGIN;
  return { enabled: hostedDemoEnabled(enabled, password), password: typeof password === "string" ? password : "" };
}
