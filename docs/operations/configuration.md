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

