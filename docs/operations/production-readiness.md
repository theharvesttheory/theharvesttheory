# Production readiness ledger

Status: Tasks 1–39 complete locally (Gate A/B `verified_local`); Tasks 40–44 remain incomplete. Provider setup has begun; end-to-end production delivery is not yet verified.

## 2026-10-25 Render Free adaptation

The owner selected Free and authorized adapting deployment expectations. The [adaptation plan](../plans/2026-10-25-render-free.md) supersedes the original paid-only requirement: blueprint and release validators accept Free, forms allow 90 seconds for a response, and scheduled monitoring skips Free rather than acting as a keep-alive. Main-only releases, owner approvals, exact commit/artifact verification, TLS and readiness checks remain enforced. Notification work pauses during sleep; saved Atlas records survive. This change is not proof of live cold-start behavior or email/Slack delivery. Business/privacy/retention approval, release, custom-domain cutover and observation remain pending. The verification tables below describe the original 2026-10-17 implementation, including its former 15-second request timeout.

Baseline: `main` at `5ea0ba7494e41899c71cd366d93581cf271c8fe3` (2026-10-17). The active checkout is used as requested. Existing `.agents/`, `.pui/`, `graphify-out/` and `skills-lock.json` are preserved.

Authoritative [implementation plan](../plans/2026-10-17-production-forms-plan.md) and [design](../plans/2026-10-17-production-forms-design.md).

## Baseline evidence

- `frontend/src/pages/Contact.jsx` has nine schema-driven forms whose handler only changes local success state.
- `frontend/src/components/Footer.jsx` changes newsletter state without persistence.
- `backend/server.py` has greeting/status templates and no business intake routes.
- The seven content route families plus 13 products, two collections and six journal articles comprise 28 content URLs.
- Existing local processes on 3000/8000 and MongoDB on 27017 are preserved; tests use isolated databases and ports.
- No application business tests existed at baseline. Historical reports are not passing evidence for this implementation.

## Task tracking

| Task | Status | Evidence |
| --- | --- | --- |
| 1: Record the baseline and a traceable acceptance ledger | complete | Baseline source/status inspected; plan committed. |
| 2: Stop tracking environment files and define safe configuration templates | complete | Ignored local files retained; templates and configuration/exposure review recorded. |
| 3: Make clean installation independent of Emergent | complete | Python 3.12.15 fresh pinned install passes dependency check; Node 22.23.3 frozen Yarn install and production build passed. Development server compiled and HTTP smoke passed at 4300. Existing Yarn override/peer warnings retained. |
| 4: Introduce validated settings and an app factory | complete | 24 configuration/lifecycle tests passed after observed missing-feature failures. No import-time database access; startup/shutdown cleanup verified. TestClient emits upstream httpx deprecation warnings. |
| 5: Build isolated real-Mongo test fixtures | complete | Five real-Mongo/isolation guard tests pass with the unchanged two xdist workers; test-owned namespaces are dropped on teardown. |
| 6: Extract the nine-type contract without changing visible form fields | complete | Three backend contract tests and frontend schema parity test pass after missing-contract failures; same field IDs, labels and required flags retained. |
| 7: Validate and normalize enquiry payloads | complete | 49 validation tests pass: all nine types, required/unknown fields, strict types, limits, normalized hashes and safe source paths. |
| 8: Create Mongo repositories, indexes and truthful health endpoints | complete | Real unique-index/duplicate-write checks, index failure, DB outage, safe health/version and absent public data/docs routes passed. |
| 9: Atomically save an enquiry with its pending jobs | complete | Four real-Mongo tests passed: atomic record/jobs, replay/conflict, ten concurrent retries, and lost acknowledgement after commit. |
| 10: Expose enquiry creation with safe receipts and errors | complete | API tests pass for all nine types, UUID keys, replay/conflict, safe validation and database outage responses. Delivery snapshots await Task 19 rendering; no provider calls occur. |
| 11: Bound public requests and configure CORS explicitly | complete | Eight boundary tests pass: byte/stream limits, media type, safe malformed/unexpected errors, exact CORS and non-browser validation. |
| 12: Add shared rate limits and a honeypot | complete | Seven tests passed: shared app quotas, atomic concurrent increments, reset windows, global cap, spoofed headers, honeypot, closed DB failures and verified proxy-chain parsing. |
| 13: Verify Turnstile server-side and handle safe retries | complete | Twelve mocked-provider tests pass: strict Siteverify checks, outages, single-use replay ordering, fresh-token retry after failed save and direct forged-token rejection with zero records. Actual Turnstile remains a final provider gate. |
| 14: Implement newsletter action tokens | complete | Twelve tests pass for deterministic signed actions, required claims, issuer/audience/purpose, UUID identity, expiry, key changes and algorithm rejection. |
| 15: Persist newsletter requests and suppress repeated confirmation sends | complete | Nine real-Mongo tests pass: consent validation, concurrent canonical-email dedupe, cooldown/resend generation, subscribed privacy and preserved pending operational jobs across re-signup. |
| 16: Make confirmation and unsubscribe atomic and idempotent | complete | Five transition tests pass, including concurrent confirm/unsubscribe and one job set. Task 18 also proves stale confirmation completion is rejected after generation changes. |
| 17: Expose safe newsletter endpoints | complete | Six API tests passed for generic signup receipts, explicit POST actions, safe token errors, DB failure, action limits and honeypot; 32 newsletter tests passed together. |
| 18: Claim due jobs with expiring leases and fenced completion | complete | Ten real-Mongo lease tests passed: competing workers, expiry/recovery, stale completion, historical jobs and generation changes. |
| 19: Build immutable, escaped notification payloads | complete | Thirteen rendering tests and dependent intake/newsletter tests passed. Email escapes field content; Slack contains only type/time/reference; newsletter links use fragments. No placeholder payloads remain in production builders. |
| 20: Implement the Resend adapter and its error classification | complete | Eleven HTTP transport tests pass: fixed endpoint/key/payload, acceptance ID, retry classification, ambiguous timeout and bounded Retry-After. No live email sent. |
| 21: Implement the Slack adapter independently | complete | Eleven HTTP transport tests pass: approved destination, fixed timeout, response classification and webhook log redaction. Ambiguous retries can duplicate Slack messages; stable references support reconciliation. |
| 22: Persist retry schedules and isolate provider failures | complete | Twelve retry tests plus ten lease tests pass, including independent channels, bounded jitter/Retry-After, attempt/23-hour limits, historical jobs and lost completion. Ambiguous exhausted jobs remain paused for reconciliation. |
| 23: Run and supervise the worker inside app lifespan | complete | Five worker tests plus eight lifecycle/health tests pass: overlapping workers, independent channels, transient DB recovery, bounded shutdown and failed-loop readiness. Local HTTP adapter only reports simulated delivery. |
| 24: Add private delivery diagnostics and guarded recovery commands | complete | Seven admin/health tests pass: redacted metadata, historical jobs, dry-run, stale identity/cancelled-generation rejection, explicit ambiguous replay and independent public delivery health. Recovery runbook added; production alert wiring remains deferred. |
| 25: Add one API client with bounded timeouts and deliberate retry keys | complete | Ten request tests pass: 15-second abort, safe error parsing, valid receipt checks, no automatic POST retry, unchanged-body UUID reuse and membership POST bodies. |
| 26: Replace Contact's local success toggle with durable submission states | complete | Eleven form tests fail against the original preview handler and pass with durable receipt handling: all nine schemas, pending locks, retained values/key reuse, edited-key replacement, prefill and unmount cancellation. |
| 27: Connect newsletter signup with explicit consent and honest copy | complete | Component tests pass for unchecked required consent, duplicate-click prevention, pending state, keyboard operation, focused errors and retained values. Success asks the visitor to check email for confirmation. |
| 28: Add explicit newsletter confirmation and unsubscribe pages | complete | Three action-page tests pass: explicit POST only, fragment removal, StrictMode token preservation, metadata and invalid/expired-link recovery. |
| 29: Integrate the challenge widget without losing retry state | complete | Twenty widget/build/form tests pass: shared loader, separate actions, expiry/cleanup, visible errors, fresh-token retries retaining the UUID, and release rejection of fake/missing widget configuration. Genuine Turnstile remains a provider gate. |
| 30: Provide the intake privacy page and review business-facing copy | complete | Privacy route/link and production approval-guard tests pass; all 38 frontend tests pass. Owner identity, contacts, retention and business facts remain explicitly pending in the launch checklist. Desktop/mobile proof is Task 32. |
| 31: Provide a repeatable local stack and deterministic provider simulator | complete | Four launcher guards pass. Real start/save/two simulated captures/owned stop verified; Mongo receipt 641722ba-59dc-4d3f-8fe8-3d8f533ba7e0. Existing 3000/8000 listeners preserved. |
| 32: Exercise every form through a real browser, API and database | complete | 92 desktop/mobile development-browser checks passed; 26 core flows also passed against the release bundle. All nine types, real Mongo receipts, captured jobs, newsletter lifecycle, 422/429/503, response loss, double submit, 31 routes/reloads/images and prefills verified. Bot/provider transport remains simulated. |
| 33: Prove recovery after restart, outage and ambiguous acknowledgement | complete | Five subprocess/API recovery tests pass: independent-provider outage, restart with persisted budget, crash after acceptance, stable email identity versus Slack duplicate risk, 23-hour pause, and same-key replay after lost DB acknowledgement. Six worker tests also verify redacted aggregate metrics. |
| 34: Add scoped retention, export/deletion and a recovery runbook | complete | Ten real-Mongo tests pass: dry-run, exact mutation scope, active/historical unresolved exclusions, completed payload redaction, generation-aware expiry, export privacy and race fencing. Local BSON restore reproduced 2 enquiries/1 subscriber with matching indexes and preserved pending work. Production encryption/schedule remains deferred. |
| 35: Add CI that proves the whole local stack | complete | 264 backend tests passed against pinned Mongo replica set; 38 frontend tests and build passed. Manifest checks bind commit/config/bytes. Local workflow lint and shell syntax pass; actual GitHub invocation and alert receipt remain deferred. |
| 36: Prepare Cloudflare Pages assets and validate deep links | complete | Seven artifact fixture checks passed. Local artifact verified and production target rejected. All 92 browser checks passed through Wrangler 4.151.1 local Pages runtime; direct headers, action caching and JS assets verified. Actual cloud/edge remains deferred. |
| 37: Define the Render service and version-aware deploy helper | complete | 14 new helper/settings checks and 21 existing configuration checks pass. Exact SHA, queued 202 discovery, old-deploy rejection, failure/timeout and readiness are tested with HTTP transport fixtures. Blueprint structure and shared contract path verified locally; no Render service created. |
| 38: Create a manually activated, same-commit release workflow | complete | 11 release verification tests and 14 Render checks pass; actionlint with ShellCheck passes all three workflows. Local artifact dry-run reports zero provider calls. Manual main-only workflow remains disabled; exact artifact precedes deploy/upload/smoke and rollback runbook is prepared. |
| 39: Complete local readiness and prepare the final handoff packet | complete | Final implementation SHA 7d24f64: 289 backend tests, 38 frontend tests, 92 development browser checks and 26 release-bundle checks passed; build/artifact/workflow checks and local rollback passed. Provider handoff prepared. Review app running on 4300/8300 with real local Mongo and simulated delivery. |
| 40: Collect the final provider and owner inputs once | deferred_user_inputs | Pending. |
| 41: Provision and connect services without changing the public domain | deferred_user_inputs | Pending. |
| 42: Prove actual database, Gmail, Slack and newsletter delivery | deferred_user_inputs | Pending. |
| 43: Publish the custom domain and rehearse rollback | deferred_user_inputs | Pending. |
| 44: Observe the live flow and hand over operations | deferred_user_inputs | Pending. |

## Acceptance evidence

All local rows below refer to implementation SHA `7d24f648607877355452919ca3e49b64257f8a72`, verified on 2026-10-17 in the isolated local environment. `verified_local` covers the named engineering evidence only. The production part of every row except A13 remains `deferred_user_inputs`.

| ID | Requirement | Local status | Local evidence | External gate |
| --- | --- | --- | --- | --- |
| A01 | Nine enquiry types enforce their own fields and limits | verified_local | Contract/model/API cases plus nine browser submissions on desktop/mobile; exact normalized fields checked in Mongo | All nine preview submissions |
| A02 | Success follows acknowledged persistence; DB failure never shows success | verified_local | Unique insert acknowledgement, injected before/after-write failures, real browser 503 and receipt checks | Browser reference matched to Atlas |
| A03 | Concurrent/retried requests do not duplicate records/jobs | verified_local | Concurrent repository races, replay/conflict, lost-response retry and double-submit browser checks | Deployed same-key replay |
| A04 | Team receives useful email with correct reply-to | verified_local | Escaped immutable email rendering and HTTP adapter/capture assertions | Resend ID/status and observed Gmail/reply behavior |
| A05 | Slack receives minimal notification independently | verified_local | Minimal type/time/reference payload, HTTP capture, independent channel failure and redaction checks | Approved actual channel message |
| A06 | Restarts/outages recover jobs with bounded retries | verified_local | Real subprocess crash/restart, lease fencing, same job identity, persisted attempts and 23-hour ambiguity pause | Actual service worker/queue inspection; safe preview recovery |
| A07 | Newsletter consent/confirmation/unsubscribe is real and idempotent | verified_local | Mongo generation/state transitions, token validation, explicit POST actions and captured-link browser lifecycle | Received real inbox link and Atlas state |
| A08 | Public API cannot list customer data or expose secrets | verified_local | Absent list/template/docs routes, sanitized errors, redacted logging, output secret scans and safe public health | Deployed endpoint probes and secret-store configuration |
| A09 | Validation, rate limits and bot protection resist direct requests | verified_local | Size/media/strict field tests, atomic shared quotas, proxy spoofing and strict fake Siteverify response tests | Genuine Turnstile, actual Render proxy/IP behavior |
| A10 | Current site behavior and mobile usability remain intact | verified_local | 31 content/action routes, reload/assets, filters/prefills/keyboard checks on desktop/mobile; local Pages runtime also checked | Actual final-domain headers/TLS/routes/mobile forms |
| A11 | CI blocks bad changes and deploys exactly the tested release | verified_local | Underlying suites, actionlint/ShellCheck, manifest SHA/config/bytes, mocked queued/failing Render and remote smoke gates | Real GitHub reusable run, Render SHA and Pages deployment/artifact |
| A12 | Retention, privacy and operational owners are explicit | verified_local | Scoped dry-run/apply/export/delete tests, unresolved-job protection, synthetic BSON restore, draft owner checklist | Owner policy/content approval, actual schedules/owners/encrypted backup restore |
| A13 | App can be prepared without provider credentials | verified_local | Pinned installs, loopback Mongo, bounded simulator, owned launcher, release dry-run with zero provider requests | No external gate for this local preparation requirement |
| A14 | Publishing is reversible and preserves customer records | verified_local | Current → compatible prior backend → current drill preserves one enquiry/two pending jobs and replay; no DB rollback | Actual deployment/DNS snapshots and rehearsed published rollback |
| A15 | Prompt-delivery target is measured and ongoing failures visible | verified_local | Poll/concurrency/timeout/retry/heartbeat tests, redacted aggregate metrics and separate delivery health | Measure acknowledgement/attempt/acceptance timing, actual alert receipt and 24-hour observation |

### Evidence boundaries

- The healthy-system latency targets remain **unmeasured in production**: API p95 below 2 seconds excluding bot round trip, first attempt within 10 seconds, normal provider acceptance within 30 seconds. Local scheduling tests do not prove those service levels or inbox arrival.
- Atlas, real email/Slack, genuine Turnstile, Render, actual Pages edge, GitHub execution/alerts and DNS have not been exercised. Workflow lint and mocked HTTP tests are not a successful cloud deployment.
- Privacy is a draft. Business identity, support/privacy contacts, retention, product facts and other owner approvals are intentionally unresolved and block production builds.
- Delivery is at least once. Ambiguous Slack acknowledgement can duplicate a message; email deduplication has a bounded provider window. Paused unknown outcomes require reconciliation, not blind replay.
- Existing CRA/Yarn peer/resolution warnings and upstream Starlette TestClient/httpx deprecation warnings remain. Tested installs/builds pass; no claim of zero dependency advisories is made.

## Final local verification record

Implementation SHA: `7d24f648607877355452919ca3e49b64257f8a72`. The final handoff commit changes documentation only. Verification date: 2026-10-17 UTC. macOS arm64, Python 3.12.15, Node 22.23.3, Yarn 1.22.22, Playwright 1.64.1 Chromium. Backend and browser verification use the pinned Mongo 8.0.17 replica set on loopback 27127, real Mongo persistence and majority write concern; all provider/bot traffic is simulated.

| Check | Actual result |
| --- | --- |
| Full backend `pytest tests -q --tb=short`, unchanged xdist configuration | 289 passed, 2 upstream deprecation warnings, 22.33 seconds |
| Full frontend `yarn --cwd frontend test --watchAll=false --runInBand` | 8 suites, 38 tests passed |
| `yarn --cwd frontend install --frozen-lockfile`; backend `python -m pip check` | Frozen lock install and dependency check passed; existing Yarn override warnings remain |
| Local release `yarn --cwd frontend build` | Optimized build and environment-specific headers passed |
| Manifest, static artifact and dry-run checks | SHA/config/bytes match; dry run reports zero provider HTTP requests; local artifact is rejected as production |
| Final development browser suite | 92 passed, desktop/mobile, 3.6 minutes |
| Final release-bundle core suite | 26 passed, desktop/mobile, 1.4 minutes |
| Pages-compatible preview | Earlier same frontend implementation passed all 92 cases under Wrangler 4.151.1, plus explicit headers/assets/deep links; public API origin forwarding to isolated real API was exercised |
| Workflow and shell checks | actionlint 1.7.12 with ShellCheck 0.11.0 passed all three workflows; standalone shell syntax/ShellCheck passed |
| Operator entrypoints and hygiene | Outbox/data/local/deploy/verify CLI help commands succeed; no tracked environment secrets, local state, build or test artifacts |
| Local compatible-code rollback | At 11:31:29 UTC: one enquiry and two pending jobs preserved across current → `5d6a078` → current; same receipt replay; zero provider calls |
| Synthetic BSON restore | At 11:02:43 UTC: two enquiries/one subscriber and indexes matched; pending job preserved; generated DBs/plaintext archive removed |

Local artifact SHA-256: `2601acfe2da9b2f72a5718bc9f9ff7dab4c9bcbd4bb3a09164dccf720f53bbe2`.
Public configuration SHA-256: `723fdd2a77f0448c47de27c70229979536ee2927d5507dff3b58f6321f2156ee`.

Reproduction from repo root (with pinned tools installed):

```bash
CI_MONGO_PORT=27127 bash scripts/ci-mongo-replica-set.sh start
export TEST_MONGO_URL='mongodb://127.0.0.1:27127/?replicaSet=rs0&directConnection=true'
(cd backend && .venv-intake/bin/python -m pytest tests -q --tb=short)
CI=true REACT_APP_TURNSTILE_MODE=fake yarn --cwd frontend test --watchAll=false --runInBand
CI=true E2E_FRONTEND_MODE=dev yarn --cwd frontend test:e2e
export BUILD_TARGET=local REACT_APP_BACKEND_URL=http://127.0.0.1:8300
export REACT_APP_TURNSTILE_MODE=live REACT_APP_TURNSTILE_SITE_KEY=local-test-site-key
CI=true GENERATE_SOURCEMAP=false yarn --cwd frontend build
backend/.venv-intake/bin/python scripts/check-release-config.py --target local --build frontend/build --sha "$(git rev-parse HEAD)"
backend/.venv-intake/bin/python scripts/check-static-artifact.py --build frontend/build --target local
backend/.venv-intake/bin/python scripts/verify-release.py --phase dry-run --target local --sha "$(git rev-parse HEAD)"
CI=true E2E_FRONTEND_MODE=build yarn --cwd frontend test:e2e intake.spec.js newsletter.spec.js
bash scripts/ci-mongo-replica-set.sh stop
```

The local artifact has a test-only public widget key; browser tests intercept the widget script. Use the development profile for manual local review. A real production build must use approved owner facts, HTTPS API origin and genuine Turnstile site key and rerun CI.

## Running owner-review app

At 2026-10-17 11:35 UTC, the owned `local` profile was started with UI `http://127.0.0.1:4300`, API `http://127.0.0.1:8300` and the existing loopback Mongo on 27017. Liveness, readiness and delivery returned 200; API version reports the tested implementation SHA. The worker and provider simulator are running. Enquiry/subscriber listing and old template routes return 404/405. The temporary CI Mongo container was stopped by its ownership-checked script. Pre-existing processes on 3000/8000 remain intact.

Use the [local start/stop commands](local-development.md) for this review session. Only synthetic data belongs in the local simulator. See the [provider handoff](provider-handoff.md) for the complete final input checklist and [publishing/rollback](publishing-and-rollback.md) for the disabled release procedure.

## External gates

Atlas, Resend delivery, Gmail receipt, Slack receipt, Render, Pages, Turnstile, DNS, owner content approval and 24-hour observation remain `deferred_user_inputs`. Credentials will be requested after Task 39. No provider messages or deployment actions are authorized by local test success.
