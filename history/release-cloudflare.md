# Cloudflare release — SKYNOMADS

## Authorization and target

- User explicitly requested committing/pushing all intended project changes to `main` and deploying to Cloudflare.
- Target account: **PENDING user clarification**. User explicitly excluded ELDOC; no deployment or mutation was performed there. The connected Cloudflare API tool is scoped to ELDOC and must not be used for deployment.
- Proposed Worker name: `akim-skynomads`; final workers.dev hostname depends on the selected account. Do not deploy until target account is confirmed and authenticated.

## Plan

- Native Worker HTTP adapter calls the same validated Score service/OpenAI module as Express; JSON is bundled, SPA/assets on same origin. Local Express launch remains supported.
- `OPENAI_API_KEY` uploaded as a Worker secret, never committed or logged. Public inference limited to 10 valid requests per IP per minute per Cloudflare location (best-effort limit, not a global spend cap).
- No database, migrations, production-data changes or custom DNS.
- Preflight: tests/typecheck/build, Worker dry-run and local Worker API smoke before push/deploy.
- Publication: inspect staged diff and secrets; commit intended paths; push `main` without force.
- After deploy: verify URL, images/fonts, catalog, invalid POST, valid POST with real AI, and browser.

## Recovery

First deployment: no prior Worker version to roll back to. If deployment/smoke fails, stop and record failure; do not touch other Workers. Correction deploy or disabling/removing the new Worker requires explicit user direction if destructive. Later releases can use `wrangler rollback <previous-version-id>` after authorization. Local `yarn serve` remains a demo fallback.

## Evidence / state

- At preflight local Wrangler reported unauthenticated. User must authenticate the chosen non-ELDOC account; previous ELDOC suggestion withdrawn.
- Release candidate revision: `757430d` (`feat: add Cloudflare Workers deployment for city simulator`). Successfully pushed to `origin/main`; earlier submission-preparation work is included in preceding commit `fb1a7b0`.
- Deployment: **BLOCKED pending user authentication and target selection**. Wrangler still reports unauthenticated; no deployment URL is claimed.
- Local candidate verification: `yarn verify` — 12/12 tests, typecheck/build passed; `yarn cf:check` — Worker bundle dry-run passed (28.78 KiB, gzip 6.41 KiB, assets + rate limiter). Wrangler local runtime on 8789 served SPA and catalog, returned example cost 95 / Score 56.54 and explicit missing-key error. Local Express `yarn smoke` still passes.
- No mutations to any Cloudflare account have been performed. Awaiting non-ELDOC account login/selection before deployment.
