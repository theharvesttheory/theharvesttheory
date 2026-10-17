# Production readiness ledger

Status: implementation in progress; production is not connected or verified.

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
| 39: Complete local readiness and prepare the final handoff packet | not_started | Pending. |
| 40: Collect the final provider and owner inputs once | deferred_user_inputs | Pending. |
| 41: Provision and connect services without changing the public domain | deferred_user_inputs | Pending. |
| 42: Prove actual database, Gmail, Slack and newsletter delivery | deferred_user_inputs | Pending. |
| 43: Publish the custom domain and rehearse rollback | deferred_user_inputs | Pending. |
| 44: Observe the live flow and hand over operations | deferred_user_inputs | Pending. |

## Acceptance evidence

| ID | Requirement | Status | Evidence / tested SHA / UTC time / environment |
| --- | --- | --- | --- |
| A01 | Nine enquiry types enforce their own fields and limits | not_started | No evidence yet. |
| A02 | Success follows acknowledged persistence; DB failure never shows success | not_started | No evidence yet. |
| A03 | Concurrent/retried requests do not duplicate records/jobs | not_started | No evidence yet. |
| A04 | Team receives useful email with correct reply-to | not_started | No evidence yet. |
| A05 | Slack receives minimal notification independently | not_started | No evidence yet. |
| A06 | Restarts/outages recover jobs with bounded retries | not_started | No evidence yet. |
| A07 | Newsletter consent/confirmation/unsubscribe is real and idempotent | not_started | No evidence yet. |
| A08 | Public API cannot list customer data or expose secrets | not_started | No evidence yet. |
| A09 | Validation, rate limits and bot protection resist direct requests | not_started | No evidence yet. |
| A10 | Current site behavior and mobile usability remain intact | not_started | No evidence yet. |
| A11 | CI blocks bad changes and deploys exactly the tested release | not_started | No evidence yet. |
| A12 | Retention, privacy and operational owners are explicit | not_started | No evidence yet. |
| A13 | App can be prepared without provider credentials | not_started | No evidence yet. |
| A14 | Publishing is reversible and preserves customer records | not_started | No evidence yet. |
| A15 | Prompt-delivery target is measured and ongoing failures visible | not_started | No evidence yet. |

## External gates

Atlas, Resend delivery, Gmail receipt, Slack receipt, Render, Pages, Turnstile, DNS, owner content approval and 24-hour observation remain `deferred_user_inputs`. Credentials will be requested after Task 39. No provider messages or deployment actions are authorized by local test success.
