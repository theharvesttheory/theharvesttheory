# Owner decisions before publication

Owner supplied the business identity and contact addresses and approved the four proposed retention periods on 2026-10-25. These values are recorded in `frontend/src/data/launch-config.json`; business and retention approval flags are true. Privacy approval remains false and suppression policy remains unset until reviewed. Local source/tests do not establish business, regulatory or legal facts. Production builds reject unresolved required values; local release verification remains possible with `BUILD_TARGET=local`.

| Item | Required decision/evidence | Current status |
| --- | --- | --- |
| Business identity | Legal/trading name, address and responsible owner for enquiries/privacy | Owner supplied The Harvest Theory, Jakkur, Bengaluru 560064; operational response ownership still to be recorded |
| Support and privacy contacts | Real monitored addresses; confirm who responds and how access/deletion requests are verified | Owner supplied contact@theharvesttheory.com for both; mailbox receipt and request handling remain to be verified |
| Retention | Approve/change enquiries 180 days, unconfirmed signup 7 days, completed payloads 7 days, redacted outcomes 30 days; define subscribed consent, suppression and backups | Four periods approved unchanged on 2026-10-25. Consent/suppression/backups and execution schedule remain pending; approval does not run deletion |
| Processors | Actual Atlas/Render/Cloudflare/Resend/Gmail/Slack configuration, region and access owners; review privacy notice against actual setup | Pending |
| Product prices | Review every product/collection price, pack size and any placeholder values; choose honest enquiry-only copy where purchase is unavailable | Pending |
| FSSAI and certifications | Supply actual licence/certification evidence and approved display text, or remove unsupported claims before launch | Existing footer placeholders remain visibly pending |
| Ingredients and product claims | Review ingredients, allergens, nutrition, health/quality claims, sourcing and export statements | Pending; no certification/compliance claim inferred |
| Terms, shipping/returns and FAQ | Supply approved content/routes or explicitly leave unavailable without clickable affordances | Footer placeholders now plain text |
| Social profiles | Provide owned, approved Instagram/LinkedIn URLs or leave plain text | No dummy clickable links |
| Enquiry response promise | Identify response owner and any approved response-time commitment | Receipt copy confirms saved enquiry only; product enquiry is not a purchase |
| Newsletter | Confirm consent wording, privacy contact and future campaign/suppression process | Signup/confirmation/unsubscribe implemented; no campaign sender included |
| Privacy approval | Review final notice with appropriate owner/adviser; advance notice version in shared contract if substance changes | Draft; route tests are not legal approval |

Final activation updates the public launch configuration and reviewed source copy, reruns production validation and affected UI checks, and records the owner/date/evidence in the readiness ledger. Do not set approval booleans merely to bypass a failing build. Keep credentials out of this public configuration.
