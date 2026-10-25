# Render Free implementation plan

**Goal:** Honor the owner's 2026-10-25 choice to stay on Render Free without claiming continuous availability or immediate notification delivery.

**Architecture:** Keep the existing Python web service and in-process outbox worker, with durable records in Atlas and the frontend on Pages. Accept `free` in release validation and set the blueprint to Free. Accommodate cold starts with a bounded 90-second form request; preserve cancellation, idempotency and explicit retries. Scheduled monitoring must not keep a Free service awake; manual health checks remain available.

**Tech stack:** Python/FastAPI, MongoDB, React, GitHub Actions, Render, Cloudflare Pages.

## Decision and scope

The user explicitly selected Free after being offered the existing paid setup or adaptation for Free. This supersedes the Starter requirement in the original design; it does not approve owner facts, privacy content, purchases or publication. Migrating to another backend or adding a separate worker is unnecessary for this choice. Keeping the paid-only validator would block the requested setup.

## Tasks

1. Add regression coverage in `backend/tests/test_render_deploy.py` and `test_release_verification.py`: Free and Starter both pass complete release fixtures; unknown tiers, wrong SHA, failed readiness and missing owner approvals still fail. Run these tests before and after changing `scripts/deploy-render.py` and `scripts/verify-release.py`.
2. In `frontend/src/lib/intakeApi.test.js`, cover a 60-second response, cancellation and the 90-second deadline. Observe failure, then change the shared request timeout. Add concise waiting guidance to enquiry/newsletter/action forms; preserve receipts and avoid automatic POST retries.
3. Set `render.yaml` to `plan: free`. Gate `.github/workflows/monitor.yml` so scheduled probes only run on known paid tiers, with explicit manual checks allowed on Free. Give manual health requests a bounded cold-start allowance.
4. Update operations configuration, handoff, publishing and readiness docs. Explain idle sleep, delayed worker retries, quota limitations, manual monitoring and remaining release gates. Keep `RENDER_PLAN=free` and `DEPLOYMENT_ENABLED=false`.
5. Run scoped backend tests, frontend tests, workflow lint and whitespace checks. No provider messages or publication are part of this implementation verification.

## Free-tier operating expectations

Render documents sleep after 15 minutes without inbound traffic, approximately one minute to wake, 750 monthly Free instance hours per workspace and usage-related suspensions/charges. See https://render.com/docs/free (checked 2026-10-25). Render recommends paid instances for production reliability. This selected configuration accepts the limitations; it does not promise real-time delivery.

The in-process worker stops while asleep. Saved enquiries and jobs remain in Atlas; pending work resumes when the service wakes, subject to existing leases/retry policies. Local files must not be used as durable storage. Manual checks wake the service and consume usage. No periodic keep-alive is introduced. API success alone does not prove Gmail/Slack delivery; live cold-start and delivery tests remain required before public launch.

## Local verification

Implemented on 2026-10-25. Before changes, four backend tests failed on paid-only validation and two frontend tests failed on the 15-second timeout. After changes:

- `cd backend && .venv-intake/bin/python -m pytest tests/test_render_deploy.py tests/test_release_verification.py tests/test_release_config.py -q --tb=short`: 37 passed, including Free/Starter failure paths and owner-approval enforcement.
- `cd frontend && CI=true npm exec --yes --package=node@22 --package=yarn@1.22.22 -- yarn test --watchAll=false --runInBand`: 8 suites, 39 tests passed. Delayed responses use fake timers; this is not a live Render cold-start measurement.
- `.local/tools/actionlint` and `git diff --check`: passed.

No cloud settings changed, provider messages sent, or public release triggered. Owner launch facts/approvals remain unresolved. Commit/push this adaptation before attempting the next production release; retain `DEPLOYMENT_ENABLED=false` until all gates pass.
