# Login CAPTCHA

The login uses Cloudflare Turnstile. The server validates each submitted token with Siteverify before creating a local demo session. Production validation checks the login action and request hostname; failures reject the request. Tokens are reset after failed login attempts.

Local development without widget keys uses Cloudflare's official test keys, labelled in the form. These test keys do not offer bot protection.

For a real widget, open Cloudflare dashboard → Turnstile → Add widget. Choose Managed mode and add the public site's exact hostname. Add localhost only to a separate development widget if needed. Set Worker runtime variable `TURNSTILE_SITE_KEY` to the public site key and Worker runtime secret `TURNSTILE_SECRET_KEY` to the private secret. Do not commit the secret. The public configuration endpoint exposes only the site key and test-mode flag.

For the hosted teacher preview, set Worker runtime variable `ENABLE_DEMO_LOGIN=true` and runtime secret `DEMO_LOGIN_PASSWORD` to a private password of at least 12 characters. Only the existing student demo account `pk9261@srmist.edu.in` can sign in remotely, and a real Turnstile widget must pass server verification. Faculty and admin demo accounts remain local-only. Disable the preview afterward by setting `ENABLE_DEMO_LOGIN=false`. Local demo password `123` does not work on the hosted preview. Real university authentication remains a separate integration.

References: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ and https://developers.cloudflare.com/turnstile/troubleshooting/testing/
