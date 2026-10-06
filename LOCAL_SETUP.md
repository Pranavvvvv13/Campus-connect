# CampusConnect local setup

## Requirements

- Node.js 22.13 or newer
- pnpm 11.25.0 (`npm install -g pnpm@11.25.0`)

## Start the local prototype

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:5173` (or the address printed in the terminal).
Run these commands from the extracted campus-connect folder. Keep the terminal open; press Ctrl+C to stop.

## Account workspace features

- Admin sign-in opens a database-backed dashboard with Overview, Accounts and Activity views. Counts reflect the three demo sign-in accounts, saved portfolios, active sessions, bookmarks and pending team requests. Mock directory profiles are not sign-in accounts.
- Account controls support suspension, restoration and session revocation. Each change requires a reason and writes a persistent audit entry. Suspended accounts cannot sign in or use authenticated APIs; administrator accounts are protected from these controls. No accounts or portfolio contents are deleted.
- Run `node tests/admin-api.mjs` against the local server to verify role enforcement and access controls. It restores student access and leaves clearly labelled automated verification entries in the audit log.

- Faculty and administrators have a Student portfolios directory with name/ID/project search and department, year and skill filters. Eight fictional profiles are clearly marked as mock students. Student account portfolios appear only after enabling “Share my portfolio with faculty” in Edit portfolio. The API rejects student access and excludes private email/account fields.

- Portfolios, hackathon bookmarks, reminder preferences and team requests are stored in the local Cloudflare D1 database. The `DB` binding is enabled in `.openai/hosting.json`; the workspace schema initializes automatically.
- The local database and sessions persist in ignored `.wrangler` state across development server restarts. Do not delete that state if you need your saved data.
- Demo sign-in now creates a server session with an HttpOnly cookie, checks the selected role on the server, and isolates saved data by university ID. Demo login is restricted to local development. It is not production university authentication.
- Team finder is opt-in through Edit portfolio. It lists only members who enabled it; no example teammates are added automatically. Requests are in-app and do not send email.
- Deadline reminders appear while the workspace is open. “Add deadline to calendar” downloads an `.ics` file with an alarm; import it into your calendar for reminders while the app is closed. This app does not send background push or email reminders.
- Hosted access from multiple devices requires deployment with a real D1 database and university authentication. The local database is not a provisioned cloud database.

Validation commands:

```bash
node node_modules/typescript/bin/tsc --noEmit
pnpm lint
node --experimental-strip-types --test tests/workspace-model.test.mjs
# With pnpm dev running; test fixtures are restored afterward:
node tests/workspace-api.mjs
```

This package includes the spatial minimalist UI, light/dark mode and nine clubs. Hackathon listings are fetched live from Devfolio and Unstop and refresh every five minutes while the page is visible. SF Pro Display is bundled locally; My portfolio is under User settings. Login is a local demo, not production authentication.

## Demo accounts

### Demonstrate the working model

1. Sign in as Student and open **My portfolio** from the navigation. Add skills, a project and an achievement, then enable **Share my portfolio with faculty** and save.
2. Sign out under **Settings → Account**, sign in as Faculty, and open **Student portfolios**. Search for the student name or a project keyword and open the saved portfolio. The eight mock students remain clearly labelled.
3. Open **Hackathons** and switch between Devfolio and Unstop. Artwork is fetched from provider metadata (Unstop uses logos where banners are absent). Open **Event details** to inspect the description and dates, then follow the provider application link.
4. Student accounts can save an event and export its deadline to their calendar. Faculty accounts have no saved-hackathon controls.

Event artwork loads lazily and falls back to a styled card if it fails. Missing eligibility and venue details are referred to the provider; they are not guessed.

| Portal | University ID | Email | Verification code |
|---|---|---|---|
| Student | `STU-2026-001` | `pranav.iyer@university.edu` | `246810` |
| Faculty | `FAC-2026-001` | `meera.raman@university.edu` | `246810` |
| Admin | `ADM-2026-001` | `admin@university.edu` | `246810` |

The selected portal must match the role assigned to the ID. The demo authentication is intentionally isolated in `app/campus-portal.tsx`; it is not suitable for real users or real university data.

## Before connecting real data

1. Replace `demoDirectory` and the demo verification step with the university OIDC/SAML provider.
2. Enforce roles in server middleware and every API handler using `lib/authorization.ts`.
3. Provision the production database using `db/production-schema.sql` as the reviewed starting model.
4. Store document uploads in private object storage and scan every upload.
5. Configure secrets outside source control.
6. Complete the controls in `docs/PRODUCTION_READINESS.md`.

Never import real student information into this demo build.

## Next.js local preview

If the Vite preview is unavailable, run `node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3000` and open http://127.0.0.1:3000.

