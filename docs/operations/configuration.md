# Application configuration

Production is not configured. Local environment files remain on disk and are now ignored. Untracking does not remove values from Git history. Never print or commit credentials.

## Private exposure review (names only)

- `MONGO_URL`: loopback connection at inspection; no cloud credentials identified in this value.
- `backend/.env`: populated `EMERGENT_LLM_KEY` was tracked; treat as potentially exposed and rotate/revoke before production. Value intentionally omitted.

## Variables and storage


Templates contain names and safe local examples, never actual production credentials. `APP_ENV=local|test|production` is validated centrally. Production must reject placeholders for every required value.

| Variable | Where used / stored | Local preparation | Production requirement |
| --- | --- | --- | --- |
| `APP_ENV`, `APP_GIT_SHA` | Backend | local/test and source SHA | production and actual deployed SHA |
| `MONGO_URL`, `DB_NAME` | Render secret/config; ignored backend env | loopback / dedicated local namespace | TLS Atlas URI; dedicated database |
| `TEST_MONGO_URL` | Local test env / CI only | isolated loopback Mongo | Must not be present as a production data source |
| `CORS_ORIGINS`, `PUBLIC_FRONTEND_URL` | Backend configuration | exact loopback frontend | exact reviewed HTTPS preview/final origins |
| `NOTIFICATION_MODE` | Backend | fake, using loopback simulator | live; fake is rejected |
| `RESEND_API_KEY` | Render secret | unused in fake mode | scoped sending key |
| `EMAIL_FROM_NAME`, `SENDER_EMAIL` | Backend config | synthetic sender | owned, verified sender identity |
| `NOTIFY_EMAILS`, `SUPPORT_EMAIL` | Backend config | controlled synthetic values | approved Gmail destinations and actual support address |
| `SLACK_WEBHOOK_URL` | Render secret | unused in fake mode | approved channel's incoming webhook |
| `NEWSLETTER_SIGNING_KEY`, `RATE_LIMIT_HMAC_KEY` | Render secrets | explicit test-only generated values | independent strong generated keys, rotation procedure |
| `BOT_MODE` | Backend | fake | turnstile; fake is rejected |
| `TURNSTILE_SECRET_KEY`, `TURNSTILE_HOSTNAMES` | Render secret/config | fake verifier, loopback | real key and exact allowed hostnames/actions |
| `LOCAL_PROVIDER_BASE_URL` | Local/test only | loopback simulator | forbidden |
| `WORKER_ENABLED`, poll/lease/retry settings | Backend config | enabled with fake adapters | enabled with validated bounds |
| `TRUSTED_PROXY_CIDRS` | Backend/deployment config | none | verified Render proxy settings; do not trust arbitrary headers |
| Rate/retention limits | Backend config | design defaults with test clock | reviewed values and scheduled operations |
| `REACT_APP_BACKEND_URL` | Public frontend build variable | `http://127.0.0.1:8300` | final HTTPS API origin; never a secret |
| `REACT_APP_TURNSTILE_SITE_KEY`, `REACT_APP_TURNSTILE_MODE` | Public frontend build | local widget fixture / test mode only in test harness | real site key, live mode |
| `RENDER_DEPLOY_HOOK_URL`, `RENDER_API_TOKEN` | GitHub production environment secrets | absent; mock helper tests | authorized service-scoped deployment access where supported |
| `RENDER_SERVICE_ID`, `PUBLIC_API_URL` | GitHub variables | fixture values | actual service ID/API URL |
| `CLOUDFLARE_API_TOKEN` | GitHub production environment secret | absent; no upload | narrowly scoped Pages deployment token |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT` | GitHub variables | placeholders | actual account/project |
| `DEPLOYMENT_ENABLED` | GitHub repository variable | false | true only at final activation |

No runtime provider secret belongs in `REACT_APP_*`, a Pages build artifact or a CI artifact. No password is needed for Gmail under the selected architecture. The production environment and Pages project are prepared in code locally but created/configured only at final activation.

## Runtime isolation

Use Python 3.12 in `backend/.venv-intake` for this implementation. The old `.venv` is left intact while the previously started backend is running. Replace `.venv/bin/python` with `.venv-intake/bin/python` in plan commands. Node 22 and Yarn 1.22.22 are the frontend targets. Runtime dependency pins are compiled from requirements.in; dev pins include runtime pins. The optional image generator is excluded from web installation.

## Proxy boundary

Start Uvicorn with `--no-proxy-headers`. The app interprets X-Forwarded-For only when the original socket peer belongs to configured TRUSTED_PROXY_CIDRS, walking from the right through trusted hops. Keep this list empty locally. Final Render setup must verify the actual proxy addresses/header behavior before claiming client-specific rate enforcement. Never trust a blanket 0.0.0.0/0 or ::/0.

## Newsletter signing-key rotation

Rotating NEWSLETTER_SIGNING_KEY invalidates outstanding confirmation and unsubscribe links. Keep the current key stable during normal releases. If a key is exposed, rotate it, preserve subscription state, and let users request fresh confirmation; operators handle unsubscribe requests through the reviewed private data workflow. Tokens have fixed HS256/issuer/audience/purpose and no email claim.

Frontend builds now require `REACT_APP_TURNSTILE_MODE=live`, a public site key and an explicit API origin. Use `BUILD_TARGET=local` with a loopback API and a test-only intercepted widget script for local release-bundle verification. Fake mode is only allowed by the development server/tests, never by the release build. Widget implementation follows [Cloudflare explicit rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/), checked 2026-10-17.

Retention runs are private CLI operations, read-only by default. Configure reviewed day values with explicit CLI options and require `--database`, `--policy-approved` and `--apply` for scheduled retention. See [data lifecycle and restore](data-retention-and-recovery.md). Active terminal slots retain minimal dedupe markers after detailed outcome expiry; historical completed slots are removed. No automatic subscribed/suppression deletion schedule is enabled.

## CI and Pages artifact identity

CI uses a pinned Mongo 8.0.17 image as a single-node replica set, fresh dependencies, backend/frontend tests and desktop/mobile browser flows. The manifest binds the commit SHA, approved public configuration and every artifact file's checksum. Deployment must download that exact artifact without rebuilding. Production-configured browser checks forward only the configured API origin to an isolated real local API; Turnstile/provider HTTP remains simulated. This proves local behavior, not provider connectivity.

Cloudflare Direct Upload serves `frontend/build`. The build creates an API-specific CSP, allows the existing Google fonts and same-origin images, and disables caching/indexing on newsletter action routes. With no top-level `404.html`, Pages provides native SPA fallback; `_redirects` deliberately has no catch-all rewrite that could shadow real assets. [Pages serving behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/) and [headers](https://developers.cloudflare.com/pages/configuration/headers/) were checked on 2026-10-17.

Local Pages verification uses Wrangler 4.151.1 (`wrangler pages dev frontend/build --ip 127.0.0.1 --port 4400 --compatibility-date 2026-10-12`). All 92 desktop/mobile browser checks passed against this local Pages runtime, plus direct header/asset checks. Actual Pages edge headers, TLS and custom domains remain final activation checks.

The disabled monitor checks liveness, readiness and delivery health every five minutes after `DEPLOYMENT_ENABLED=true`. GitHub schedules are best effort; assign workflow-failure notification ownership, verify alert receipt and inspect the queue daily. This is not a realtime monitoring SLA.
