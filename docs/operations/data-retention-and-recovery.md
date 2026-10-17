# Data lifecycle and restore procedures

Production owner, policy approval, backup tier, encrypted-storage destination, recovery objectives and schedule remain pending final activation. Proposed values are not approved deletion instructions. Local verification uses synthetic data only.

## Review and retention

Run from the repo root with a trusted backend environment. This workstation uses `backend/.venv-intake/bin/python`; substitute your installed backend interpreter elsewhere.

```bash
backend/.venv-intake/bin/python backend/scripts/data_admin.py retention --scope all --dry-run
```

The default report contains counts, not personal fields or payloads. Proposed defaults: enquiries 180 days; unconfirmed signup generations 7 days; completed notification payloads 7 days; detailed delivery outcomes 30 days. Options `--enquiry-days`, `--pending-days`, `--payload-days`, `--outcome-days` make the reviewed policy explicit. A new signup generation starts its own pending-retention clock.

Any active or historical pending/sending/retry/unknown/dead job prevents automatic record deletion and appears in `review_required`. Completed payloads can still be redacted independently. After 30 days, completed historical jobs are removed; active slots retain only a minimal identity/generation/channel/terminal-state marker so receipt deduplication and newsletter transitions remain safe. Detailed outcomes and payloads are removed. This minimal marker remains until parent-record deletion. Confirmed subscribers and unsubscribed suppression addresses are not automatically deleted by this initial policy; the owner must define their consent/suppression schedule before launch.

After the owner has approved actual values, inspect a dry-run for the exact environment, record the operator/incident and apply with the exact configured database name:

```bash
backend/.venv-intake/bin/python backend/scripts/data_admin.py retention --scope enquiries --database EXACT_REVIEWED_DATABASE --policy-approved --apply
```

The CLI refuses a missing/mismatched database or missing policy approval. It fences each mutation against the reviewed job/state/generation snapshot; if a worker or signup changes the record, `concurrent_skips` increases and the record survives. Re-review instead of forcing a stale mutation. Schedule this command only after the actual owner, database and retention values are approved, with private execution logs and failure alerts.

## Exact export and deletion

First verify the requester's identity through the owner-approved process. No public listing/admin route exists.

```bash
backend/.venv-intake/bin/python backend/scripts/data_admin.py export --collection enquiries --id RECORD_UUID --output /PRIVATE_DIRECTORY/request-export.json
backend/.venv-intake/bin/python backend/scripts/data_admin.py delete --collection enquiries --id RECORD_UUID --dry-run
backend/.venv-intake/bin/python backend/scripts/data_admin.py delete --collection enquiries --id RECORD_UUID --database EXACT_REVIEWED_DATABASE --apply
```

Exports contain personal record fields but exclude queued notification payloads and bearer links. Output is a newly created mode-0600 file; existing files are not overwritten and personal data is not printed. Use an access-controlled encrypted destination and the approved transfer process. Delete the export after its purpose ends. Exact deletion rejects unresolved deliveries until an operator reconciles them. Deletion does not retract email/Slack copies or erase backups: the final policy must cover processors and backup expiry, and restore must reapply approved deletion/suppression records before reopening service.

## Backup and restore

Use Atlas-native backups/snapshots or another explicitly approved consistent backup mechanism for live traffic. An ordinary ad hoc dump during concurrent writes is not a proved point-in-time backup. Confirm the chosen tier's actual features, cadence, retention, encryption at rest, encryption in transit, key/access owners and recovery objectives at activation. Keep encryption keys and backup data under separate least-privilege controls; never put them in Git, CI artifacts or frontend configuration. Use secure credential stores or a restricted Mongo tools config file, not a credential-bearing URI in shell history or process arguments.

Restore into a new, empty, separately named database using a restricted restore user. Do not restore over the live intake database to roll back code. Validate collection counts, exact synthetic/control samples, unique/TTL indexes, newsletter states, pending jobs and dedupe identities. Test the restored service with live delivery disabled in an isolated environment so old jobs cannot resend accidentally. Reconcile queued jobs/provider acceptance and approved deletions before any recovery cutover. Record the restore timestamp and database/backup references, not customer content.

Reproduce the local synthetic BSON drill:

```bash
backend/.venv-intake/bin/python scripts/verify-local-backup.py
```

It requires `mongodump` and `mongorestore`, creates fresh `tht_backupcheck_<uuid>` and `tht_restorecheck_<uuid>` databases on loopback, restores into the separate target, compares documents and indexes, proves a pending job survives, then deletes only its generated databases and plaintext synthetic archive. A private evidence JSON remains under `.local/backup-drill/`. It does not select/configure production encryption, backup storage or scheduling.

Observed local drill at 2026-10-17T11:02:43Z: two enquiries and one subscriber restored exactly; unique indexes matched and a pending job survived. Archive SHA-256: `f6ce55e3849bacad76ab3b31f3c12adb6c28d4363456c02ea8ea03453af58698`. This is local synthetic restore evidence, not an Atlas backup guarantee.

## Credential rotation

Rotate provider keys/webhooks in the provider and secret store, deploy validated configuration, and run approved labelled acceptance checks. Preserve queued immutable payloads and job identities. Newsletter signing-key rotation invalidates old links; use the confirmation resend path and document the window. Rate-limit HMAC-key rotation starts new keyed buckets. Revoke any actual credentials previously committed only after identifying their provenance and replacement path; never print them while auditing.
