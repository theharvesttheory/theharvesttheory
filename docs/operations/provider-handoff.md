# Provider activation handoff

Local implementation is prepared. Production Tasks 40–44 remain deferred until the owner supplies the inputs below. Nothing has been deployed or sent to real Gmail/Slack recipients. The final steps include actual inbox/channel observation and 24 hours of monitoring; code/tests alone cannot close them.

## One consolidated input checklist

| Area | Owner input / decision | Destination | Status |
| --- | --- | --- | --- |
| Domain | Final canonical website/API domains, Cloudflare zone access, current DNS and existing deployment owner | Nonsecret deployment configuration; DNS snapshot in private operations records | pending |
| Gmail | Team recipient address(es), controlled newsletter test inbox, actual support/reply contact | Render `NOTIFY_EMAILS`, `SUPPORT_EMAIL`; public approved support contact | pending; no Gmail password needed |
| Resend | Account, verified owned sender domain/address/name, scoped sending key, current quotas | Render `RESEND_API_KEY`, `SENDER_EMAIL`, `EMAIL_FROM_NAME` | pending |
| Slack | Approved workspace/channel, incoming webhook, incident owner | Render secret `SLACK_WEBHOOK_URL`; channel/owner in private handoff | pending |
| MongoDB Atlas | Project/cluster/region, TLS URI, dedicated database, least-privilege user, network allowlist, backup plan | Render secret `MONGO_URL`, config `DB_NAME`; Atlas network/backup settings | pending |
| Render | Account/service, approved always-on plan and region, exact egress/proxy behavior, API token and hook | Render service; GitHub production secrets `RENDER_API_TOKEN`, `RENDER_DEPLOY_HOOK_URL`; repository vars `RENDER_SERVICE_ID`, `RENDER_PLAN`, `PUBLIC_API_URL` | pending |
| Cloudflare Pages | Account, Direct Upload project, production branch `main`, scoped deploy token, preview URL and final custom domain | GitHub production secret `CLOUDFLARE_API_TOKEN`; repo vars `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT`, `PUBLIC_FRONTEND_URL` | pending |
| Turnstile | Site key, secret key, approved preview/final hostnames | Public repo var `TURNSTILE_SITE_KEY`; Render secret `TURNSTILE_SECRET_KEY`, config `TURNSTILE_HOSTNAMES` | pending |
| GitHub | Authorized repo/main push and release, environment reviewers/main restriction, failure-notification owner | Protected `production` environment; `DEPLOYMENT_ENABLED` remains absent/false | pending |
| Budget | Monthly cap and approval of exact services/tiers/regions after current pricing review | Owner decision; no purchase inferred from this document | pending |
| Business/privacy | Legal owner name/address, privacy contact, support contact, approved product/marketing facts | `frontend/src/data/launch-config.json` and [launch checklist](launch-content-checklist.md) | pending |
| Retention | Approve/replace draft 180-day enquiry, 7-day pending signup/completed payload, 30-day detailed outcome periods; suppression policy | Launch config, private scheduled retention command with explicit day values | pending |
| Operations | Incident owner, queue review, backup/restore owner, retention/export/delete handling, coverage schedule | Operations runbooks and actual service schedules | pending |
| Test messages | Permission for labelled synthetic acceptance messages covering nine forms, retries and newsletter lifecycle; approved recipients/channel/volume | Private acceptance record; no marketing-campaign authorization | pending |
| Cutover | Domain publishing approval, prior deployment/DNS snapshot and compatible rollback target | Task 43 release record | pending |

Provide nonsecret account/project/domain/owner decisions together. Put API keys, webhooks, database credentials and signing keys directly into the named secret stores; do not paste them into repository files or public workflow logs. Access can be granted through the provider accounts when setup is ready. Gmail is a recipient through Resend, so its password is not required.

## Generated application secrets and exposed legacy key

Generate independent random newsletter signing and rate-limit HMAC keys at activation and store them only in Render. Keep them stable across ordinary releases. A tracked legacy `EMERGENT_LLM_KEY` was found in repository history; revoke/rotate it before production. Its value is intentionally absent from this handoff. Do not copy legacy environment files into the new service.

## Activation sequence

1. Confirm the concrete account/service/region/tier/domain and message recipients against this checklist. Recheck current prices and quotas; no perpetual free-tier assumption is made.
2. Configure Atlas narrow network access, least-privilege user and backup policy. Verify TLS access and a separate-database restore from the actual service environment.
3. Verify the Resend domain using provider DNS records while preserving existing MX. Configure the approved Slack channel and controlled test recipients.
4. Create the reviewed Render service with production settings, worker enabled, fake modes forbidden, no independent Git auto-deploy, and validated proxy trust. Create Pages Direct Upload and Turnstile with exact origins. Keep custom-domain cutover pending.
5. Complete owner facts/approval flags and production build validation; commit only nonsecret configuration. Configure GitHub environment controls, then enable and run the manual same-commit release to preview URLs. Record actual CI/run/deploy IDs.
6. Submit each of the nine forms from preview, match browser receipts to Atlas, observe Gmail placement/reply-to and Slack references, and measure delivery times. Complete a received-link newsletter confirmation/unsubscribe lifecycle. Verify genuine Turnstile, CORS, replay and failure visibility.
7. Publish the reviewed custom domain only after those gates pass; verify TLS, headers, routes and a final-domain enquiry/newsletter lifecycle. Rehearse the reviewed rollback scope without deleting Mongo data.
8. Observe for 24 hours, confirm actual alert receipt/backup/retention ownership, and complete the production ledger. Retire any old Emergent resource only after explicit retirement authorization.

## Evidence still required

Actual Atlas connectivity/restore; Resend domain/delivery IDs; observed Gmail receipt and reply behavior; observed Slack channel messages; genuine Turnstile and deployed proxy checks; GitHub workflow and alert receipt; Render matching release; Pages deployment/headers/TLS; DNS/cutover and rollback record; approved owner/legal/content/retention facts; measured delivery timing and 24-hour observation.

Local simulator captures, mocked deployment responses and the local Pages runtime are useful engineering evidence but do not satisfy these external gates.
