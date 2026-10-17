# Delivery operations

Production service, incident owner and alert destination remain pending final provider setup. Local verification is not Gmail or Slack delivery proof.

Use a trusted operator shell in the repository with the backend environment loaded. Never paste credentials into command arguments or shared logs. Locally substitute `backend/.venv-intake/bin/python` for the interpreter below.

```bash
backend/.venv/bin/python backend/scripts/outbox_admin.py summary
backend/.venv/bin/python backend/scripts/outbox_admin.py inspect --id RECORD_UUID
backend/.venv/bin/python backend/scripts/outbox_admin.py retry --id RECORD_UUID --channel ops_email --job-id JOB_UUID --generation GENERATION_UUID --dry-run
```

Inspect displays IDs, state and timestamps, not submitted content. Both current and historical newsletter jobs are included. Investigate oldest due work above five minutes, any dead/unknown result, or heartbeat older than 30 seconds. Public `/api/health/delivery` exposes only status; `/api/health/ready` checks durable intake dependencies and the worker loop independently. The CI monitor is prepared in Task 35 and remains disabled until activation.

The worker has two concurrent delivery slots, approximately two-second polling, ten-second provider requests, 60-second leases, eight automatic claims and a 23-hour automatic retry window. Backoff is 5 seconds, 30 seconds, 2 minutes, 10 minutes, 30 minutes and 2 hours, with bounded jitter and Retry-After. Attempts and the first-attempt timestamp survive restart. Startup does not reset a queue. A crash during sending leaves a lease that expires; use the normal restart path before manually replaying.

`accepted` means the provider accepted the API request, not inbox delivery. `simulated` is local-only. `unknown` means the provider may have accepted a request whose acknowledgement was lost. Resend retries retain the original immutable payload and idempotency key during the automatic window. Slack has no comparable webhook idempotency guarantee: a timed-out request can produce a duplicate with the same reference.

Before replay, look up the stable reference and provider ID in the actual Resend dashboard and the approved Slack channel. Record the finding in a private incident record. Do not put recipient addresses, submitted content or credentials into the CLI reconciliation note; use the incident reference. Fix revoked credentials or quota problems before retrying. Cancelled, completed, leased and obsolete confirmation jobs cannot be retried.

```bash
backend/.venv/bin/python backend/scripts/outbox_admin.py retry --id RECORD_UUID --channel ops_email --job-id JOB_UUID --generation GENERATION_UUID --apply --reconciliation 'INCIDENT-123 provider reconciliation complete' --allow-possible-duplicate
```

The CLI defaults to dry-run. Ambiguous jobs and jobs older than the automatic window require both an explicit possible-duplicate decision and a reconciliation note. Within the window the job key/payload remain unchanged; outside it a new job identity and retry window are recorded alongside an audit entry. This is an operator-authorized possible resend. Inspect immediately before applying; identity/generation/state checks reject stale selections. A new newsletter signup must never reactivate an old confirmation link.

For a paused or failed loop, inspect readiness and sanitized service logs, repair the dependency/configuration, restart the application, and check heartbeat and queue age. Do not delete pending jobs to make the health signal green. If a provider outage persists, intake can continue to save acknowledged enquiries while delivery health is degraded. Escalate to the designated owner and communicate delays without claiming delivery.

Final handover must record: actual service and alert owners, monitoring schedule, real delivery timings, provider reconciliation procedure, backup/restore results and the completed 24-hour observation window. These remain external gates.

Local subprocess proof: an email outage left its job retryable while Slack completed; restarting preserved attempts and first-attempt time. Abrupt process exit after simulated acceptance recovered the same key/payload after lease expiry. The persistent simulator deduplicated email while Slack recorded a possible duplicate. After 23 hours, recovery paused without an HTTP send. This is simulator evidence, not an actual Resend/Slack guarantee. The worker uses fixed bounded leases rather than a lease-renewal loop; expiry and stale-owner fencing are covered directly. Aggregate `delivery_metrics` logs are emitted at most every 30 seconds with counts/age/heartbeat only.
