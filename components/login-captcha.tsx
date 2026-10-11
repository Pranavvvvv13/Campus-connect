"use client";
import { useEffect, useRef, useState } from "react";
type Turnstile = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
declare global { interface Window { turnstile?: Turnstile } }
let scriptPromise: Promise<void> | undefined;
function loadScript() {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true; script.onload = () => resolve(); script.onerror = () => { scriptPromise = undefined; script.remove(); reject(new Error("CAPTCHA could not load. Check your connection and retry.")); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}
export default function LoginCaptcha({ onToken, attempt, theme }: { onToken: (token: string) => void; attempt: number; theme: "light" | "dark" }) {
  const container = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("Loading verification…");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let disposed = false; let widget: string | undefined;
    onToken("");
    const clear = () => onToken("");
    void (async () => {
      const response = await fetch("/api/captcha", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load CAPTCHA configuration.");
      const config = await response.json() as { siteKey: string; testMode: boolean };
      if (!config.siteKey) throw new Error("CAPTCHA needs configuration by the site administrator.");
      await loadScript();
      if (disposed || !container.current || !window.turnstile) return;
      setMessage(config.testMode ? "Local CAPTCHA test mode · production keys required for bot protection" : "Complete the security verification.");
      widget = window.turnstile.render(container.current, { sitekey: config.siteKey, action: "login", theme, size: "flexible", callback: (token: string) => { if (!disposed) onToken(token); }, "expired-callback": clear, "timeout-callback": clear, "error-callback": () => { clear(); setMessage("Verification failed. Please retry."); } });
    })().catch(error => { if (!disposed) setMessage(error instanceof Error ? error.message : "Verification unavailable."); });
    return () => { disposed = true; if (widget && window.turnstile) window.turnstile.remove(widget); };
  }, [onToken, attempt, theme, retry]);
  return <div className="login-captcha"><div ref={container}/><p role="status">{message}</p><button type="button" className="text-button" onClick={() => setRetry(value => value + 1)}>Retry verification</button></div>;
}
