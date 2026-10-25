# Owner decisions before publication

Owner supplied the business identity and contacts, approved the four retention periods, and explicitly requested default privacy approval and newsletter opt-out/backup policy on 2026-10-25. These decisions are recorded in `frontend/src/data/launch-config.json`; business, retention and privacy approval flags are true. Active consent is retained while subscribed; minimal opt-out records remain until verified deletion or service closure; backups, where created, have a 30-day retention limit. This records owner authorization, not independent legal certification or proof that backup/deletion jobs are configured. See [data lifecycle procedures](data-retention-and-recovery.md).

| Item | Required decision/evidence | Current status |
| --- | --- | --- |
| Business identity | Legal/trading name, address and responsible owner for enquiries/privacy | Owner supplied The Harvest Theory, Jakkur, Bengaluru 560064; operational response ownership still to be recorded |
| Support and privacy contacts | Real monitored addresses; confirm who responds and how access/deletion requests are verified | Owner supplied contact@theharvesttheory.com for both; mailbox receipt and request handling remain to be verified |
| Retention | Approve/change enquiries 180 days, unconfirmed signup 7 days, completed payloads 7 days, redacted outcomes 30 days; define subscribed consent, suppression and backups | Four periods and default consent/suppression/30-day-backup policy approved on 2026-10-25. Scheduling and backup storage verification remain pending; approval does not run deletion |
| Processors | Actual Atlas/Render/Cloudflare/Resend/Gmail/Slack configuration, region and access owners; review privacy notice against actual setup | Pending |
| Product prices | Review every product/collection price, pack size and any placeholder values; choose honest enquiry-only copy where purchase is unavailable | Pending |
| FSSAI and certifications | Supply actual licence/certification evidence and approved display text, or remove unsupported claims before launch | Existing footer placeholders remain visibly pending |
| Ingredients and product claims | Review ingredients, allergens, nutrition, health/quality claims, sourcing and export statements | Pending; no certification/compliance claim inferred |
| Terms, shipping/returns and FAQ | Supply approved content/routes or explicitly leave unavailable without clickable affordances | Footer placeholders now plain text |
| Social profiles | Provide owned, approved Instagram/LinkedIn URLs or leave plain text | Owner supplied Instagram: https://www.instagram.com/theharvesttheory/; sharing parameter omitted. LinkedIn remains plain text |
| Enquiry response promise | Identify response owner and any approved response-time commitment | Receipt copy confirms saved enquiry only; product enquiry is not a purchase |
| Newsletter | Confirm consent wording, privacy contact and future campaign/suppression process | Owner accepted default notice and opt-out policy; signup/confirmation/unsubscribe implemented; no campaign sender included |
| Privacy approval | Review final notice with appropriate owner/adviser; advance notice version in shared contract if substance changes | Owner explicitly approved defaults on 2026-10-25. Initial notice finalized before first public frontend release; future published substantive changes require a new notice version. Tests are not legal certification |

Final activation updates the public launch configuration and reviewed source copy, reruns production validation and affected UI checks, and records the owner/date/evidence in the readiness ledger. Do not set approval booleans merely to bypass a failing build. Keep credentials out of this public configuration.
