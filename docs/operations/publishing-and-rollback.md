# Publishing and rollback

Status: locally prepared. No provider resource has been provisioned, no public release has run, and publishing remains disabled.

## Release prerequisites

Complete the [provider handoff](provider-handoff.md), owner content/privacy/retention approval and final activation tasks. Review current pricing before purchasing the proposed always-on Render service. Create a protected GitHub `production` environment with main-only deployments and required reviewers. Keep Render Git auto-deploy off and use a Cloudflare Pages Direct Upload project with production branch `main`; disable any independent Git deployment path.

Repository variables: `DEPLOYMENT_ENABLED` (absent/false until activation), `PUBLIC_API_URL`, `PUBLIC_FRONTEND_URL`, `TURNSTILE_SITE_KEY`, `RENDER_SERVICE_ID`, `RENDER_PLAN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT`. Put only `RENDER_API_TOKEN`, `RENDER_DEPLOY_HOOK_URL`, `CLOUDFLARE_API_TOKEN` in GitHub production environment secrets. Runtime Atlas/Resend/Slack/Turnstile secrets remain in Render. No secret values belong in workflow inputs, frontend variables, Git or this document.

## Manual release

1. Record the current Git SHA, Render deploy ID/commit, Pages deployment ID, public configuration hash and DNS snapshot in private operational evidence. For the initial release, explicitly record that no previous functional intake exists.
2. Review and commit final public owner facts and build configuration. Push the reviewed main commit only when publishing is authorized. Set `DEPLOYMENT_ENABLED=true` after the preflight and account setup are complete.
3. Dispatch **Production release** on `main`. The workflow calls CI from that same commit, runs the real isolated Mongo/browser checks, and downloads its checked artifact. Runtime provider secrets are absent from CI jobs.
4. The helper pins the backend commit, waits for Render status `live`, and verifies `/api/version` and `/api/health/ready`. Only then does Wrangler upload the exact tested Pages artifact. Do not rebuild between testing and upload.
5. Public smoke checks require the matching manifest, JavaScript/CSS bytes, SPA deep links and security/action headers. Record run URL, artifact/config hashes, Render ID, Pages ID and UTC time. A failed smoke step is a failed release requiring investigation; it does not automatically undo deployment.
6. Perform the owner-authorized Gmail/Slack/newsletter acceptance tests. Neither CI nor a healthy endpoint proves message delivery. Keep custom-domain cutover for Task 43 and the 24-hour observation for Task 44.

Cloudflare's local Pages emulator was tested; actual provider edge caching/TLS behavior is still a live gate. Disable content-transforming features that rewrite tested HTML/JS bytes. If the edge temporarily serves an earlier artifact, investigate or rerun read-only smoke after propagation; do not declare success from an upload response.

## Local dry run

After a local release build and manifest creation, use:

```bash
REACT_APP_BACKEND_URL=http://127.0.0.1:8300 \
REACT_APP_TURNSTILE_SITE_KEY=local-test-site-key \
REACT_APP_TURNSTILE_MODE=live \
backend/.venv-intake/bin/python scripts/verify-release.py \
  --phase dry-run --target local --sha "$(git rev-parse HEAD)" --build frontend/build
```

This validates local artifact identity and reports zero provider HTTP requests. It cannot authorize or simulate production success. Production preflight remains blocked until real configuration and owner approvals exist.

## Rollback without losing intake

- Stop further release dispatches; keep the database and workers available where safe. Record the failure and current queue metadata using the private outbox CLI. Do not delete records, reset attempts or change signing keys merely to roll back code.
- If only the UI is broken, use the Cloudflare dashboard's rollback control for the recorded last known good production deployment ([official rollback procedure](https://developers.cloudflare.com/pages/configuration/rollbacks/), checked 2026-10-17). Confirm its baked API URL still addresses a compatible backend, then verify contact/product/article/privacy/action routes and headers.
- If the backend must roll back, first verify the prior commit understands the current enquiry/newsletter/job schema. Trigger that exact commit through the version-aware Render helper using the approved credentials in the protected release context; verify the reported version and readiness. Never use an unreviewed older template backend as a rollback target.
- Preserve Mongo data and job IDs. Leases expire naturally; the compatible worker resumes pending work. Slack can duplicate after ambiguous acceptance; reconcile stable references instead of blindly re-enqueuing.
- Restore prior DNS only from the captured reviewed snapshot, preserving MX and unrelated records. Confirm TLS and exact CORS/Turnstile origins. Never restore an old Mongo backup merely to revert application code.
- If this is the first working intake and no compatible previous deployment exists, withdraw or pause the new public intake with honest unavailable messaging while retaining saved records. Do not claim an invented rollback target.
- Repeat a labelled synthetic submission only with the approved message scope, correlate database/Gmail/Slack evidence, and record exactly which rollback actions were exercised.

## Failure response and ownership

The disabled five-minute monitor is best effort. At activation, assign an owner for GitHub failure notifications, daily queue review, Resend/Slack quotas, backup/retention execution and rollback decisions. Require actual alert receipt and a 24-hour observation record before closing production readiness. No automatic rollback can safely resolve an ambiguous delivery or incompatible schema.

## Local rollback evidence

At `2026-10-17T11:31:29.363440+00:00`, the isolated drill ran implementation `7d24f648607877355452919ca3e49b64257f8a72`, saved one synthetic enquiry, stopped only its owned API process and started compatible backend `5d6a078e6cb5bffc9885dbfbeb119d010639908d` from a Git archive. The same idempotency key returned the original receipt, the document remained byte-for-byte equal as decoded by Mongo, and both pending job identities/states survived. Restoring the current backend preserved the same data and readiness. Worker delivery was disabled deliberately to retain pending work; separate subprocess tests prove lease/retry recovery. No provider was contacted and the drill-owned database was removed afterward. This does not prove Cloudflare/Render/DNS rollback.
