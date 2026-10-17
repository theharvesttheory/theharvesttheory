# The Harvest Theory Production Forms Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make all nine enquiry forms and newsletter signup persist to MongoDB, deliver reliable email/Slack notifications, and prepare a verified Cloudflare Pages + Render release, with provider credentials and publishing deferred until local work is complete.

**Architecture:** Retain React/CRA and FastAPI. Store submissions and embedded notification jobs atomically in MongoDB; a managed, leased poller sends through Resend and Slack independently. Gmail receives team email, Cloudflare serves the static site, and an always-on Render service hosts the API and poller.

**Tech Stack:** React 19, CRACO/CRA, Yarn 1.22.22, FastAPI, Pydantic, PyMongo Async, MongoDB, HTTPX, pytest/xdist, React Testing Library, Playwright, GitHub Actions, Cloudflare Pages/Turnstile, Render, Resend and Slack incoming webhooks.

---

## How to execute

- Read the [companion design](2026-10-17-production-forms-design.md) first. Its contracts, limits, state transitions and deferred scope are part of this plan.
- Work in `/Users/abhishek/Documents/datavedam/theharvesttheory` on the active checkout. Do not create a worktree or overwrite the existing untracked `.agents/`, `.pui/`, `graphify-out/` or `skills-lock.json`.
- **This document is a plan, not evidence of implementation. All tasks below are initially unchecked.** Tasks 1–39 are local work; Tasks 40–44 require final owner/provider inputs. Do not request credentials to begin Tasks 1–39.
- Use @using-superpowers and @executing-plans during implementation, @test-driven-development for behavior changes, @systematic-debugging for failures, and @verification-before-completion for readiness claims. Review schema/worker changes before proceeding to deployment work.
- Keep `backend/pytest.ini` unchanged, especially `-n 2 --dist loadscope`. Give every test a unique database; never share a production, development or sibling test database.
- Each numbered step below is a small action, normally 2–5 minutes. A task contains several steps. Dependency resolution, browser installation and external DNS propagation may take longer; do not turn a waiting period into a passing result.
- For each behavior task: write the named regression test, run it and confirm the intended failure, implement only the specified behavior, rerun the test and relevant dependent tests, then make the scoped commit. Configuration/docs tasks use direct checks instead of artificial unit tests.
- Early persistence/API tasks inject synthetic payload factories and providers through the app factory. Tasks 19–23 replace those test dependencies with production renderers/adapters/worker wiring. Do not call the interim application production-ready or enable live delivery before those dependencies exist.
- Commit only explicit paths for the task, once checks pass. Suggested messages are provided; do not stage with `git add .` or add invented authorship. Do not push, merge, provision paid services, send provider messages or change DNS during local preparation.
- The existing app may already be running on 3000/8000 with local MongoDB on 27017. Use isolated test ports/databases; do not stop unrelated processes.

## Milestones and dependencies

| Phase | Tasks | Deliverable / gate |
| --- | --- | --- |
| Foundation | 1–8 | Reproducible install, safe settings, shared form contract, isolated Mongo tests |
| Durable intake | 9–17 | Nine validated enquiry types and newsletter lifecycle persist correctly |
| Delivery | 18–24 | Durable leases, provider adapters, retries, recovery and diagnostics |
| Frontend | 25–30 | Honest success/error states, confirmation/unsubscribe, consent and privacy |
| Local proof | 31–34 | Real local DB, simulated providers, browser/failure tests, retention tooling |
| Release preparation | 35–39 | CI and deployment files, runbooks, local readiness evidence: **Gate B** |
| Final activation | 40–44 | Owner inputs, provider setup, actual delivery proof, DNS and observation |

Tasks are intentionally ordered; do not skip forward to credential collection. Task 18 depends on both enquiry and newsletter persistence. Frontend tests depend on the API contracts, and release tests depend on the complete local proof. CI may be drafted earlier but cannot be called passing until all required jobs run.

## Commands and conventions

Backend commands below run from `backend/` using `.venv/bin/python`; frontend commands run from `frontend/` with Yarn 1.22.22. Root commands say “root.” `TEST_MONGO_URL` defaults only to a loopback local test database server; production URLs must be rejected by test fixtures. Tests create `tht_test_<worker>_<uuid>` databases and drop only their own database in teardown.

```bash
# Backend full suite; fixture isolation is mandatory with the existing xdist config.
.venv/bin/python -m pytest tests/ -v

# Frontend unit suite and release build (from frontend/).
yarn test --watchAll=false --runInBand
yarn build

# Browser suite, after Task 31 creates its local harness (from frontend/).
yarn test:e2e
```

CI sets `CI=true`. Do not add `--passWithNoTests` or skip DB/browser tests to make CI green. Use synthetic `example.test` email addresses for offline tests. Mock provider transports must not contact real domains. A local adapter records `simulated`, never `accepted`.

## Phase 1: foundation

### Task 1: Record the baseline and a traceable acceptance ledger

**Files:** Create `docs/operations/production-readiness.md`; read `frontend/src/pages/Contact.jsx`, `frontend/src/components/Footer.jsx`, `backend/server.py` and this design. No application edits.

1. Run root `git status --short --branch` and `git rev-parse HEAD`; record branch/SHA and existing untracked paths without staging them.
2. Record current route inventory, nine forms, preview-only submission handlers and the absence of business endpoints. Link source files rather than copying historical test counts.
3. Add acceptance rows A01–A15 from the matrix at the end of this plan. Give each `not_started`, evidence path, tested SHA, timestamp and environment columns.
4. Record provider work as `deferred_user_inputs`, with no credentials requested and no claim that local startup proves live submission delivery.
5. Check links and `git diff --check`; commit only the ledger: `docs: record production forms baseline`.

### Task 2: Stop tracking environment files and define safe configuration templates

**Files:** Modify `.gitignore`; untrack but retain local `backend/.env`, `frontend/.env`; create `backend/.env.example`, `frontend/.env.example`, `docs/operations/configuration.md`.

1. Add `.env`, `.env.*`, `!.env.example`, `frontend/build/`, local provider captures, browser artifacts and `.local/` patterns with appropriate directory scope. Do not ignore the implementation source or existing user artifacts wholesale.
2. Use `git rm --cached -- backend/.env frontend/.env`; confirm the local files still exist. Never print their values. Explain that untracking does not erase Git history.
3. Write the complete variable inventory from the configuration appendix, with local example values and empty production secrets. Distinguish browser-visible values from secrets.
4. Run `git check-ignore backend/.env frontend/.env` and `git ls-files backend/.env frontend/.env`; expect ignored paths in the first result and no tracked paths in the second. Inspect diff names only for removed secret files. Privately review whether historical values are real credentials; record names and required rotation, never values. Rotation is resolved before public deployment, not by rewriting history automatically.
5. Commit explicit ignore/templates/docs and the index removals: `chore: protect local environment configuration`.

### Task 3: Make clean installation independent of Emergent

**Files:** Modify `backend/requirements.txt`, `frontend/package.json`, `frontend/yarn.lock`, `frontend/craco.config.js`; create `backend/requirements-dev.txt`, `backend/requirements-images.txt`, `.python-version`, `.nvmrc`; update `docs/operations/configuration.md`.

1. Inventory imports in `backend/server.py` and `backend/scripts/generate_product_images.py`. Keep the generator source; move its Emergent-specific dependency into the optional images requirements with its registry/setup limitation documented. Do not run the paid image generator.
2. Establish Python 3.12 and Node 22 as compatibility targets, validate them locally, and pin supported versions of runtime dependencies, including FastAPI/Pydantic, PyMongo Async, HTTPX, dotenv, email-validator and PyJWT. Pin test dependencies separately, including pytest-xdist, compatible TestClient/HTTPX and pytest-asyncio. Resolve versions together and check in reproducible pins; do not leave the old incompatible Motor/PyMongo pair alongside AsyncMongoClient.
3. Remove the two Emergent tarball devDependencies and their CRACO wrappers after checking references. Preserve the `@` alias, Tailwind and the webpack-dev-server compatibility function. Regenerate only `frontend/yarn.lock` with Yarn 1.22.22; do not introduce an npm lockfile.
4. Install into a fresh temporary virtualenv and run `python -m pip check`. Run `yarn install --frozen-lockfile --non-interactive`, `yarn build` and a local dev-server smoke. Expect no Emergent network/runtime requirement for the web app. Record exact versions and any required compatibility change; do not do unrelated dependency upgrades.
5. Commit the explicit dependency/config files: `build: make web runtime independently installable`.

### Task 4: Introduce validated settings and an app factory

**Files:** Create `backend/config.py`, `backend/tests/test_config.py`, `backend/tests/test_app_lifecycle.py`; modify `backend/server.py`.

1. Write tests for local settings, production rejecting fake delivery/bot mode, missing secrets, wildcard CORS, non-HTTPS public URLs and a weak newsletter signing key. Add an import test proving importing factory helpers does not connect to Mongo or send notifications.
2. Run `.venv/bin/python -m pytest tests/test_config.py tests/test_app_lifecycle.py -v`; expect missing factory/settings failures.
3. Implement `create_app(settings=None, repository_factory=None, provider_factory=None, clock=None)` and a FastAPI lifespan. Create clients inside lifespan, close them on shutdown, and export `app = create_app()` for Uvicorn. Validation of deployment settings happens at startup; test injection uses no production globals. Store dependencies on `app.state`, not mutable module globals shared across tests.
4. Rerun the tests. Assert shutdown closes the database/HTTP clients and an invalid production config cannot become ready. Keep provider startup checks separate from actual sends.
5. Commit exact changed files: `refactor: introduce validated app lifecycle`.

### Task 5: Build isolated real-Mongo test fixtures

**Files:** Create `backend/tests/conftest.py`, `backend/tests/test_test_isolation.py`; update `backend/requirements-dev.txt` only if necessary. Do not edit `backend/pytest.ini`.

1. Add fixtures for injected clock, deterministic provider transports and a per-test Mongo database named with xdist worker ID plus UUID. Set the async backend to asyncio. Clients must be created and closed on the same event loop; a TestClient lifespan gets its own client, not one created on the pytest loop.
2. Write two tests inserting the same unique key into separate fixture databases. Initially run them before adding the fixture and confirm the missing-fixture failure.
3. Implement fixture teardown with a guard that only drops its exact generated `tht_test_` database. Reject non-local `TEST_MONGO_URL` unless CI explicitly provides an isolated test-server allowlist; never reuse `MONGO_URL` implicitly.
4. Run `.venv/bin/python -m pytest tests/test_test_isolation.py -v` with the unchanged two-worker configuration. Expect both isolated records and clean teardown. An unavailable Mongo server fails setup with an actionable error, not a skip.
5. Commit only fixtures/tests: `test: isolate parallel Mongo integration tests`.

### Task 6: Extract the nine-type contract without changing visible form fields

**Files:** Create `frontend/src/data/intake-contract.json`, `frontend/src/data/contact-options.test.js`, `backend/contracts.py`, `backend/tests/test_contracts.py`; modify `frontend/src/data/contact-options.js`.

1. Write a frontend test asserting the nine IDs and every current field/required flag from the table below. Write a backend test loading the same JSON and rejecting duplicate type or field IDs.
2. Run `yarn test --watchAll=false --runInBand contact-options.test.js` and `.venv/bin/python -m pytest tests/test_contracts.py -v`; confirm the new contract is missing before implementation.
3. Move type IDs, labels, field definitions and limits into JSON; keep frontend-specific success copy in `contact-options.js`. Backend loads this exact file relative to the repository root. Set Render's root directory to the repository root in Task 37 so the contract ships with the API. Do not fetch schemas from the network at runtime.
4. Rerun both tests and compare UI output. Unknown/duplicate schema IDs must fail startup; no field silently disappears.
5. Commit the five exact files: `refactor: share enquiry field contract`.

| Type | Required fields | Optional fields |
| --- | --- | --- |
| `product-orders` | name, email | phone, products, quantity, notes |
| `general` | name, email, message | none |
| `retail` | name, email | company, city, business, products, volume, phone |
| `gifting` | company, email | occasion, quantity, date, customisation, phone |
| `export` | company, email | country, status, products, volume, phone |
| `collaborations` | name, email | company, about, phone |
| `press` | publication, email | subject, deadline, phone |
| `wholesale` | company, email | products, volume, phone |
| `sourcing` | company, email | offering, origin, certifications, capacity, phone |

### Task 7: Validate and normalize enquiry payloads

**Files:** Create `backend/models.py`, `backend/tests/test_enquiry_validation.py`; modify `backend/contracts.py`.

1. Parameterize one valid minimum body per type, one missing-required-field case per required field, and cases for extra fields, object/list values, overlong text, invalid email, empty whitespace and invalid source paths. Include exact maximum boundaries from the design.
2. Run `.venv/bin/python -m pytest tests/test_enquiry_validation.py -v`; expect missing models/validation failures.
3. Implement a strict envelope and a contract-driven validator. Normalize only documented fields; preserve message line breaks. Require the current notice version. Produce a canonical sorted JSON representation of normalized business fields for SHA-256 hashing, excluding bot token/honeypot. Example envelope:

```python
class EnquiryInput(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    type: str
    fields: dict[str, str]
    privacy_notice_version: str
    source_path: str
    website: str = ""
    turnstile_token: str = ""
```

4. Rerun tests; assert two payloads differing only in key order/outer whitespace hash equally, while a changed business message does not. Do not coerce nested values to strings.
5. Commit models/contracts/tests: `feat: validate all enquiry types`.

### Task 8: Create Mongo repositories, indexes and truthful health endpoints

**Files:** Create `backend/repository.py`, `backend/health.py`, `backend/tests/test_indexes.py`, `backend/tests/test_health.py`; modify `backend/server.py`.

1. Test unique idempotency/email indexes, idempotent index setup and readiness `503` when DB/index setup fails. Test no `GET/POST /api/status`, no enquiry/subscriber listing, and no public `/docs` or `/openapi.json` in production.
2. Run `.venv/bin/python -m pytest tests/test_indexes.py tests/test_health.py -v`; expect the template API/absent indexes to fail.
3. Implement AsyncMongoClient lifecycle, UTC handling, bounded server-selection/write timeouts and the design's indexes. Add `/api/health/live`, `/api/health/ready`, `/api/version`. Remove template status writes/reads; a retained `/api/` may return only service identity. Configure production write concern as majority; no database credentials in health responses.
4. Rerun tests against real Mongo. Readiness initially checks DB/indexes and later gains worker-loop freshness in Task 23. Production docs stay disabled; local docs may remain available.
5. Commit explicit files: `feat: add indexed storage and readiness checks`.

## Phase 2: durable intake

### Task 9: Atomically save an enquiry with its pending jobs

**Files:** Modify `backend/repository.py`; create `backend/delivery_models.py`, `backend/tests/test_enquiry_repository.py`.

1. Add tests for one document containing both email and Slack jobs, identical key replay, conflicting reuse, and ten concurrent inserts under the same key. Assert one record, one ID and two jobs.
2. Run `.venv/bin/python -m pytest tests/test_enquiry_repository.py -v`; expect missing save/replay behavior.
3. Implement `save_enquiry(normalized, key, payload_hash, jobs, now)` with one acknowledged `insert_one`. On `DuplicateKeyError`, fetch by the unique key, compare hash, return the original receipt or conflict. Never do a check-then-insert without handling the unique-index race. Job slots contain immutable payload snapshots and UUID job IDs.
4. Rerun tests; inject a failure after Mongo commits but before the caller receives the result, then retry the same key and recover the same ID. Persist no extra jobs on replay. Until formatters exist, tests inject complete synthetic job payloads.
5. Commit repository/models/tests: `feat: persist enquiries and delivery jobs atomically`.

### Task 10: Expose enquiry creation with safe receipts and errors

**Files:** Create `backend/routes/__init__.py`, `backend/routes/enquiries.py`, `backend/errors.py`, `backend/tests/test_enquiry_api.py`; modify `backend/server.py`.

1. Write API tests for all nine minimal valid submissions, `201/200/409`, missing/malformed UUID header, safe validation errors and DB failure. Assert no request body, email, Mongo `_id` or notification payload leaks into responses/logs.
2. Run `.venv/bin/python -m pytest tests/test_enquiry_api.py -v`; expect route missing.
3. Wire validation → replay lookup → abuse verification → immutable job construction → atomic save. Return only receipt fields. Use safe exception handlers that translate known validation/DB exceptions without echoing Pydantic input. Persisted matching retries bypass single-use bot revalidation but remain rate-limited.
4. Rerun tests. Use this exact receipt assertion pattern:

```python
first = client.post("/api/enquiries", json=body, headers=headers)
second = client.post("/api/enquiries", json=body, headers=headers)
assert first.status_code == 201
assert second.status_code == 200
assert first.json() == second.json()
assert set(first.json()) == {"id", "status"}
assert first.json()["status"] == "received"
```

5. Commit the route/error files and tests: `feat: accept durable enquiry submissions`.

### Task 11: Bound public requests and configure CORS explicitly

**Files:** Create `backend/middleware.py`, `backend/tests/test_public_boundaries.py`; modify `backend/server.py`, `backend/errors.py`.

1. Test a 32 KiB boundary and an oversized chunked body without Content-Length, malformed JSON, wrong content type, denied CORS origin and valid preflight for Content-Type/Idempotency-Key. Include direct non-browser requests to prove bot/rate checks are independent of CORS.
2. Run `.venv/bin/python -m pytest tests/test_public_boundaries.py -v`; expect absent limits/permissive CORS failures.
3. Add ASGI receive-size enforcement before JSON parsing. Configure exact allowed origins, `allow_credentials=False`, required methods/headers only, and `Cache-Control: no-store` on intake responses. Reject the oversized stream without buffering beyond the cap.
4. Rerun tests; assert no write or provider job for rejected bodies. Ensure preflight itself is not treated as a form submission.
5. Commit exact files: `security: bound public intake requests`.

### Task 12: Add shared rate limits and a honeypot

**Files:** Create `backend/abuse.py`, `backend/tests/test_rate_limits.py`; modify intake route/config/repository as needed.

1. Test two app instances sharing the same Mongo counters; 11th request in a 10-minute IP window yields `429`, windows reset by clock, global cap works, and spoofed forwarded headers do not create a fresh identity. Assert honeypot failure writes no enquiry/job.
2. Run `.venv/bin/python -m pytest tests/test_rate_limits.py -v`; expect missing shared-limit behavior.
3. Use HMAC of trusted client address/scope/window for counter IDs, atomic `$inc` with upsert and TTL expiry. Enforce thresholds even if Mongo TTL cleanup is delayed. Limit enforcement fails closed with `503` when its DB is unavailable. Make proxy trust explicit; do not use `forwarded-allow-ips=*` by default.
4. Rerun tests with independent app instances and injected clock. Return bounded `Retry-After`; log no raw IP, email or request body. Per-email newsletter cooldown is implemented in Task 15 using subscriber state.
5. Commit explicit files: `security: add shared intake rate controls`.

### Task 13: Verify Turnstile server-side and handle safe retries

**Files:** Create `backend/bot_verification.py`, `backend/tests/test_bot_verification.py`; modify enquiry route/settings.

1. Mock Siteverify success, bad token, wrong hostname/action, expired token, timeout and malformed provider response. Test a saved idempotent replay succeeds without consuming the token again; an unsaved retry needs a fresh token.
2. Run `.venv/bin/python -m pytest tests/test_bot_verification.py -v`; expect verifier missing.
3. Implement bounded HTTP verification at the fixed Cloudflare URL; check success, allowed hostname and expected action (`enquiry` or `newsletter`). Return a safe retriable service error on unavailable verification. Accept an injected fake only when `APP_ENV=local/test`; production must reject bypass flags. Never persist or log the challenge token.
4. Rerun tests. Assert a forged token sent directly to Render cannot write a record and provider failure cannot fall back to success.
5. Commit explicit files: `security: verify form challenges on the server`.

### Task 14: Implement newsletter action tokens

**Files:** Create `backend/newsletter_tokens.py`, `backend/tests/test_newsletter_tokens.py`; modify `backend/config.py`.

1. Test valid confirmation/unsubscribe claims, wrong signature/purpose/audience/issuer, missing expiry, expired token, changed generation and arbitrary algorithm. Use an injected clock and fixed key in tests only.
2. Run `.venv/bin/python -m pytest tests/test_newsletter_tokens.py -v`; expect signer/verifier missing.
3. Use PyJWT with algorithm fixed to HS256 and required `iss`, `aud`, `sub`, `exp`, `iat`, `purpose`, `generation`. Confirmation lasts 24h; unsubscribe 90d. Verify the database generation before action. Encode deterministic claims once for the immutable email job snapshot; do not regenerate a different payload on every retry.
4. Rerun tests; assert tokens are absent from logs/errors. Document key rotation impact on outstanding links and how users can request fresh confirmation.
5. Commit tokens/config/tests: `feat: sign newsletter action links`.

### Task 15: Persist newsletter requests and suppress repeated confirmation sends

**Files:** Create `backend/newsletter.py`, `backend/tests/test_newsletter_requests.py`; modify `backend/repository.py`, `backend/models.py`.

1. Test new pending signup, missing/false consent, unknown notice version, canonical email uniqueness, ten concurrent duplicate requests, subscribed duplicate, pending resend after cooldown and explicit signup after unsubscribe.
2. Run `.venv/bin/python -m pytest tests/test_newsletter_requests.py -v`; expect missing lifecycle behavior.
3. Implement single-document conditional insert/update with the unique email index and race recovery. Initial/resend transitions atomically create a generation, expiration, consent metadata and one confirmation job. Within 10 minutes do nothing; an already subscribed address gets no email. Re-subscription stays pending until verified. Apply the same body/rate/Turnstile boundaries as enquiries.
4. Rerun tests; all external receipts are identical `202 {"status":"requested"}`. A duplicate request does not reveal membership or overwrite prior confirmed consent. Only minimal validated data is persisted.
5. Commit explicit files: `feat: persist consent-based newsletter requests`.

### Task 16: Make confirmation and unsubscribe atomic and idempotent

**Files:** Modify `backend/newsletter.py`, `backend/repository.py`; create `backend/tests/test_newsletter_transitions.py`.

1. Test confirmation sets subscribed once and atomically creates ops email/Slack jobs, repeated confirmation does not enqueue again, unsubscribe is idempotent, stale confirmation cannot undo unsubscribe, and competing actions have a deterministic final state.
2. Run `.venv/bin/python -m pytest tests/test_newsletter_transitions.py -v`; expect missing transitions.
3. Use conditional updates on subscriber ID, generation and allowed current state. Unsubscribe must be allowed for pending or subscribed within the current generation, cancelling pending confirmation jobs; an already in-flight external send cannot be recalled. An unsubscribed generation can never be confirmed. A later new signup uses a new generation. Keep one notification set per confirmed generation.
4. Rerun tests including concurrent confirm/unsubscribe and stale worker completion against a replaced generation. No transition uses an unguarded read-modify-write.
5. Commit exact files: `feat: make newsletter membership transitions atomic`.

### Task 17: Expose safe newsletter endpoints

**Files:** Create `backend/routes/newsletter.py`, `backend/tests/test_newsletter_api.py`; modify `backend/server.py`, `backend/errors.py`.

1. Write tests for POST signup/confirm/unsubscribe, generic invalid-token errors, no token or email in response logs, GET returning no state-changing action and no public subscriber listing. Rate-limit action endpoints too.
2. Run `.venv/bin/python -m pytest tests/test_newsletter_api.py -v`; expect routes missing.
3. Bind the lifecycle services with bounded input models. POST confirmation returns `{"status":"subscribed"}`; POST unsubscribe returns `{"status":"unsubscribed"}` for valid repeated actions. A pending valid unsubscribed confirmation gets a safe action error, never reactivation. Token endpoints do not require Turnstile because the signed token grants the narrow action; limits still apply.
4. Rerun route and newsletter repository suites. Assert a DB failure cannot produce a subscription success response.
5. Commit routes/tests: `feat: expose newsletter lifecycle API`.

## Phase 3: reliable delivery

### Task 18: Claim due jobs with expiring leases and fenced completion

**Files:** Create `backend/outbox.py`, `backend/tests/test_outbox_leases.py`; modify `backend/repository.py`, `backend/delivery_models.py`.

1. Test two workers racing for one job, future jobs not claimed, recovery after lease expiry, and an old worker unable to complete a job after another worker acquires it. Cover both collections, newsletter `job_history` (see design refinement), and all three slots: `ops_email`, `slack`, `confirmation_email`.
2. Run `.venv/bin/python -m pytest tests/test_outbox_leases.py -v`; expect missing lease operations.
3. Use one `find_one_and_update` per claim, returning the updated document. Increment attempts at claim time; store a fresh lease-owner UUID, 60-second lease and first-attempt timestamp if absent. Job transitions must include `_id`, job ID, generation and lease owner in the update filter. Expired `sending` leases are recoverable. Require the subscriber generation/state to remain eligible before claiming a confirmation job.
4. Rerun tests and assert only one worker owns an unexpired lease. Use this completion pattern, adapting the fixed slot name:

```python
result = await collection.update_one(
    {"_id": record_id, f"jobs.{slot}.job_id": job_id,
     f"jobs.{slot}.generation": generation,
     f"jobs.{slot}.lease_owner": lease_owner},
    {"$set": {f"jobs.{slot}.state": "accepted",
              f"jobs.{slot}.accepted_at": now},
     "$unset": {f"jobs.{slot}.lease_owner": "",
                f"jobs.{slot}.lease_until": ""}},
)
assert result.modified_count in (0, 1)  # 0 means stale ownership; never force it.
```

5. Commit exact files: `feat: lease persistent notification jobs`.

### Task 19: Build immutable, escaped notification payloads

**Files:** Create `backend/notifications/__init__.py`, `backend/notifications/rendering.py`, `backend/tests/test_notification_rendering.py`; modify `backend/delivery_models.py` and job construction in `backend/routes/enquiries.py`, `backend/newsletter.py`.

1. Test every enquiry type includes the reference/type/time and only its allowed field labels in team email; HTML escapes `<script>` and quotes; CR/LF cannot enter headers. Test Slack contains no email/phone/free text and cannot trigger `@channel`/user mentions.
2. Run `.venv/bin/python -m pytest tests/test_notification_rendering.py -v`; expect missing renderers.
3. Implement fixed subjects such as `Harvest enquiry | general | <reference>`, escaped HTML plus plain text, configured sender/recipient and validated visitor `reply_to`. Slack uses `plain_text` blocks with type/reference/time, avoiding user-supplied markup and sensitive content. Newsletter confirmation contains explicit confirm and unsubscribe fragment links to the configured frontend origin. Confirmed newsletter team alerts identify the record; use a controlled minimal email representation only in the private team email where needed.
4. Rerun tests; assert `from`, `to` and webhook destination cannot be overridden by form fields. Persist the rendered provider payload and template version with the job so later code changes cannot mutate retries.
5. Commit exact files: `feat: render safe notification payloads`.

### Task 20: Implement the Resend adapter and its error classification

**Files:** Create `backend/notifications/resend.py`, `backend/tests/test_resend_adapter.py`; modify `backend/notifications/__init__.py`.

1. With HTTPX MockTransport, assert the fixed `/emails` endpoint, bearer authorization, `Idempotency-Key: tht/<job-id>`, immutable JSON and 10-second timeout. Test success requires a valid provider ID; exercise `429`, `500`, invalid-key `401`, concurrent idempotency conflict, changed-payload conflict and timeout.
2. Run `.venv/bin/python -m pytest tests/test_resend_adapter.py -v`; expect adapter missing. No real key is used.
3. Implement a typed outcome: `accepted(provider_id)`, `retryable(code, retry_after)`, `permanent(code)` or `unknown(code)`. For `409`, distinguish Resend's concurrent request error from changed-payload error. Return safe error codes only; exception text must not include headers, submitted content or provider response bodies.
4. Rerun tests. Assert the same job always has the same payload/key and a failed call never gets marked accepted. Treat API acceptance separately from inbox delivery.
5. Commit exact files: `feat: send queued email through Resend`.

### Task 21: Implement the Slack adapter independently

**Files:** Create `backend/notifications/slack.py`, `backend/tests/test_slack_adapter.py`; modify `backend/notifications/__init__.py`.

1. Test the configured HTTPS Slack webhook, success response, `429`/Retry-After, `5xx`, revoked webhook, timeout and redaction. Assert the webhook URL cannot come from a submission.
2. Run `.venv/bin/python -m pytest tests/test_slack_adapter.py -v`; expect adapter missing.
3. Implement the same typed outcome interface and fixed 10-second HTTP timeout. Restrict production destination to configured Slack webhook hosts. Retain record/job reference in content; do not invent an unsupported Slack idempotency header or a link to an admin dashboard that does not exist.
4. Rerun tests and assert no webhook URL or body is logged. Document that an ambiguous retry may duplicate a Slack message; ops can correlate the stable reference.
5. Commit exact files: `feat: send queued Slack notifications`.

### Task 22: Persist retry schedules and isolate provider failures

**Files:** Modify `backend/outbox.py`; create `backend/retry_policy.py`, `backend/tests/test_delivery_retries.py`.

1. Test email failure with Slack success, Slack failure with email success, bounded Retry-After, jitter bounds, maximum attempts, elapsed 23-hour cutoff and unknown outcomes. Inject clock/randomness; do not sleep to test backoff.
2. Run `.venv/bin/python -m pytest tests/test_delivery_retries.py -v`; expect missing retry transitions.
3. Map typed outcomes into guarded Mongo updates. Persist due times using the design's backoff sequence, capped at 8 attempts; exhaustion becomes `dead`, while an unresolved ambiguous send beyond the automatic window stays `unknown` for reconciliation. Completed provider jobs cannot be resent automatically. Check the age cutoff before every recovered lease/send, including after prolonged downtime.
4. Rerun tests. Also fail the DB update after the provider accepted: recover using the same job key/payload, fence stale completion, and preserve the distinction between Resend deduplication and Slack's duplicate risk. Verify a process restart cannot reset attempts or first-attempt time.
5. Commit exact files: `feat: retry failed deliveries with durable state`.

### Task 23: Run and supervise the worker inside app lifespan

**Files:** Create `backend/worker.py`, `backend/tests/test_worker_lifecycle.py`; modify `backend/server.py`, `backend/health.py`.

1. Test startup creates one managed task, a due job is attempted, one channel cannot starve the other, a transient DB error does not kill the poller, and shutdown stops claims then bounds waiting for active work. Test an unexpectedly dead loop fails readiness.
2. Run `.venv/bin/python -m pytest tests/test_worker_lifecycle.py -v`; expect missing worker management.
3. Implement a 2-second jittered poll with bounded concurrency 2. Start it after index readiness, keep its task handle, and update a heartbeat each healthy iteration. Readiness uses loop freshness (initial threshold 30 seconds); notification backlog is a separate operational signal. On cancellation, incomplete jobs recover through leases; never drop them from memory without Mongo state.
4. Rerun tests, including two overlapping app processes sharing one DB. Simulated adapter results remain `simulated`; production startup rejects fake delivery mode, an unconfigured required provider or disabled worker mode.
5. Commit exact files: `feat: supervise durable delivery worker`.

### Task 24: Add private delivery diagnostics and guarded recovery commands

**Files:** Create `backend/scripts/outbox_admin.py`, `backend/tests/test_outbox_admin.py`, `backend/tests/test_delivery_health.py`, `docs/operations/delivery-recovery.md`; modify `backend/health.py`.

1. Test summary counts/oldest job age, dry-run selection by exact reference/channel, stale generation rejection and confirmation-required replay of ambiguous jobs. Default output contains IDs/state/times, not payloads or email addresses.
2. Run `.venv/bin/python -m pytest tests/test_outbox_admin.py -v`; expect CLI missing.
3. Add `summary`, `inspect --id`, `retry --id --channel --dry-run` and explicit apply commands. Inside the automatic window retain the key/payload; beyond it require recorded reconciliation and an explicit `--allow-possible-duplicate` decision for a new attempt. Block replay of cancelled newsletter generations. Never expose this through a public HTTP route.
4. Rerun tests; document how to inspect Resend acceptance before manual retry, recognize Slack duplicates and recover a paused worker. Add structured metrics for pending count, oldest age, dead/unknown count and worker heartbeat with initial alert thresholds: oldest due >5 minutes, any unresolved dead/unknown job, heartbeat >30 seconds. Add `/api/health/delivery` returning only `{"status":"ok"}` with 200 or `{"status":"degraded"}` with 503; no counts, IDs or PII. Run `.venv/bin/python -m pytest tests/test_delivery_health.py -v` and prove degraded delivery leaves durable intake readiness healthy. The monitor is wired in Task 35.
5. Commit explicit files: `ops: add delivery diagnostics and recovery`.

## Phase 4: connect the existing interface

### Task 25: Add one API client with bounded timeouts and deliberate retry keys

**Files:** Create `frontend/src/lib/intakeApi.js`, `frontend/src/lib/intakeApi.test.js`, `frontend/src/setupTests.js`; modify `frontend/package.json`, `frontend/yarn.lock` for React 19-compatible testing dependencies if absent.

1. Test base-URL joining, JSON requests, 15-second abort timeout, safe parsing of non-JSON provider errors, `422/409/429/503` mapping and missing production configuration. Test key reuse on unchanged enquiry retry and new key on edited payload/new form.
2. Run `yarn test --watchAll=false --runInBand intakeApi.test.js`; expect client missing.
3. Implement `submitEnquiry`, `requestNewsletter`, `confirmNewsletter` and `unsubscribeNewsletter`; use fetch with `credentials: "omit"`. The form owns the UUID and normalized business snapshot. Do not blindly retry POST internally or store personal form data in localStorage. A malformed `2xx` response is not a valid receipt.
4. Rerun tests with mocked fetch. Example call contract:

```javascript
const receipt = await submitEnquiry({
  body: { type, fields, privacy_notice_version, source_path,
          website: "", turnstile_token: token },
  idempotencyKey,
  signal,
});
if (receipt.status !== "received" || !receipt.id) {
  throw new Error("Unexpected submission response");
}
```

5. Commit exact files: `feat: add typed intake request handling`.

### Task 26: Replace Contact's local success toggle with durable submission states

**Files:** Modify `frontend/src/pages/Contact.jsx`, `frontend/src/data/contact-options.js`; create `frontend/src/pages/Contact.test.jsx`.

1. Test each of nine schemas sends the correct type/fields, no success before response, pending disables submit/type switching, errors preserve values, same-body retry reuses the UUID, edited-body retry changes it, and late responses after navigation cannot update another form.
2. Run `yarn test --watchAll=false --runInBand Contact.test.jsx`; expect the existing `setSent(true)` behavior to fail network/pending assertions.
3. Replace `sent` with `idle/submitting/success/error`, hold the current request/key in refs and abort on unmount/reset. Preserve enquiry prefills and all existing test IDs. Render field errors and a focusable status summary with `aria-live`; display the safe reference on success. Remove the preview-only notice only when the API path is active. Product order success says “Your product enquiry has been received”; no purchase confirmation or delivery promise.
4. Rerun tests including timeout-after-save followed by same-key retry. Add max lengths from the shared contract and notice text/link, but do not add an unsolicited marketing checkbox to enquiries.
5. Commit exact files: `feat: connect all contact forms to durable intake`.

### Task 27: Connect newsletter signup with explicit consent and honest copy

**Files:** Create `frontend/src/components/Newsletter.jsx`, `frontend/src/components/Newsletter.test.jsx`; modify `frontend/src/components/Footer.jsx`.

1. Test extraction retains footer placement, required email and unchecked consent, disabled pending state, success only after `202`, generic duplicate response and values retained after failure. Add a real email label rather than relying on placeholder text.
2. Run `yarn test --watchAll=false --runInBand Newsletter.test.jsx`; expect missing component/API behavior.
3. Extract the component, add explicit newsletter consent and privacy link, and call the shared client with the newsletter bot action. Success reads “Check your email to confirm your subscription.” No immediate “you're on the list” and no implicit subscription from contact submission.
4. Rerun tests, including repeated click prevention, newsletter error focus and keyboard-only operation. Keep the current newsletter test IDs so browser checks remain stable.
5. Commit exact files: `feat: persist newsletter signup requests`.

### Task 28: Add explicit newsletter confirmation and unsubscribe pages

**Files:** Create `frontend/src/pages/NewsletterAction.jsx`, `frontend/src/pages/NewsletterAction.test.jsx`; modify `frontend/src/App.js`.

1. Test `/newsletter/confirm#token=...` and `/newsletter/unsubscribe#token=...`, no mutation on GET/render, explicit button POST, expired-token recovery, repeated action, token cleared from address bar and StrictMode rendering. Never assert a token is sent as a URL query.
2. Run `yarn test --watchAll=false --runInBand NewsletterAction.test.jsx`; expect routes/component missing.
3. Add both routes with one reusable action component. Capture the fragment once in a stable initializer/ref, remove it with history replacement, and preserve it through React StrictMode's lifecycle. Only the button invokes the API. Show the actual returned state, safe errors and a newsletter signup link; set noindex and no-referrer metadata.
4. Rerun tests and verify normal App navigation/animated route exits still work. Neither email preview fetches nor preloading trigger confirmation/unsubscribe.
5. Commit exact files: `feat: add newsletter membership action pages`.

### Task 29: Integrate the challenge widget without losing retry state

**Files:** Create `frontend/src/components/IntakeChallenge.jsx`, `frontend/src/components/IntakeChallenge.test.jsx`; modify Contact and Newsletter components plus API client tests.

1. Test script loaded once, separate widget instances/actions, token expiry, cleanup, provider load failure, and widget reset on retriable failure while preserving the enquiry's idempotency key. Test missing production site key cannot silently bypass verification.
2. Run `yarn test --watchAll=false --runInBand IntakeChallenge.test.jsx Contact.test.jsx Newsletter.test.jsx`; expect missing integration.
3. Wrap the official explicit-render widget API, render accessibly, clean up widget handles and refresh single-use tokens for new attempts. Keep a clearly labelled local test adapter available only in development/test; a production build check rejects fake mode. Never embed the secret Siteverify key in JavaScript.
4. Rerun tests. For a saved same-key retry, accept the backend's original receipt; for an unsaved attempt, acquire a fresh token. Manual production verification uses the genuine challenge without automated bypass.
5. Commit exact files: `feat: integrate protected form challenges`.

### Task 30: Provide the intake privacy page and review business-facing copy

**Files:** Create `frontend/src/pages/Privacy.jsx`, `frontend/src/data/privacy.js`, `frontend/src/pages/Privacy.test.jsx`; modify `frontend/src/App.js`, `frontend/src/components/Footer.jsx`; create `docs/operations/launch-content-checklist.md`.

1. Write route/link tests proving Privacy Policy opens real content and contact/newsletter consent links resolve. Cover collection purposes, processor categories, separate marketing consent, retention and contact sections.
2. Run `yarn test --watchAll=false --runInBand Privacy.test.jsx`; expect the placeholder footer link to fail.
3. Draft factual implementation-specific privacy content, with owner identity/contact/retention inputs clearly marked pending in a local review configuration. A production validation step must reject unresolved required placeholders. Record placeholder pricing, FSSAI/certifications, support email and inactive social/terms/shipping links for owner review; remove misleading inactive link affordances or provide approved content rather than inventing business facts.
4. Rerun tests and review desktop/mobile layout. Legal approval is an owner input at launch; passing a route test is not a legal compliance finding.
5. Commit exact files: `docs: prepare intake privacy and launch content`.

## Phase 5: local end-to-end proof

### Task 31: Provide a repeatable local stack and deterministic provider simulator

**Files:** Create `scripts/run-local.py`, `backend/tests/support/__init__.py`, `backend/tests/support/provider_server.py`, `backend/tests/test_local_harness.py`, `docs/operations/local-development.md`; update `.gitignore` and `README.md`.

1. Specify dedicated test ports (initial defaults frontend 4300, API 8300, provider simulator 8301), database namespace and capture directory. Detect occupied ports and fail with process details rather than killing another service. Never reuse the user's live local data namespace for automated tests.
2. Add tests for start/stop ownership, missing Mongo, occupied ports and refusing a non-loopback provider simulator. Run `.venv/bin/python -m pytest tests/test_local_harness.py -v`; expect launcher behavior missing.
3. Implement launcher subprocesses with inherited environment overrides, labelled PID/log files under ignored `.local/`, readiness waits and cleanup of only owned process groups. The simulator records sanitized test requests, supplies stable provider IDs and can produce timeout/429/500 cases. The local adapter converts successful simulated delivery into `simulated`. No real Resend/Slack endpoint is reachable from this mode; production rejects `LOCAL_PROVIDER_BASE_URL`.
4. From root run `backend/.venv/bin/python scripts/run-local.py start --profile test`, submit one synthetic enquiry, inspect its Mongo record and two simulator captures, then `backend/.venv/bin/python scripts/run-local.py stop --profile test`. Expect no remaining owned process and existing 3000/8000 services unaffected.
5. Commit explicit files: `dev: add repeatable local intake stack`.

### Task 32: Exercise every form through a real browser, API and database

**Files:** Create `frontend/playwright.config.js`, `frontend/e2e/intake.spec.js`, `frontend/e2e/newsletter.spec.js`, `frontend/e2e/site-regression.spec.js`, `frontend/e2e/support.js`; modify `frontend/package.json`, `frontend/yarn.lock`.

1. Add pinned Playwright dev dependency and `test:e2e` script. Configure webServer/global setup to use Task 31's isolated harness and enforce a loopback base URL. Each case gets unique synthetic identities. Capture screenshots/traces on failure in ignored artifacts; browser tests never use production credentials.
2. Write one real submission per enquiry type, product/collection prefill tests, newsletter signup → captured confirmation link → explicit confirmation → unsubscribe, repeated clicks, 422/429/503 UI and ambiguous-response retry. Run `yarn test:e2e`; confirm failures identify the missing flow or assertion rather than an unrelated setup issue.
3. Assert browser receipts against actual Mongo documents via test-only local helpers and assert simulator requests by reference. No test-only inspection endpoint may exist in the production app. Use HTTP interception for the local Turnstile script fixture and deliberate response-loss fault. For same-artifact release verification, forwarding the configured public API origin to the isolated real local API is permitted; preserve the exact bundle bytes and return the actual API response. Never send acceptance traffic to production or mock the intake API into success.
4. Run the complete browser suite on desktop and a mobile viewport. Recheck the existing 28 content URLs plus new privacy/newsletter routes, deep links, product filters, article navigation, keyboard operation and no local resource/page errors. Repeat core form flows against a locally served release bundle, with a test-only intercepted widget script and local API fake verifier; record that challenge/provider verification is simulated.
5. Commit exact test/config/lock files: `test: verify browser to database intake flows`.

### Task 33: Prove recovery after restart, outage and ambiguous acknowledgement

**Files:** Create `backend/tests/test_restart_recovery.py`, `backend/tests/test_provider_failures.py`; extend `backend/tests/support/provider_server.py`, `docs/operations/production-readiness.md`.

1. Add subprocess-level tests: save while providers fail, terminate the worker, restart against the same isolated database and recover pending jobs. Use a separate database per test and only owned process IDs.
2. Run `.venv/bin/python -m pytest tests/test_restart_recovery.py tests/test_provider_failures.py -v`; initially fail on any unimplemented recovery/observation behavior. Do not weaken assertions to match current code.
3. Add controlled failure points to injected test dependencies (not public HTTP/debug routes): after DB commit, after provider acceptance, before result persistence, and while renewing a lease. Confirm restart does not lose data or reset retry budgets.
4. Rerun tests; record email stable-key behavior, Slack possible duplication, no false browser success when persistence fails, one provider unaffected by the other's outage, and stale newsletter generation jobs unable to change membership. Include production majority-write behavior against the CI replica set in Task 35.
5. Commit exact test/support/evidence files: `test: prove intake and delivery restart recovery`.

### Task 34: Add scoped retention, export/deletion and a recovery runbook

**Files:** Create `backend/scripts/data_admin.py`, `backend/tests/test_data_admin.py`, `docs/operations/data-retention-and-recovery.md`; update configuration docs.

1. Test dry-run retention counts, active and historical pending/dead/unknown job exclusion, completed payload redaction after 7 days, pending signup expiry after 7 days, scoped export/deletion and no plaintext payload in default output. Keep consent/suppression policy configurable and owner-approved before use.
2. Run `.venv/bin/python -m pytest tests/test_data_admin.py -v`; expect commands missing.
3. Implement read-only default commands with explicit `--apply`, database name and scope required for mutation. Use exact identity/reference selection; no arbitrary user-provided Mongo query strings. Redaction must preserve dedupe fields/job outcomes until their retention expires. An old pending signup with unresolved delivery is reported for review rather than silently deleted.
4. Rerun tests. Document safe credential handling, secret rotation, backup creation, encrypted storage, restore into a separate database and count/sample checks. Do a local backup/restore drill using synthetic records and log evidence; selecting/configuring Atlas backups remains Task 41.
5. Commit exact files: `ops: add scoped data lifecycle and restore procedures`.

## Phase 6: release preparation without credentials

### Task 35: Add CI that proves the whole local stack

**Files:** Create `.github/workflows/ci.yml`, `.github/workflows/monitor.yml`, `scripts/ci-mongo-replica-set.sh`, `scripts/check-release-config.py`; update `docs/operations/production-readiness.md`.

1. Declare `push`, `pull_request` and `workflow_call` triggers. Pin maintained action releases/commit SHAs at implementation time, set `permissions: contents: read`, cancel redundant CI runs, and give jobs explicit timeouts. No provider secrets are passed to PR test jobs.
2. Add backend, frontend and browser jobs. Backend installs `requirements-dev.txt` into a fresh venv, starts an isolated Mongo replica set, waits for primary election, uses majority write concern, and runs all tests with the unchanged xdist config. Pin the Mongo image/version; the replica set must advertise a hostname reachable from both server and test client. Fail startup rather than skipping DB tests.
3. Frontend uses Node 22, Yarn 1.22.22, frozen lockfile, tests and build. Browser job installs its browser and runs Task 32's harness. Release configuration is a reusable-workflow input; ordinary CI uses loopback values. Upload the build artifact plus a manifest containing tested SHA, public configuration hash and artifact checksum. Do not upload `.env`, traces containing tokens or production data.
4. Add a monitor workflow, disabled by `DEPLOYMENT_ENABLED` until launch, with manual dispatch and a five-minute schedule. Probe liveness and delivery health using bounded retries/timeouts; failures fail the job so the configured owner receives GitHub workflow-failure notifications. No form data or provider secrets are needed. Scheduled runs can be delayed, so document best-effort coverage and daily queue review; this does not provide a realtime monitoring SLA. Run `actionlint .github/workflows/ci.yml .github/workflows/monitor.yml`, shell syntax checks and all underlying CI commands locally. Verify the reusable invocation and actual alert receipt after publication is authorized; YAML parsing alone does not prove a runnable workflow.
5. Commit explicit files: `ci: test database backed forms and release build`.

Minimal trigger shape (extend with the actual jobs above):

```yaml
name: CI
on:
  push:
  pull_request:
  workflow_call:
    inputs:
      public_api_url:
        required: false
        type: string
        default: http://127.0.0.1:8300
      turnstile_site_key:
        required: false
        type: string
        default: local-test-site-key
permissions:
  contents: read
```

### Task 36: Prepare Cloudflare Pages assets and validate deep links

**Files:** Create `frontend/public/_headers`, `frontend/public/_redirects`, `scripts/check-static-artifact.py`, `backend/tests/test_static_artifact_checks.py`; update `docs/operations/configuration.md`.

1. Specify `frontend/build` as the Direct Upload artifact and SPA fallback behavior for `/contact`, product/article detail and both newsletter action routes. Inventory current external fonts/images/scripts before choosing headers; Turnstile and API connection origins must be explicitly allowed.
2. Implement headers including no-sniff, no-referrer for action routes and frame restrictions, plus a tested CSP compatible with the existing inline style/motion behavior. Generate environment-specific API origins during build if needed. Use `/* /index.html 200` only where supported and verify it does not shadow real assets; do not cache intake/API responses through the static host.
3. Implement an artifact checker for missing assets, accidental secret values, non-HTTPS release API URL, test/fake flags and required public configuration. Feed fixture artifacts to `.venv/bin/python -m pytest tests/test_static_artifact_checks.py -v`; verify intentional bad fixtures fail before wiring the production build.
4. Run root `backend/.venv/bin/python scripts/check-static-artifact.py --build frontend/build --target local` after building. Expected: local artifact valid; `--target production` must reject unknown provider/domain/required business configuration until Task 41. Verify all deep links through a Pages-compatible preview or explicit deployed preview later; a generic local static server is not Cloudflare proof.
5. Commit exact files: `deploy: prepare and validate Pages artifacts`.

### Task 37: Define the Render service and version-aware deploy helper

**Files:** Create `render.yaml`, `scripts/deploy-render.py`, `backend/tests/test_render_deploy.py`; update `docs/operations/configuration.md`.

1. Write a blueprint with repository-root context, build command `pip install -r backend/requirements.txt`, start command below, `/api/health/ready` health check, auto-deploy disabled, and secret references using manual input (`sync: false`) rather than real values. Document the proposed always-on plan/region without applying the blueprint or purchasing resources.

```bash
uvicorn server:app --app-dir backend --host 0.0.0.0 --port "$PORT" --workers 1 --no-proxy-headers
```

2. Test deploy helper input validation, pinning the chosen SHA, a hook `200` with deploy ID, `202` without one, failed deployment, timeout and a healthy older SHA. Run `.venv/bin/python -m pytest tests/test_render_deploy.py -v`; expect helper missing.
3. Implement the helper using injected HTTP transport for tests. Add `ref=<tested-sha>` using URL parsing, never by unsafe shell interpolation. Poll the Render API for matching deploy status; when a hook returns `202`, locate the queued deployment by service/SHA and wait, rather than announcing success. Finally require `/api/version` to match and `/api/health/ready` to pass. Derive the app release version from Render's build commit or explicit `APP_GIT_SHA`.
4. Rerun tests and validate blueprint structure. Mask all tokens/hook URLs and fail on missing service/plan settings. Verify shared `frontend/src/data/intake-contract.json` is available from the repo-root deployment. No provider HTTP call occurs in this task.
5. Commit explicit files: `deploy: prepare version verified Render release`.

### Task 38: Create a manually activated, same-commit release workflow

**Files:** Create `.github/workflows/release.yml`, `scripts/verify-release.py`, `backend/tests/test_release_verification.py`; create `docs/operations/publishing-and-rollback.md`.

1. Add `workflow_dispatch` only, restricted to `main`, with a repository `DEPLOYMENT_ENABLED` guard initially false. Use a `production` GitHub environment, minimal permissions and concurrency group `production-release` with cancellation disabled once deployment begins. Do not use `pull_request_target` for deployment.
2. Call `ci.yml` through `workflow_call` for the dispatch SHA and final public API/site-key inputs; deploy jobs need successful CI. Download and verify that run's artifact/manifest. Keep runtime provider secrets out of the frontend job. Validate the workflow with `actionlint` and dependency checks; a separate push-triggered deployment must not bypass CI.
3. Wire backend helper → health/version verification → exact tested Pages artifact upload → frontend deep-link/config smoke. Use a pinned Wrangler CLI/action version and invoke it from `frontend/` with `build` as the upload directory. Disable Cloudflare/Render independent Git auto-deploys at setup. Environment variables passed to shell commands must be properly quoted, never secret expressions embedded into command text.
4. Add tests for wrong SHA/config hash/checksum, backend not ready, missing production variables and frontend smoke failure. Run `.venv/bin/python -m pytest tests/test_release_verification.py -v`; expected bad cases block release. Locally validate dry-run output and `actionlint .github/workflows/ci.yml .github/workflows/release.yml`. Do not enable or run the real deployment yet.
5. Write rollback steps: record previous Pages deployment/backend commit; revert frontend first if new UI is broken, restore compatible backend when needed, preserve DB records, and avoid destructive schema changes. Commit exact files: `deploy: gate release on tested commit and health`.

Job order to preserve:

```text
validate dispatch/main/enabled/config
  -> reusable CI for selected SHA and public configuration
  -> validate artifact manifest
  -> deploy backend SHA
  -> wait for Render success + matching API version + readiness
  -> deploy tested Pages artifact
  -> public preview smoke and release evidence
```

### Task 39: Complete local readiness and prepare the final handoff packet

**Files:** Update `docs/operations/production-readiness.md`, `docs/operations/local-development.md`, `docs/operations/publishing-and-rollback.md`; create `docs/operations/provider-handoff.md`.

1. Run the complete backend suite, frontend suite, release build, artifact checks and browser tests once on the final implementation. Record commands, actual results, tested SHA and environment. Rerun only affected checks after further changes; do not reuse old results under a new SHA without explaining scope.
2. Verify all nine enquiry documents, same-key replay, newsletter lifecycle, fake provider captures, worker restart, retry limits, secret hygiene and no public PII listing against the acceptance matrix. Confirm local adapters cannot boot as production.
3. Perform a local rollback drill using synthetic data; confirm already accepted records and pending jobs survive restoring a compatible code version. Check operator runbooks are executable by another person and list exact service stop/restart commands.
4. Set Gate A/B rows to `verified_local` only where evidenced. Keep actual Atlas, Gmail, Resend, Slack, Render, Pages, DNS and business approval rows as `deferred_user_inputs`. Write the complete final provider checklist from Task 40 and the design, with secret-store locations and no values. Clearly state that workflow lint/mock deploy tests do not prove a successful cloud deployment.
5. Commit only documentation/evidence summaries, with synthetic identifiers and no sensitive screenshots: `docs: record local production forms readiness`. Present the concrete result to the owner. **This is the planned point to request provider details and publishing authorization.** If inputs are deferred, preserve the working local app and finish the local milestone without falsely marking production complete.

## Phase 7: final activation after the user supplies details

These tasks are intentionally later. No provider can be declared working from local mocks. Reuse any authorization and details the user has already supplied; do not repeatedly ask for the same approval. Before new paid resources or public cutover, show the concrete account/service/region/plan/domain and intended test-message recipients. Final-stage message permission is limited to labelled acceptance tests, not marketing campaigns.

### Task 40: Collect the final provider and owner inputs once

**Files:** Complete `docs/operations/provider-handoff.md` and nonsecret configuration values; secrets go directly into Render/GitHub/Cloudflare stores.

1. Obtain Gmail recipient addresses, real support reply-to/contact, approved sender identity/domain, Slack target channel/webhook and authorization for labelled acceptance messages. No Gmail password is required.
2. Obtain Atlas URI/database/least-privilege user/region, network restrictions and chosen backup plan; Render account/service/region/approved always-on tier, API token and deploy hook; Cloudflare Pages account/project/domain/zone, scoped token and Turnstile site/secret keys. Check current pricing and quotas at this point; do not repeat the old $0 assumption.
3. Confirm final domain ownership, whether another deployment currently serves it, GitHub environment controls, monthly budget, notification/incident owners, privacy identity/contact, retention values and remaining business-content facts. Resolve the checklist from Task 30; no invented certifications or operational promises.
4. Store secrets in designated environments, generated newsletter signing/rate-HMAC keys included. Run production config validation without printing secret values. Identify and rotate any previously exposed real credentials from Task 2 before connecting production.
5. Mark the checklist complete only for supplied/verified inputs. Commit nonsecret configuration docs if changed: `docs: finalize production activation inputs`. No secret files are committed.

### Task 41: Provision and connect services without changing the public domain

**Files:** Apply reviewed `render.yaml`; configure providers; update `docs/operations/provider-handoff.md`, `docs/operations/production-readiness.md`.

1. Configure Atlas app user, database and indexes; allow verified Render egress ranges. Validate TLS/connectivity from the actual service, and test the chosen backup/restore process in a separate database. Do not silently broaden network access to all addresses if the narrow setup fails.
2. Verify Resend's sending domain using its exact DNS records; preserve existing MX and other email records. Set a valid sender, Gmail destination and team reply behavior. Configure Slack webhook for the approved channel; do not send until the acceptance-message permission applies.
3. Create the always-on Render service from the approved plan with production configuration. Verify it fails closed on missing secrets and reports the correct release SHA. Check actual proxy/IP behavior before claiming per-IP enforcement. Configure alert ownership and monitoring from Task 24; provider queue failures need visibility even while the intake API is healthy.
4. Create a Pages Direct Upload project, configure final public build variables and Turnstile preview/final hostnames, exact CORS and DNS verification records. Verify CI branch/environment controls; provider Git auto-deploys stay disabled. Enable the release workflow only after all preflight checks pass.
5. Run the authorized release to provider preview URLs, wait for tested-SHA evidence, and record deployment IDs/config hashes. Commit redacted setup evidence only: `docs: record provider preview activation`. Public-domain cutover is still Task 43.

### Task 42: Prove actual database, Gmail, Slack and newsletter delivery

**Files:** Update the acceptance matrix and evidence in `docs/operations/production-readiness.md`; fix implementation only if a real defect is found, then rerun affected checks.

1. From the Pages preview UI, submit a labelled synthetic acceptance enquiry with an owner-controlled email. Record browser receipt/reference and UTC timestamp. Find that exact record in Atlas and inspect its two independent job outcomes without exposing customer data.
2. Match the Resend provider ID to provider delivery status and have the recipient verify arrival in Gmail, including inbox/spam placement and reply-to behavior. Verify the actual Slack channel message with the same reference. Measure save-to-attempt and save-to-observed-notification timings. HTTP acceptance alone does not pass this step.
3. Exercise each of the remaining eight enquiry types, with owner-approved test-message volume. Verify distinct mappings, required fields and no public retrieval. Test a repeated same-key submission produces one DB record and no second job set. Confirm actual Turnstile and CORS behavior on the preview origin.
4. Complete a real newsletter signup, received confirmation link, explicit confirmation and unsubscribe with a controlled inbox. Confirm the persisted state and team notification only after confirmation. Verify expired/invalid token handling with controlled test records; never alter real subscribers.
5. Collect provider evidence for controlled outage/recovery in an isolated test service/configuration, not by breaking live customer intake. Where a production failure injection cannot safely be performed, retain the local recovery evidence and label that boundary explicitly. Set Gate C/D delivery rows only for observed results; record unresolved items. No domain cutover while a critical row fails.

### Task 43: Publish the custom domain and rehearse rollback

**Files:** Update `docs/operations/publishing-and-rollback.md`, `docs/operations/production-readiness.md`; provider DNS/configuration changes only within the reviewed scope.

1. Capture current DNS and previous deployment IDs; confirm rollback target and compatible DB schema. For a new domain with no previous functional app, define rollback as withdrawing/pausing the new intake with honest UI messaging while preserving stored records, not inventing a prior backend.
2. Apply the reviewed Cloudflare custom-domain records and TLS settings. Preserve unrelated DNS/mail records. Add the exact final origin to backend CORS and Turnstile hostname configuration. Rebuild/retest if the public API origin changes; do not reuse a bundle with the wrong baked-in URL.
3. Verify HTTPS, canonical host redirects, actual Pages headers, direct navigation/reload on contact/product/article/privacy/newsletter paths, mobile forms and absence of console/network errors. Confirm the final origin cannot bypass server bot/rate checks through direct Render access.
4. Repeat one enquiry and one newsletter lifecycle on the final domain with approved test accounts, correlating Atlas/Gmail/Slack evidence. Practice the documented rollback on a nonpublic equivalent or approved release, recording exactly what was exercised. Never roll back or delete the Mongo database to roll back application code.
5. Mark publication successful only after final-domain evidence passes. Record release SHA, service/deployment IDs, UTC time and owner in the ledger; commit nonsecret evidence: `docs: record custom domain acceptance`.

### Task 44: Observe the live flow and hand over operations

**Files:** Update `docs/operations/production-readiness.md`, `docs/operations/delivery-recovery.md`, `docs/operations/publishing-and-rollback.md`.

1. Start a 24-hour observation period covering readiness, queue age, dead/unknown jobs, provider quota failures and form error rates. Assign an owner and check times; do not mark a future observation period complete during the deployment session.
2. Verify alerts reach an approved operational destination and that an operator can inspect/recover a synthetic failed job without querying a public endpoint or disclosing form payloads. Confirm backup cadence, restore owner and retention schedule actually exist.
3. Remove only labelled synthetic acceptance records/messages according to owner-approved cleanup; preserve evidence references and avoid deleting any real enquiry. Document remaining limitations such as possible Slack duplicates and provider delivery delays.
4. If an old Emergent or other deployment exists, recommend retirement only after stable observation and verified rollback independence. Obtain explicit authorization for deleting resources/accounts; do not infer it from permission to publish. If no old service exists, mark this item not applicable with evidence.
5. Complete the handover with live URLs, tested SHA, runbooks, notification owner and unresolved noncritical items. Mark the production objective complete only when required evidence and the observation period are finished; otherwise report the exact remaining gate.

## Configuration appendix

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

## Acceptance matrix

Copy this matrix into the readiness ledger at Task 1, retaining IDs so every requirement has local and live evidence.

| ID | Acceptance requirement | Local evidence | Final external evidence |
| --- | --- | --- | --- |
| A01 | Nine enquiry types enforce their own fields and limits | Contract, model, API and browser tests | Preview submissions for all nine types |
| A02 | Success follows acknowledged persistence; DB failure never shows success | Real Mongo and fault injection | Browser reference matches Atlas record |
| A03 | Concurrent/retried requests do not duplicate records/jobs | Unique-index race and ambiguous-response tests | Same-key replay on deployed API |
| A04 | Team receives useful email with correct reply-to | Escaped rendering and captured HTTP tests | Resend ID/status plus actual Gmail observation/reply check |
| A05 | Slack receives minimal notification independently | Capture, failure-isolation and redaction tests | Actual approved channel message/reference |
| A06 | Restarts/outages recover jobs with bounded retries | Lease, restart, unknown-outcome and age-cutoff tests | Actual worker/queue visibility; controlled preview recovery where safe |
| A07 | Newsletter consent/confirmation/unsubscribe is real and idempotent | Mongo/browser lifecycle and token tests | Controlled inbox link, Atlas state and unsubscribe proof |
| A08 | Public API cannot list customer data or expose secrets | Route absence, safe errors/logs, artifact/config checks | Origin/public endpoint probes and configured secret stores |
| A09 | Validation, rate limits and bot protection resist direct requests | Size/concurrency/spoofing/fake-verifier tests | Genuine Siteverify and verified proxy behavior |
| A10 | Current site behavior and mobile usability remain intact | Existing content URLs plus new routes; desktop/mobile tests | Final-domain route/reload/header checks |
| A11 | CI blocks bad changes and deploys exactly the tested release | Actionlint, manifest/helper tests and local commands | Actual GitHub run, Render SHA and Pages artifact/deployment |
| A12 | Retention, privacy and operational owners are explicit | Tested dry-run tools; reviewed draft/runbooks | Owner facts/retention approval, actual schedule and restore evidence |
| A13 | App can be prepared without provider credentials | Fresh local install, isolated DB, fake transports, reproducible launcher | Not an external gate; no fake proof counted as live |
| A14 | Publishing is reversible and preserves customer records | Compatible-code rollback drill with pending jobs | DNS/deployment snapshots and rehearsed final runbook |
| A15 | Prompt-delivery target is measured and ongoing failures visible | Worker scheduling/timeout tests and metrics | Timing observations, alerts, always-on hosting and 24-hour observation |

## Completion and handoff

**Local completion:** Tasks 1–39 and Gate A/B evidence are complete; all external rows remain explicitly deferred. Provide the running local URLs, exact test results and the provider handoff checklist. The user supplies provider details at this point as requested.

**Production completion:** Tasks 40–44 have actual evidence, including recipient/channel observation and the observation period. Do not substitute code review, fake provider responses, a successful build or a healthy API for this proof.

Implementation can be executed task-by-task in this checkout using @executing-plans, either in the current session or a separate session. If the user chooses subagent-driven implementation, apply @subagent-driven-development and review each bounded task; do not assume delegation or worktree creation is required to execute this plan.

Provider behavior was checked against the official documentation linked in the companion design on 2026-10-17. Recheck current quotas, prices, deployment APIs and supported versions during implementation/final setup. The ApexLink plans inform this design but are not copied as a runnable Harvest implementation.
