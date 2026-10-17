# Local intake stack

Use Node 22 and Python 3.12. Install the pinned backend runtime/development requirements into `backend/.venv` (this workstation uses the separate ignored `backend/.venv-intake`) and run `yarn --cwd frontend install --frozen-lockfile` with Yarn 1.22.22. Start a dedicated MongoDB instance listening on loopback 27017. `TEST_MONGO_URL` may select another unauthenticated loopback Mongo instance; it never inherits the application's database URL.

From the repository root:

```bash
backend/.venv-intake/bin/python scripts/run-local.py start --profile test
backend/.venv-intake/bin/python scripts/run-local.py status --profile test
backend/.venv-intake/bin/python scripts/run-local.py stop --profile test
```

The default URLs are UI `http://127.0.0.1:4300`, API `http://127.0.0.1:8300`, readiness `/api/health/ready`, delivery `/api/health/delivery`, and simulator `http://127.0.0.1:8301/health`. Optional `--frontend-port`, `--api-port`, `--provider-port` choose a distinct unused set. Occupied ports fail with listener details; the launcher never kills an unrelated service. The `local` profile is also available and uses its own state/directory. Do not run two profiles on the same ports.

Every start creates a new `tht_local_<profile>_<uuid>` database and private run directory under ignored `.local/<profile>/`. State contains owned process IDs, token, source SHA and paths. Shutdown checks supervisor ownership, signals its owned children and retains the database/captures for inspection. If a stale PID belongs to another process, shutdown refuses to signal it. Concurrent start commands are locked. Do not hand-edit ownership state to target another process.

All delivery and bot verification in the development profile are simulated. The API is real, Mongo persistence is real, and the worker sends HTTP requests only to the local simulator. Successful simulator jobs are `simulated`, never `accepted`. Captures include synthetic payloads and newsletter action links needed for local browser tests; files are private, ignored, and must not be uploaded or used for real customer information. Do not copy production credentials into this harness.

`captures.jsonl` records each simulated request and stable fake provider ID. To inject a local provider fault, write `faults.json` in the run directory, for example `{"ops_email":{"status":500},"slack":{"status":200}}`. Supported controls include `status`, `retry_after`, bounded `delay` and `disconnect`. Reset to `{}` to recover. Email simulator requests deduplicate by job identity within a simulator process; Slack intentionally has no deduplication guarantee. Neither outcome proves a real provider result.

To test the release bundle, build with `BUILD_TARGET=local REACT_APP_BACKEND_URL=http://127.0.0.1:8300 REACT_APP_TURNSTILE_MODE=live REACT_APP_TURNSTILE_SITE_KEY=local-test-site-key` and run the frontend build command. Start with `--frontend-mode build`. Browser automation supplies a test-only widget script fixture against the local fake verifier. Production builds reject fake mode and pending owner approvals. The local static server supports SPA deep links; it is not Cloudflare Pages verification.

Initial harness proof on 2026-10-17: one synthetic general enquiry returned `201`, Mongo stored reference `641722ba-59dc-4d3f-8fe8-3d8f533ba7e0`, both jobs reached `simulated`, and two corresponding HTTP captures existed. Four harness guard tests passed. Owned shutdown completed and the pre-existing UI/API listeners on ports 3000/8000 remained active. Complete browser and restart proof is recorded separately in the readiness ledger.

Browser verification: run `yarn --cwd frontend test:e2e` under Node 22 after installing Playwright Chromium. Global setup creates an owned isolated stack and teardown stops it. Set `E2E_FRONTEND_MODE=build` to test the prebuilt local release. `E2E_REUSE_OWNED=1` is an explicit debugging option for an already-running test profile; normal verification starts fresh. Browser helpers read only the test namespace through a private CLI. Persistence fault controls live in the test-only application factory, never the production server or a public HTTP route.

The full development suite passed 92 desktop/mobile cases; the release bundle passed 26 core intake/newsletter cases. A recently closed TCP connection initially caused a false occupied-port warning; a failing regression test reproduced it and the probe now permits normal address reuse while still refusing an active listener. Five harness tests pass.
