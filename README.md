# The Harvest Theory

React catalogue and editorial website with FastAPI/MongoDB enquiry intake, confirmed newsletter signup and a durable notification worker.

Start the isolated local stack using [local-development.md](docs/operations/local-development.md). It runs on frontend 4300, API 8300 and a loopback notification simulator 8301; an existing local Mongo server is required. Local notification results are explicitly simulated.

The [production forms plan](docs/plans/2026-10-17-production-forms-plan.md), [readiness ledger](docs/operations/production-readiness.md), [configuration guide](docs/operations/configuration.md) and [launch content checklist](docs/operations/launch-content-checklist.md) distinguish local preparation from provider activation and public launch. Provider credentials are supplied only at final activation; none belong in this repository or the public frontend bundle.
