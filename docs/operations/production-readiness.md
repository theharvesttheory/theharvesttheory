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
| 23: Run and supervise the worker inside app lifespan | not_started | Pending. |
| 24: Add private delivery diagnostics and guarded recovery commands | not_started | Pending. |
| 25: Add one API client with bounded timeouts and deliberate retry keys | not_started | Pending. |
| 26: Replace Contact's local success toggle with durable submission states | not_started | Pending. |
| 27: Connect newsletter signup with explicit consent and honest copy | not_started | Pending. |
| 28: Add explicit newsletter confirmation and unsubscribe pages | not_started | Pending. |
| 29: Integrate the challenge widget without losing retry state | not_started | Pending. |
| 30: Provide the intake privacy page and review business-facing copy | not_started | Pending. |
| 31: Provide a repeatable local stack and deterministic provider simulator | not_started | Pending. |
| 32: Exercise every form through a real browser, API and database | not_started | Pending. |
| 33: Prove recovery after restart, outage and ambiguous acknowledgement | not_started | Pending. |
| 34: Add scoped retention, export/deletion and a recovery runbook | not_started | Pending. |
| 35: Add CI that proves the whole local stack | not_started | Pending. |
| 36: Prepare Cloudflare Pages assets and validate deep links | not_started | Pending. |
| 37: Define the Render service and version-aware deploy helper | not_started | Pending. |
| 38: Create a manually activated, same-commit release workflow | not_started | Pending. |
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
